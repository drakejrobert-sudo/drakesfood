import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { getBlogNotificationPost } from './blog-notification-posts.mjs';

const SIGNUP_SUCCESS_MESSAGE = 'If that email can be subscribed, a confirmation link is on the way.';
const CONFIRMATION_SUCCESS_REDIRECT = '/blog?subscription=confirmed';
const CONFIRMATION_FAILURE_REDIRECT = '/blog?subscription=invalid';
const UNSUBSCRIBE_SUCCESS_REDIRECT = '/blog?subscription=unsubscribed';
const DEFAULT_MAX_BODY_BYTES = 8 * 1024;
const DEFAULT_NOTIFICATION_BATCH_SIZE = 5;
const DEFAULT_NOTIFICATION_MAX_RECIPIENTS = 50;
const EMAIL_LIMIT = 254;

let dynamoClient;
let dynamoModule;
let sesClient;
let sesModule;

export const createHandler = ({
  now = () => new Date(),
  uuid = randomUUID,
  createToken = () => randomBytes(32).toString('base64url'),
  findSubscriberByEmailHash = findSubscriberByEmailHashInDynamoDb,
  findSubscriberByConfirmationTokenHash = findSubscriberByConfirmationTokenHashInDynamoDb,
  findSubscriberByUnsubscribeTokenHash = findSubscriberByUnsubscribeTokenHashInDynamoDb,
  savePendingSubscriber = savePendingSubscriberToDynamoDb,
  activateSubscriber = activateSubscriberInDynamoDb,
  unsubscribeSubscriber = unsubscribeSubscriberInDynamoDb,
  sendConfirmation = sendConfirmationEmail,
  sendAdminNotification = sendAdminNotificationEmail,
  getBlogPost = getBlogNotificationPost,
  listActiveSubscribers = listActiveSubscribersFromDynamoDb,
  reserveNotificationSend = reserveNotificationSendInDynamoDb,
  completeNotificationSend = completeNotificationSendInDynamoDb,
  sendBlogNotification = sendBlogNotificationEmail,
} = {}) => async (event = {}) => {
  if (event.action === 'sendBlogPostNotification') {
    return sendBlogPostNotification(event, {
      now,
      getBlogPost,
      listActiveSubscribers,
      reserveNotificationSend,
      completeNotificationSend,
      sendBlogNotification,
    });
  }

  const method = getMethod(event);
  const path = getPath(event);

  if (method === 'GET' && path.endsWith('/blog-subscriptions/confirm')) {
    return confirmSubscription(event, { now, findSubscriberByConfirmationTokenHash, activateSubscriber, sendAdminNotification });
  }

  if (method === 'GET' && path.endsWith('/blog-subscriptions/unsubscribe')) {
    return renderUnsubscribeConfirmation(event, { findSubscriberByUnsubscribeTokenHash });
  }

  if (method === 'POST' && path.endsWith('/blog-subscriptions/unsubscribe')) {
    return unsubscribeFromBlog(event, { now, findSubscriberByUnsubscribeTokenHash, unsubscribeSubscriber, sendAdminNotification });
  }

  if (method !== 'POST') {
    return jsonResponse(405, {
      success: false,
      message: 'Blog subscriptions only accept POST requests.',
    });
  }

  if (!isAllowedOrigin(event)) {
    return jsonResponse(403, {
      success: false,
      message: 'Blog subscriptions are not available from this origin.',
    });
  }

  if (!isJsonContentType(event)) {
    return jsonResponse(415, {
      success: false,
      message: 'Please send blog subscriptions as JSON.',
    });
  }

  let body;

  try {
    body = parseBody(event, getMaxBodyBytes());
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return jsonResponse(413, {
        success: false,
        message: 'Please use a shorter email address and try again.',
      });
    }

    return jsonResponse(400, {
      success: false,
      message: 'Please send a valid JSON blog subscription.',
    });
  }

  const normalized = normalizeSignupBody(body);

  if (!normalized.valid) {
    return jsonResponse(400, {
      success: false,
      message: normalized.message,
    });
  }

  if (normalized.values.website) {
    console.info('Blog subscription ignored by spam filter.');

    return jsonResponse(200, {
      success: true,
      message: SIGNUP_SUCCESS_MESSAGE,
    });
  }

  const emailHash = hashValue(normalized.values.email);
  let existingSubscriber;

  try {
    existingSubscriber = await findExistingSubscriber(emailHash, findSubscriberByEmailHash);
  } catch {
    return jsonResponse(500, {
      success: false,
      message: 'Blog subscriptions are temporarily unavailable. Please try again later.',
    });
  }

  if (existingSubscriber?.status === 'active') {
    return jsonResponse(200, {
      success: true,
      message: SIGNUP_SUCCESS_MESSAGE,
    });
  }

  const confirmationToken = createToken();
  const unsubscribeToken = createToken();
  const deliverableUnsubscribeToken = existingSubscriber?.unsubscribeToken || unsubscribeToken;
  const timestamp = now().toISOString();
  const subscriber = {
    subscriberId: existingSubscriber?.subscriberId || uuid(),
    emailNormalized: normalized.values.email,
    emailHash,
    status: 'pending',
    createdAt: existingSubscriber?.createdAt || timestamp,
    updatedAt: timestamp,
    confirmationTokenHash: hashValue(confirmationToken),
    unsubscribeToken: deliverableUnsubscribeToken,
    unsubscribeTokenHash: hashValue(deliverableUnsubscribeToken),
    source: process.env.BLOG_SUBSCRIPTIONS_SOURCE_SITE || 'drakesfood.com',
  };

  try {
    await savePendingSubscriber(subscriber);
  } catch (error) {
    console.error('Failed to save blog subscriber.', {
      errorName: error?.name,
      subscriberId: subscriber.subscriberId,
    });

    return jsonResponse(500, {
      success: false,
      message: 'Blog subscriptions are temporarily unavailable. Please try again later.',
    });
  }

  try {
    await sendConfirmation(subscriber, confirmationToken);
  } catch (error) {
    console.error('Failed to send blog subscription confirmation.', {
      errorName: error?.name,
      subscriberId: subscriber.subscriberId,
    });
  }

  return jsonResponse(200, {
    success: true,
    message: SIGNUP_SUCCESS_MESSAGE,
  });
};

