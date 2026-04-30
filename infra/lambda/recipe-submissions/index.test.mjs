import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from './index.mjs';

const fixedDate = new Date('2026-04-30T14:30:00.000Z');

function createEvent(body, method = 'POST') {
  return {
    requestContext: {
      http: {
        method,
      },
    },
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function parseResponse(response) {
  return JSON.parse(response.body);
}

test('saves a valid recipe submission', async () => {
  const savedItems = [];
  const notifications = [];
  const handler = createHandler({
    now: () => fixedDate,
    uuid: () => 'submission-123',
    saveSubmission: async (item) => savedItems.push(item),
    sendNotification: async (item) => notifications.push(item),
  });

  const response = await handler(
    createEvent({
      title: '  Smoked birria tacos  ',
      description: 'Cook these on the smoker.',
      name: 'Drake Fan',
      email: 'fan@example.com',
      recipeUrl: 'https://example.com/recipe',
      socialUrl: 'https://instagram.com/example',
      permissionToCredit: true,
      website: '',
    }),
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(parseResponse(response), {
    success: true,
    message: 'Thanks! Your idea was sent to Drake.',
  });
  assert.deepEqual(savedItems, [
    {
      submissionId: 'submission-123',
      submittedAt: '2026-04-30T14:30:00.000Z',
      status: 'new',
      title: 'Smoked birria tacos',
      description: 'Cook these on the smoker.',
      name: 'Drake Fan',
      email: 'fan@example.com',
      recipeUrl: 'https://example.com/recipe',
      socialUrl: 'https://instagram.com/example',
      permissionToCredit: true,
      source: 'drakesfood.com',
    },
  ]);
  assert.deepEqual(notifications, savedItems);
});

test('returns validation error without saving when required fields are missing', async () => {
  const savedItems = [];
  const notifications = [];
  const handler = createHandler({
    saveSubmission: async (item) => savedItems.push(item),
    sendNotification: async (item) => notifications.push(item),
  });

  const response = await handler(createEvent({ title: '', description: '' }));

  assert.equal(response.statusCode, 400);
  assert.deepEqual(parseResponse(response), {
    success: false,
    message: 'Please include a recipe title and description.',
  });
  assert.deepEqual(savedItems, []);
  assert.deepEqual(notifications, []);
});

test('handles populated honeypot as generic success without saving', async () => {
  const savedItems = [];
  const notifications = [];
  const handler = createHandler({
    saveSubmission: async (item) => savedItems.push(item),
    sendNotification: async (item) => notifications.push(item),
  });

  const response = await handler(
    createEvent({
      title: 'Spam title',
      description: 'Spam description',
      website: 'https://bot.example',
    }),
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(parseResponse(response), {
    success: true,
    message: 'Thanks! Your idea was sent to Drake.',
  });
  assert.deepEqual(savedItems, []);
  assert.deepEqual(notifications, []);
});

test('rejects malformed JSON cleanly', async () => {
  const handler = createHandler({ saveSubmission: async () => undefined });

  const response = await handler({
    requestContext: { http: { method: 'POST' } },
    headers: { 'content-type': 'application/json' },
    body: '{nope',
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(parseResponse(response), {
    success: false,
    message: 'Please send a valid JSON recipe submission.',
  });
});

test('rejects non-POST requests cleanly', async () => {
  const handler = createHandler({ saveSubmission: async () => undefined });

  const response = await handler(createEvent({}, 'GET'));

  assert.equal(response.statusCode, 405);
  assert.deepEqual(parseResponse(response), {
    success: false,
    message: 'Recipe submissions only accept POST requests.',
  });
});

test('rejects disallowed browser origins', async () => {
  process.env.ALLOWED_ORIGINS = 'https://drakesfood.com,http://localhost:4200';
  const handler = createHandler({ saveSubmission: async () => undefined });

  const response = await handler({
    ...createEvent({ title: 'Pizza', description: 'Try this.' }),
    headers: {
      'content-type': 'application/json',
      origin: 'https://spam.example',
    },
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(parseResponse(response), {
    success: false,
    message: 'Recipe submissions are not available from this origin.',
  });
  delete process.env.ALLOWED_ORIGINS;
});

test('rejects unsupported content types', async () => {
  const handler = createHandler({ saveSubmission: async () => undefined });

  const response = await handler({
    ...createEvent({ title: 'Pizza', description: 'Try this.' }),
    headers: {
      'content-type': 'text/plain',
    },
  });

  assert.equal(response.statusCode, 415);
  assert.deepEqual(parseResponse(response), {
    success: false,
    message: 'Please send recipe submissions as JSON.',
  });
});

test('rejects oversized request bodies before parsing', async () => {
  process.env.RECIPE_SUBMISSIONS_MAX_BODY_BYTES = '32';
  const handler = createHandler({ saveSubmission: async () => undefined });

  const response = await handler(
    createEvent({
      title: 'Pizza',
      description: 'This body is intentionally too long for the configured test limit.',
    }),
  );

  assert.equal(response.statusCode, 413);
  assert.deepEqual(parseResponse(response), {
    success: false,
    message: 'Please shorten your recipe idea and try again.',
  });
  delete process.env.RECIPE_SUBMISSIONS_MAX_BODY_BYTES;
});

test('rejects invalid optional email and URL values', async () => {
  const handler = createHandler({ saveSubmission: async () => undefined });

  const invalidEmailResponse = await handler(
    createEvent({
      title: 'Pizza',
      description: 'Try it outside.',
      email: 'not-an-email',
    }),
  );
  const invalidUrlResponse = await handler(
    createEvent({
      title: 'Pizza',
      description: 'Try it outside.',
      recipeUrl: 'notaurl',
    }),
  );

  assert.equal(invalidEmailResponse.statusCode, 400);
  assert.equal(parseResponse(invalidEmailResponse).message, 'Please enter a valid email address or leave it blank.');
  assert.equal(invalidUrlResponse.statusCode, 400);
  assert.equal(parseResponse(invalidUrlResponse).message, 'Please enter a valid recipe URL or leave it blank.');
});

test('parses base64-encoded request bodies', async () => {
  const savedItems = [];
  const handler = createHandler({
    now: () => fixedDate,
    uuid: () => 'submission-456',
    saveSubmission: async (item) => savedItems.push(item),
  });
  const encodedBody = Buffer.from(
    JSON.stringify({
      title: 'Pizza',
      description: 'Try this in the Ooni.',
    }),
  ).toString('base64');

  const response = await handler({
    requestContext: { http: { method: 'POST' } },
    headers: { 'content-type': 'application/json' },
    isBase64Encoded: true,
    body: encodedBody,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(savedItems[0].submissionId, 'submission-456');
});

test('returns success when notification fails after saving', async () => {
  const savedItems = [];
  const handler = createHandler({
    now: () => fixedDate,
    uuid: () => 'submission-789',
    saveSubmission: async (item) => savedItems.push(item),
    sendNotification: async () => {
      throw new Error('SES unavailable');
    },
  });

  const response = await handler(
    createEvent({
      title: 'Ratatouille',
      description: 'Try a smoky version.',
    }),
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(parseResponse(response), {
    success: true,
    message: 'Thanks! Your idea was sent to Drake.',
  });
  assert.equal(savedItems.length, 1);
});
