import { randomUUID } from 'node:crypto';

const SUCCESS_MESSAGE = 'Thanks! Your idea was sent to Drake.';
const VALIDATION_MESSAGE = 'Please include a recipe title and description.';

const FIELD_LIMITS = {
  title: 120,
  description: 3000,
  name: 100,
  email: 254,
  recipeUrl: 500,
  socialUrl: 500,
};

const STRING_FIELDS = ['title', 'description', 'name', 'email', 'recipeUrl', 'socialUrl', 'website'];

let dynamoClient;
let putItemCommand;

export const createHandler = ({
  now = () => new Date(),
  saveSubmission = saveSubmissionToDynamoDb,
  uuid = randomUUID,
} = {}) => async (event = {}) => {
  if (getMethod(event) !== 'POST') {
    return jsonResponse(405, {
      success: false,
      message: 'Recipe submissions only accept POST requests.',
    });
  }

  let body;

  try {
    body = parseBody(event);
  } catch {
    return jsonResponse(400, {
      success: false,
      message: 'Please send a valid JSON recipe submission.',
    });
  }

  const normalized = normalizeBody(body);

  if (!normalized.valid) {
    return jsonResponse(400, {
      success: false,
      message: VALIDATION_MESSAGE,
    });
  }

  if (normalized.values.website) {
    console.info('Recipe submission ignored by spam filter.');

    return jsonResponse(200, {
      success: true,
      message: SUCCESS_MESSAGE,
    });
  }

  const validationError = validateSubmission(normalized.values);

  if (validationError) {
    return jsonResponse(400, {
      success: false,
      message: validationError,
    });
  }

  const item = buildSubmissionItem(normalized.values, now().toISOString(), uuid());

  try {
    await saveSubmission(item);
  } catch (error) {
    console.error('Failed to save recipe submission.', {
      errorName: error?.name,
      submissionId: item.submissionId,
    });

    return jsonResponse(500, {
      success: false,
      message: 'Something went wrong sending your recipe idea. Please try again later.',
    });
  }

  return jsonResponse(200, {
    success: true,
    message: SUCCESS_MESSAGE,
  });
};

export const handler = createHandler();

function getMethod(event) {
  return event.requestContext?.http?.method ?? event.httpMethod ?? '';
}

function parseBody(event) {
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : event.body;

  if (!rawBody) {
    throw new Error('Missing body');
  }

  const parsed = JSON.parse(rawBody);

  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('Invalid body');
  }

  return parsed;
}

function normalizeBody(body) {
  const values = {
    title: '',
    description: '',
    name: '',
    email: '',
    recipeUrl: '',
    socialUrl: '',
    permissionToCredit: false,
    website: '',
  };

  for (const field of STRING_FIELDS) {
    if (body[field] === undefined || body[field] === null) {
      continue;
    }

    if (typeof body[field] !== 'string') {
      return { valid: false, values };
    }

    values[field] = body[field].trim();
  }

  if (body.permissionToCredit !== undefined && typeof body.permissionToCredit !== 'boolean') {
    return { valid: false, values };
  }

  values.permissionToCredit = body.permissionToCredit === true;

  return { valid: true, values };
}

function validateSubmission(values) {
  if (!values.title || !values.description) {
    return VALIDATION_MESSAGE;
  }

  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    if (values[field].length > limit) {
      return `Please keep ${field} under ${limit} characters.`;
    }
  }

  if (values.email && !isValidEmail(values.email)) {
    return 'Please enter a valid email address or leave it blank.';
  }

  if (values.recipeUrl && !isValidHttpUrl(values.recipeUrl)) {
    return 'Please enter a valid recipe URL or leave it blank.';
  }

  if (values.socialUrl && !isValidHttpUrl(values.socialUrl)) {
    return 'Please enter a valid social URL or leave it blank.';
  }

  return '';
}

function buildSubmissionItem(values, submittedAt, submissionId) {
  const item = {
    submissionId,
    submittedAt,
    status: 'new',
    title: values.title,
    description: values.description,
    permissionToCredit: values.permissionToCredit,
    source: process.env.RECIPE_SUBMISSIONS_SOURCE_SITE || 'drakesfood.com',
  };

  for (const field of ['name', 'email', 'recipeUrl', 'socialUrl']) {
    if (values[field]) {
      item[field] = values[field];
    }
  }

  return item;
}

async function saveSubmissionToDynamoDb(item) {
  const tableName = process.env.RECIPE_SUBMISSIONS_TABLE_NAME;

  if (!tableName) {
    throw new Error('Missing RECIPE_SUBMISSIONS_TABLE_NAME');
  }

  const { DynamoDBClient, PutItemCommand } = await loadDynamoDbClient();
  const client = dynamoClient ?? new DynamoDBClient({});
  dynamoClient = client;

  await client.send(
    new PutItemCommand({
      TableName: tableName,
      Item: toDynamoDbItem(item),
      ConditionExpression: 'attribute_not_exists(submissionId)',
    }),
  );
}

async function loadDynamoDbClient() {
  if (putItemCommand) {
    return putItemCommand;
  }

  putItemCommand = await import('@aws-sdk/client-dynamodb');

  return putItemCommand;
}

function toDynamoDbItem(item) {
  const dynamoItem = {};

  for (const [key, value] of Object.entries(item)) {
    if (typeof value === 'boolean') {
      dynamoItem[key] = { BOOL: value };
    } else {
      dynamoItem[key] = { S: value };
    }
  }

  return dynamoItem;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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