export const handler = createHandler();

async function confirmSubscription(event, { now, findSubscriberByConfirmationTokenHash, activateSubscriber, sendAdminNotification }) {
  const token = getQueryStringParameter(event, 'token');
  const siteUrl = getSiteUrl();

  if (!token) {
    return redirectResponse(`${siteUrl}${CONFIRMATION_FAILURE_REDIRECT}`);
  }

  const confirmationTokenHash = hashValue(token);
  const subscriber = await findSubscriberByConfirmationTokenHash(confirmationTokenHash);

  if (!subscriber || subscriber.status !== 'pending') {
    return redirectResponse(`${siteUrl}${CONFIRMATION_FAILURE_REDIRECT}`);
  }

  try {
    const confirmedAt = now().toISOString();
    await activateSubscriber(subscriber.emailHash, confirmedAt);
    await trySendAdminNotification(sendAdminNotification, 'confirmed', subscriber, confirmedAt);
  } catch (error) {
    console.error('Failed to confirm blog subscriber.', {
      errorName: error?.name,
      subscriberId: subscriber.subscriberId,
    });

    return redirectResponse(`${siteUrl}${CONFIRMATION_FAILURE_REDIRECT}`);
  }

  return redirectResponse(`${siteUrl}${CONFIRMATION_SUCCESS_REDIRECT}`);
}

async function renderUnsubscribeConfirmation(event, { findSubscriberByUnsubscribeTokenHash }) {
  const token = getQueryStringParameter(event, 'token');
  const siteUrl = getSiteUrl();

  if (!token) {
    return redirectResponse(`${siteUrl}${CONFIRMATION_FAILURE_REDIRECT}`);
  }

  const unsubscribeTokenHash = hashValue(token);
  const subscriber = await findSubscriberByUnsubscribeTokenHash(unsubscribeTokenHash);

  if (!subscriber) {
    return redirectResponse(`${siteUrl}${CONFIRMATION_FAILURE_REDIRECT}`);
  }

  if (subscriber.status === 'unsubscribed') {
    return htmlResponse(200, buildUnsubscribeCompleteHtml(siteUrl));
  }

  return htmlResponse(200, buildUnsubscribeConfirmationHtml(token, siteUrl));
}

