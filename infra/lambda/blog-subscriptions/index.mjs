import { createHash, randomBytes, randomUUID } from 'node:crypto';

const SIGNUP_SUCCESS_MESSAGE = 'If that email can be subscribed, a confirmation link is on the way.';
const CONFIRMATION_SUCCESS_REDIRECT = '/blog?subscription=confirmed';
const CONFIRMATION_FAILURE_REDIRECT = '/blog?subscription=invalid';
const DEFAULT_MAX_BODY_BYTES = 8 * 1024;
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
  savePendingSubscriber = savePendingSubscriberToDynamoDb,
  activateSubscriber = activateSubscriberInDynamoDb,
  sendConfirmation = sendConfirmationEmail,
} = {}) => async (event = {}) => {
  const method = getMethod(event);
  const path = getPath(event);

  if (method === 'GET' && path.endsWith('/blog-subscriptions/confirm')) {
    return confirmSubscription(event, { now, findSubscriberByConfirmationTokenHash, activateSubscriber });
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
  const timestamp = now().toISOString();
  const subscriber = {
    subscriberId: existingSubscriber?.subscriberId || uuid(),
    emailNormalized: normalized.values.email,
    emailHash,
    status: 'pending',
    createdAt: existingSubscriber?.createdAt || timestamp,
    updatedAt: timestamp,
    confirmationTokenHash: hashValue(confirmationToken),
    unsubscribeTokenHash: existingSubscriber?.unsubscribeTokenHash || hashValue(unsubscribeToken),
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

async function confirmSubscription(event, { now, findSubscriberByConfirmationTokenHash, activateSubscriber }) {
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
    await activateSubscriber(subscriber.subscriberId, now().toISOString());
  } catch (error) {
    console.error('Failed to confirm blog subscriber.', {
      errorName: error?.name,
      subscriberId: subscriber.subscriberId,
    });

    return redirectResponse(`${siteUrl}${CONFIRMATION_FAILURE_REDIRECT}`);
  }

  return redirectResponse(`${siteUrl}${CONFIRMATION_SUCCESS_REDIRECT}`);
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
  const { DynamoDBClient, QueryCommand } = await loadDynamoDbClient();
  const client = dynamoClient ?? new DynamoDBClient({});
  dynamoClient = client;

  const response = await client.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'emailHash-index',
      KeyConditionExpression: 'emailHash = :emailHash',
      ExpressionAttributeValues: {
        ':emailHash': { S: emailHash },
      },
      Limit: 1,
    }),
  );

  return response.Items?.[0] ? fromDynamoDbItem(response.Items[0]) : undefined;
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

async function activateSubscriberInDynamoDb(subscriberId, confirmedAt) {
  const tableName = getTableName();
  const { DynamoDBClient, UpdateItemCommand } = await loadDynamoDbClient();
  const client = dynamoClient ?? new DynamoDBClient({});
  dynamoClient = client;

  await client.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        subscriberId: { S: subscriberId },
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

function toDynamoDbItem(item) {
  const dynamoItem = {};

  for (const [key, value] of Object.entries(item)) {
    if (value !== undefined && value !== '') {
      dynamoItem[key] = { S: value };
    }
  }

  return dynamoItem;
}

function fromDynamoDbItem(item) {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => [key, value.S ?? '']));
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

function redirectResponse(location) {
  return {
    statusCode: 302,
    headers: {
      location,
    },
    body: '',
  };
}

class RequestBodyTooLargeError extends Error {}