async function unsubscribeFromBlog(event, { now, findSubscriberByUnsubscribeTokenHash, unsubscribeSubscriber, sendAdminNotification }) {
  const token = getQueryStringParameter(event, 'token');
  const siteUrl = getSiteUrl();

  if (!token) {
    return redirectResponse(`${siteUrl}${CONFIRMATION_FAILURE_REDIRECT}`);
  }

  const unsubscribeTokenHash = hashValue(token);
  const subscriber = await findSubscriberByUnsubscribeTokenHash(unsubscribeTokenHash);

  if (!subscriber) {
    return redirectResponse(`${siteUrl}${CONFIRMATION_FAILURE_REDIRECT}`);
  }

  if (subscriber.status === 'unsubscribed') {
    return redirectResponse(`${siteUrl}${UNSUBSCRIBE_SUCCESS_REDIRECT}`);
  }

  try {
    const unsubscribedAt = now().toISOString();
    await unsubscribeSubscriber(subscriber.emailHash, unsubscribedAt);
    await trySendAdminNotification(sendAdminNotification, 'unsubscribed', subscriber, unsubscribedAt);
  } catch (error) {
    console.error('Failed to unsubscribe blog subscriber.', {
      errorName: error?.name,
      subscriberId: subscriber.subscriberId,
    });

    return redirectResponse(`${siteUrl}${CONFIRMATION_FAILURE_REDIRECT}`);
  }

  return redirectResponse(`${siteUrl}${UNSUBSCRIBE_SUCCESS_REDIRECT}`);
}

async function sendBlogPostNotification(event, { now, getBlogPost, listActiveSubscribers, reserveNotificationSend, completeNotificationSend, sendBlogNotification }) {
  const postSlug = typeof event.postSlug === 'string' ? event.postSlug.trim() : '';
  const dryRun = event.dryRun === true || event.dryRun === 'true';

  if (!postSlug) {
    return internalResponse(400, {
      success: false,
      message: 'Please provide a blog post slug.',
    });
  }

  const post = getBlogPost(postSlug);

  if (!post) {
    return internalResponse(404, {
      success: false,
      message: `No blog notification metadata found for "${postSlug}".`,
    });
  }

  const subscribers = await listActiveSubscribers();
  const sendStartedAt = now().toISOString();
  const maxRecipients = getNotificationMaxRecipients();
  const overRecipientLimit = subscribers.length > maxRecipients;

  if (dryRun) {
    return internalResponse(200, {
      success: true,
      dryRun,
      postSlug,
      recipientCount: subscribers.length,
      maxRecipients,
      overRecipientLimit,
      sentCount: 0,
      failedCount: 0,
      message: overRecipientLimit
        ? `Dry run found ${subscribers.length} active subscriber(s), which exceeds the V1 safety cap of ${maxRecipients}. Real send will be blocked.`
        : `Dry run found ${subscribers.length} active subscriber(s) for ${post.title}.`,
    });
  }

  if (overRecipientLimit) {
    return internalResponse(400, {
      success: false,
      dryRun,
      postSlug,
      recipientCount: subscribers.length,
      maxRecipients,
      sentCount: 0,
      failedCount: 0,
      message: `Real send blocked because ${subscribers.length} active subscriber(s) exceeds the V1 safety cap of ${maxRecipients}.`,
    });
  }

  if (sendBlogNotification === sendBlogNotificationEmail && !process.env.SES_SENDER_EMAIL) {
    return internalResponse(500, {
      success: false,
      dryRun,
      postSlug,
      recipientCount: subscribers.length,
      sentCount: 0,
      failedCount: 0,
      message: 'SES sender email is not configured; notification was not reserved or sent.',
    });
  }

  try {
    await reserveNotificationSend({
      postSlug,
      status: 'sending',
      dryRun: 'false',
      startedAt: sendStartedAt,
      recipientCount: String(subscribers.length),
      sentCount: '0',
      failedCount: '0',
    });
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') {
      return internalResponse(409, {
        success: false,
        duplicate: true,
        postSlug,
        message: `Notification for "${postSlug}" was already sent or is already in progress.`,
      });
    }

    throw error;
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const subscriberBatch of chunkArray(subscribers, DEFAULT_NOTIFICATION_BATCH_SIZE)) {
    const results = await Promise.allSettled(subscriberBatch.map((subscriber) => sendBlogNotification(post, subscriber)));

    for (const [index, result] of results.entries()) {
      const subscriber = subscriberBatch[index];

      if (result.status === 'fulfilled') {
        sentCount += 1;
        continue;
      }

      failedCount += 1;
      console.error('Failed to send blog post notification.', {
        errorName: result.reason?.name,
        postSlug,
        subscriberId: subscriber.subscriberId,
      });
    }
  }

  const status = failedCount > 0 ? 'failed' : 'sent';

  await completeNotificationSend(postSlug, {
    status,
    completedAt: now().toISOString(),
    recipientCount: String(subscribers.length),
    sentCount: String(sentCount),
    failedCount: String(failedCount),
  });

  console.info('Blog post notification send completed.', {
    postSlug,
    recipientCount: subscribers.length,
    sentCount,
    failedCount,
  });

  return internalResponse(200, {
    success: failedCount === 0,
    dryRun,
    postSlug,
    recipientCount: subscribers.length,
    sentCount,
    failedCount,
    message: `Sent ${sentCount} blog notification(s) for ${post.title}; ${failedCount} failed.`,
  });
}

async function findExistingSubscriber(emailHash, findSubscriberByEmailHash) {
  try {
    return await findSubscriberByEmailHash(emailHash);
  } catch (error) {
    console.error('Failed to look up blog subscriber.', {
      errorName: error?.name,
    });

    throw error;
  }
}

function getMethod(event) {
  return event.requestContext?.http?.method ?? event.httpMethod ?? '';
}

function getPath(event) {
  return event.rawPath ?? event.path ?? '';
}

function parseBody(event, maxBodyBytes) {
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : event.body;

  if (!rawBody) {
    throw new Error('Missing body');
  }

  if (Buffer.byteLength(rawBody, 'utf8') > maxBodyBytes) {
    throw new RequestBodyTooLargeError();
  }

  const parsed = JSON.parse(rawBody);

  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('Invalid body');
  }

  return parsed;
}

function isAllowedOrigin(event) {
  const origin = getHeader(event, 'origin');

  if (!origin) {
    return true;
  }

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return allowedOrigins.length === 0 || allowedOrigins.includes(origin);
}

function isJsonContentType(event) {
  const contentType = getHeader(event, 'content-type');

  return !contentType || contentType.toLowerCase().includes('application/json');
}

function getHeader(event, headerName) {
  const headers = event.headers || {};
  const matchingKey = Object.keys(headers).find((key) => key.toLowerCase() === headerName);

  return matchingKey ? headers[matchingKey] : '';
}

function getQueryStringParameter(event, parameterName) {
  return event.queryStringParameters?.[parameterName] || '';
}

function getMaxBodyBytes() {
  const configuredLimit = Number.parseInt(process.env.BLOG_SUBSCRIPTIONS_MAX_BODY_BYTES || '', 10);

  return Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : DEFAULT_MAX_BODY_BYTES;
}

function getNotificationMaxRecipients() {
  const configuredLimit = Number.parseInt(process.env.BLOG_NOTIFICATION_MAX_RECIPIENTS || '', 10);

  return Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : DEFAULT_NOTIFICATION_MAX_RECIPIENTS;
}

function normalizeSignupBody(body) {
  const values = {
    email: '',
    website: '',
  };

  for (const field of ['email', 'website']) {
    if (body[field] === undefined || body[field] === null) {
      continue;
    }

    if (typeof body[field] !== 'string') {
      return { valid: false, message: 'Please enter a valid email address.', values };
    }

    values[field] = body[field].trim();
  }

  values.email = values.email.toLowerCase();

  if (!values.email || values.email.length > EMAIL_LIMIT || !isValidEmail(values.email)) {
    return { valid: false, message: 'Please enter a valid email address.', values };
  }

  return { valid: true, message: '', values };
}

async function findSubscriberByEmailHashInDynamoDb(emailHash) {
  const tableName = getTableName();
  const { DynamoDBClient, GetItemCommand } = await loadDynamoDbClient();
  const client = dynamoClient ?? new DynamoDBClient({});
  dynamoClient = client;

  const response = await client.send(
    new GetItemCommand({
      TableName: tableName,
      Key: {
        emailHash: { S: emailHash },
      },
    }),
  );

  return response.Item ? fromDynamoDbItem(response.Item) : undefined;
}

async function findSubscriberByConfirmationTokenHashInDynamoDb(confirmationTokenHash) {
  const tableName = getTableName();
  const { DynamoDBClient, QueryCommand } = await loadDynamoDbClient();
  const client = dynamoClient ?? new DynamoDBClient({});
  dynamoClient = client;

  const response = await client.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'confirmationTokenHash-index',
      KeyConditionExpression: 'confirmationTokenHash = :confirmationTokenHash',
      ExpressionAttributeValues: {
        ':confirmationTokenHash': { S: confirmationTokenHash },
      },
      Limit: 1,
    }),
  );

  return response.Items?.[0] ? fromDynamoDbItem(response.Items[0]) : undefined;
}

async function findSubscriberByUnsubscribeTokenHashInDynamoDb(unsubscribeTokenHash) {
  const tableName = getTableName();
  const { DynamoDBClient, QueryCommand } = await loadDynamoDbClient();
  const client = dynamoClient ?? new DynamoDBClient({});
  dynamoClient = client;

  const response = await client.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'unsubscribeTokenHash-index',
      KeyConditionExpression: 'unsubscribeTokenHash = :unsubscribeTokenHash',
      ExpressionAttributeValues: {
        ':unsubscribeTokenHash': { S: unsubscribeTokenHash },
      },
      Limit: 1,
    }),
  );

  return response.Items?.[0] ? fromDynamoDbItem(response.Items[0]) : undefined;
}

async function savePendingSubscriberToDynamoDb(subscriber) {
  const tableName = getTableName();
  const { DynamoDBClient, PutItemCommand } = await loadDynamoDbClient();
  const client = dynamoClient ?? new DynamoDBClient({});
  dynamoClient = client;

  await client.send(
    new PutItemCommand({
      TableName: tableName,
      Item: toDynamoDbItem(subscriber),
    }),
  );
}

async function activateSubscriberInDynamoDb(emailHash, confirmedAt) {
  const tableName = getTableName();
  const { DynamoDBClient, UpdateItemCommand } = await loadDynamoDbClient();
  const client = dynamoClient ?? new DynamoDBClient({});
  dynamoClient = client;

  await client.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        emailHash: { S: emailHash },
      },
      UpdateExpression: 'SET #status = :active, confirmedAt = :confirmedAt, updatedAt = :confirmedAt REMOVE confirmationTokenHash',
      ConditionExpression: '#status = :pending',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':active': { S: 'active' },
        ':pending': { S: 'pending' },
        ':confirmedAt': { S: confirmedAt },
      },
    }),
  );
}

async function unsubscribeSubscriberInDynamoDb(emailHash, unsubscribedAt) {
  const tableName = getTableName();
  const { DynamoDBClient, UpdateItemCommand } = await loadDynamoDbClient();
  const client = dynamoClient ?? new DynamoDBClient({});
  dynamoClient = client;

  await client.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        emailHash: { S: emailHash },
      },
      UpdateExpression: 'SET #status = :unsubscribed, unsubscribedAt = :unsubscribedAt, updatedAt = :unsubscribedAt REMOVE confirmationTokenHash',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':unsubscribed': { S: 'unsubscribed' },
        ':unsubscribedAt': { S: unsubscribedAt },
      },
    }),
  );
}

async function listActiveSubscribersFromDynamoDb() {
  const tableName = getTableName();
  const { DynamoDBClient, ScanCommand } = await loadDynamoDbClient();
  const client = dynamoClient ?? new DynamoDBClient({});
  dynamoClient = client;
  const subscribers = [];
  let exclusiveStartKey;

  do {
    const response = await client.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: exclusiveStartKey,
        FilterExpression: '#status = :active AND attribute_exists(unsubscribeToken)',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':active': { S: 'active' },
        },
      }),
    );

    for (const item of response.Items || []) {
      subscribers.push(fromDynamoDbItem(item));
    }

    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return subscribers;
}

async function reserveNotificationSendInDynamoDb(item) {
  const tableName = getNotificationSendsTableName();
  const { DynamoDBClient, PutItemCommand } = await loadDynamoDbClient();
  const client = dynamoClient ?? new DynamoDBClient({});
  dynamoClient = client;

  await client.send(
    new PutItemCommand({
      TableName: tableName,
      Item: toDynamoDbItem(item),
      ConditionExpression: 'attribute_not_exists(postSlug)',
    }),
  );
}

async function completeNotificationSendInDynamoDb(postSlug, values) {
  const tableName = getNotificationSendsTableName();
  const { DynamoDBClient, UpdateItemCommand } = await loadDynamoDbClient();
  const client = dynamoClient ?? new DynamoDBClient({});
  dynamoClient = client;

  await client.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        postSlug: { S: postSlug },
      },
      UpdateExpression:
        'SET #status = :status, completedAt = :completedAt, recipientCount = :recipientCount, sentCount = :sentCount, failedCount = :failedCount',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': { S: values.status },
        ':completedAt': { S: values.completedAt },
        ':recipientCount': { S: values.recipientCount },
        ':sentCount': { S: values.sentCount },
        ':failedCount': { S: values.failedCount },
      },
    }),
  );
}

async function sendConfirmationEmail(subscriber, confirmationToken) {
  const senderEmail = process.env.SES_SENDER_EMAIL;

  if (!senderEmail) {
    console.warn('Blog subscription confirmation skipped because SES sender is not configured.', {
      subscriberId: subscriber.subscriberId,
    });
    return;
  }

  const { SESClient, SendEmailCommand } = await loadSesClient();
  const client = sesClient ?? new SESClient({});
  sesClient = client;

  await client.send(
    new SendEmailCommand({
      Source: senderEmail,
      Destination: {
        ToAddresses: [subscriber.emailNormalized],
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: "Confirm your Drake's Food emails",
        },
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: formatConfirmationEmail(confirmationToken),
          },
        },
      },
    }),
  );
}

async function sendBlogNotificationEmail(post, subscriber) {
  const senderEmail = process.env.SES_SENDER_EMAIL;

  if (!senderEmail) {
    throw new Error('Missing SES_SENDER_EMAIL');
  }

  const { SESClient, SendEmailCommand } = await loadSesClient();
  const client = sesClient ?? new SESClient({});
  sesClient = client;

  await client.send(
    new SendEmailCommand({
      Source: senderEmail,
      Destination: {
        ToAddresses: [subscriber.emailNormalized],
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: `New Drake's Food post: ${post.title}`,
        },
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: formatBlogNotificationEmail(post, subscriber),
          },
        },
      },
    }),
  );
}

async function sendAdminNotificationEmail(eventType, subscriber, timestamp) {
  const recipientEmail = process.env.BLOG_SUBSCRIPTIONS_ADMIN_RECIPIENT_EMAIL;

  if (!recipientEmail) {
    return;
  }

  const senderEmail = process.env.SES_SENDER_EMAIL;

  if (!senderEmail) {
    throw new Error('Missing SES_SENDER_EMAIL');
  }

  const { SESClient, SendEmailCommand } = await loadSesClient();
  const client = sesClient ?? new SESClient({});
  sesClient = client;

  await client.send(
    new SendEmailCommand({
      Source: senderEmail,
      Destination: {
        ToAddresses: [recipientEmail],
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: `Drakesfood Blog Subscription Alert: ${eventType}`,
        },
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: formatAdminNotificationEmail(eventType, subscriber, timestamp),
          },
        },
      },
    }),
  );
}

async function trySendAdminNotification(sendAdminNotification, eventType, subscriber, timestamp) {
  try {
    await sendAdminNotification(eventType, subscriber, timestamp);
  } catch (error) {
    console.error('Failed to send blog subscription admin notification.', {
      errorName: error?.name,
      eventType,
      subscriberId: subscriber.subscriberId,
    });
  }
}

async function loadDynamoDbClient() {
  if (dynamoModule) {
    return dynamoModule;
  }

  dynamoModule = await import('@aws-sdk/client-dynamodb');

  return dynamoModule;
}

async function loadSesClient() {
  if (sesModule) {
    return sesModule;
  }

  sesModule = await import('@aws-sdk/client-ses');

  return sesModule;
}

function getTableName() {
  const tableName = process.env.BLOG_SUBSCRIPTIONS_TABLE_NAME;

  if (!tableName) {
    throw new Error('Missing BLOG_SUBSCRIPTIONS_TABLE_NAME');
  }

  return tableName;
}

function getNotificationSendsTableName() {
  const tableName = process.env.BLOG_NOTIFICATION_SENDS_TABLE_NAME;

  if (!tableName) {
    throw new Error('Missing BLOG_NOTIFICATION_SENDS_TABLE_NAME');
  }

  return tableName;
}

function getSiteUrl() {
  return (process.env.BLOG_SUBSCRIPTIONS_SITE_URL || 'https://drakesfood.com').replace(/\/+$/, '');
}

function getApiBaseUrl() {
  return (process.env.BLOG_SUBSCRIPTIONS_API_BASE_URL || '').replace(/\/+$/, '');
}

function formatConfirmationEmail(confirmationToken) {
  const confirmationUrl = `${getApiBaseUrl()}/blog-subscriptions/confirm?token=${encodeURIComponent(confirmationToken)}`;

  return [
    "You're almost subscribed to Drake's Food blog emails.",
    '',
    'Confirm your subscription here:',
    confirmationUrl,
    '',
    "If you didn't ask for this, you can ignore this email.",
  ].join('\n');
}

function formatBlogNotificationEmail(post, subscriber) {
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}${post.path}`;
  const unsubscribeUrl = `${getApiBaseUrl()}/blog-subscriptions/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`;

  return [
    `New on Drake's Food: ${post.title}`,
    '',
    post.summary,
    '',
    `Read it here: ${postUrl}`,
    '',
    'Want fewer emails? You can unsubscribe here:',
    unsubscribeUrl,
  ].join('\n');
}

function formatAdminNotificationEmail(eventType, subscriber, timestamp) {
  return [
    `Blog subscription event: ${eventType}`,
    '',
    `Subscriber ID: ${subscriber.subscriberId || 'unknown'}`,
    `Timestamp: ${timestamp}`,
    `Source: ${subscriber.source || process.env.BLOG_SUBSCRIPTIONS_SOURCE_SITE || 'drakesfood.com'}`,
    '',
    'Subscriber email is intentionally omitted from this admin alert for privacy.',
  ].join('\n');
}

function toDynamoDbItem(item) {
  const dynamoItem = {};

  for (const [key, value] of Object.entries(item)) {
    if (typeof value === 'number') {
      dynamoItem[key] = { N: String(value) };
    } else if (typeof value === 'boolean') {
      dynamoItem[key] = { BOOL: value };
    } else if (value !== undefined && value !== '') {
      dynamoItem[key] = { S: value };
    }
  }

  return dynamoItem;
}

function fromDynamoDbItem(item) {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => [key, value.S ?? value.N ?? value.BOOL ?? '']));
}

function hashValue(value) {
  return createHash('sha256').update(value).digest('hex');
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function internalResponse(statusCode, body) {
  return {
    statusCode,
    ...body,
  };
}

function redirectResponse(location) {
  return {
    statusCode: 302,
    headers: {
      location,
    },
    body: '',
  };
}

function htmlResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'text/html; charset=UTF-8',
    },
    body,
  };
}

function buildUnsubscribeConfirmationHtml(token, siteUrl) {
  const action = `${getApiBaseUrl()}/blog-subscriptions/unsubscribe?token=${encodeURIComponent(token)}`;

  return buildHtmlPage({
    title: "Unsubscribe from Drake's Food emails?",
    body: [
      '<p>You are about to stop receiving new Drake\'s Food post emails.</p>',
      `<form method="post" action="${escapeAttribute(action)}">`,
      '<button type="submit">Yes, unsubscribe me</button>',
      '</form>',
      `<p><a href="${escapeAttribute(`${siteUrl}/blog`)}">Keep me subscribed</a></p>`,
    ].join('\n'),
  });
}

function buildUnsubscribeCompleteHtml(siteUrl) {
  return buildHtmlPage({
    title: 'You are unsubscribed',
    body: [
      '<p>You will no longer receive Drake\'s Food post emails.</p>',
      `<p><a href="${escapeAttribute(`${siteUrl}/blog`)}">Back to the blog</a></p>`,
    ].join('\n'),
  });
}

function buildHtmlPage({ title, body }) {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(title)}</title>`,
    '<style>body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fffaf5;color:#3d2d21;line-height:1.6}main{max-width:38rem;margin:0 auto;padding:4rem 1.25rem}h1{font-size:clamp(2rem,8vw,3.5rem);line-height:1;margin:0 0 1rem;letter-spacing:-.05em}button,a{font:inherit}button{border:0;border-radius:999px;background:#3d2d21;color:#fff;padding:.9rem 1.2rem;font-weight:800;cursor:pointer}a{color:#6f3f9d;font-weight:800}</style>',
    '</head>',
    '<body>',
    '<main>',
    `<h1>${escapeHtml(title)}</h1>`,
    body,
    '</main>',
    '</body>',
    '</html>',
  ].join('\n');
}

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  })[character]);
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function chunkArray(values, size) {
  const chunks = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

class RequestBodyTooLargeError extends Error {}
