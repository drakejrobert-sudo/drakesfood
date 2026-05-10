import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createHandler } from './index.mjs';

const fixedDate = new Date('2026-05-09T12:00:00.000Z');

function createPostEvent(body, method = 'POST') {
  return {
    requestContext: {
      http: {
        method,
      },
    },
    rawPath: '/blog-subscriptions',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function createConfirmEvent(token) {
  return {
    requestContext: {
      http: {
        method: 'GET',
      },
    },
    rawPath: '/blog-subscriptions/confirm',
    queryStringParameters: {
      token,
    },
  };
}

function createUnsubscribeEvent(token) {
  return {
    requestContext: {
      http: {
        method: 'GET',
      },
    },
    rawPath: '/blog-subscriptions/unsubscribe',
    queryStringParameters: {
      token,
    },
  };
}

function parseResponse(response) {
  return JSON.parse(response.body);
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

test('stores a pending subscriber and sends a confirmation email', async () => {
  const savedSubscribers = [];
  const confirmations = [];
  const handler = createHandler({
    now: () => fixedDate,
    uuid: () => 'subscriber-123',
    createToken: (() => {
      const tokens = ['confirm-token', 'unsubscribe-token'];

      return () => tokens.shift();
    })(),
    findSubscriberByEmailHash: async () => undefined,
    savePendingSubscriber: async (subscriber) => savedSubscribers.push(subscriber),
    sendConfirmation: async (subscriber, token) => confirmations.push({ subscriber, token }),
  });

  const response = await handler(createPostEvent({ email: '  FAN@Example.com  ', website: '' }));

  assert.equal(response.statusCode, 200);
  assert.deepEqual(parseResponse(response), {
    success: true,
    message: 'If that email can be subscribed, a confirmation link is on the way.',
  });
  assert.deepEqual(savedSubscribers, [
    {
      subscriberId: 'subscriber-123',
      emailNormalized: 'fan@example.com',
      emailHash: hash('fan@example.com'),
      status: 'pending',
      createdAt: '2026-05-09T12:00:00.000Z',
      updatedAt: '2026-05-09T12:00:00.000Z',
      confirmationTokenHash: hash('confirm-token'),
      unsubscribeToken: 'unsubscribe-token',
      unsubscribeTokenHash: hash('unsubscribe-token'),
      source: 'drakesfood.com',
    },
  ]);
  assert.equal(confirmations.length, 1);
  assert.equal(confirmations[0].subscriber, savedSubscribers[0]);
  assert.equal(confirmations[0].token, 'confirm-token');
});

test('returns validation error for invalid email', async () => {
  const savedSubscribers = [];
  const confirmations = [];
  const handler = createHandler({
    findSubscriberByEmailHash: async () => undefined,
    savePendingSubscriber: async (subscriber) => savedSubscribers.push(subscriber),
    sendConfirmation: async (subscriber) => confirmations.push(subscriber),
  });

  const response = await handler(createPostEvent({ email: 'not-an-email' }));

  assert.equal(response.statusCode, 400);
  assert.deepEqual(parseResponse(response), {
    success: false,
    message: 'Please enter a valid email address.',
  });
  assert.deepEqual(savedSubscribers, []);
  assert.deepEqual(confirmations, []);
});

test('handles populated honeypot as generic success without saving', async () => {
  const savedSubscribers = [];
  const confirmations = [];
  const handler = createHandler({
    findSubscriberByEmailHash: async () => undefined,
    savePendingSubscriber: async (subscriber) => savedSubscribers.push(subscriber),
    sendConfirmation: async (subscriber) => confirmations.push(subscriber),
  });

  const response = await handler(createPostEvent({ email: 'spam@example.com', website: 'https://bot.example' }));

  assert.equal(response.statusCode, 200);
  assert.deepEqual(parseResponse(response), {
    success: true,
    message: 'If that email can be subscribed, a confirmation link is on the way.',
  });
  assert.deepEqual(savedSubscribers, []);
  assert.deepEqual(confirmations, []);
});

test('rejects malformed JSON cleanly', async () => {
  const handler = createHandler();

  const response = await handler({
    requestContext: { http: { method: 'POST' } },
    rawPath: '/blog-subscriptions',
    headers: { 'content-type': 'application/json' },
    body: '{nope',
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(parseResponse(response), {
    success: false,
    message: 'Please send a valid JSON blog subscription.',
  });
});

test('rejects non-POST signup requests cleanly', async () => {
  const handler = createHandler();

  const response = await handler(createPostEvent({}, 'PUT'));

  assert.equal(response.statusCode, 405);
  assert.deepEqual(parseResponse(response), {
    success: false,
    message: 'Blog subscriptions only accept POST requests.',
  });
});

test('rejects disallowed browser origins', async () => {
  process.env.ALLOWED_ORIGINS = 'https://drakesfood.com,http://localhost:4200';
  const handler = createHandler();

  const response = await handler({
    ...createPostEvent({ email: 'fan@example.com' }),
    headers: {
      'content-type': 'application/json',
      origin: 'https://spam.example',
    },
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(parseResponse(response), {
    success: false,
    message: 'Blog subscriptions are not available from this origin.',
  });
  delete process.env.ALLOWED_ORIGINS;
});

test('rejects unsupported content types', async () => {
  const handler = createHandler();

  const response = await handler({
    ...createPostEvent({ email: 'fan@example.com' }),
    headers: {
      'content-type': 'text/plain',
    },
  });

  assert.equal(response.statusCode, 415);
  assert.deepEqual(parseResponse(response), {
    success: false,
    message: 'Please send blog subscriptions as JSON.',
  });
});

test('rejects oversized request bodies before parsing', async () => {
  process.env.BLOG_SUBSCRIPTIONS_MAX_BODY_BYTES = '24';
  const handler = createHandler();

  const response = await handler(createPostEvent({ email: 'intentionally-long-address@example.com' }));

  assert.equal(response.statusCode, 413);
  assert.deepEqual(parseResponse(response), {
    success: false,
    message: 'Please use a shorter email address and try again.',
  });
  delete process.env.BLOG_SUBSCRIPTIONS_MAX_BODY_BYTES;
});

test('duplicate active signup returns generic success without resending confirmation', async () => {
  const confirmations = [];
  const saves = [];
  const handler = createHandler({
    findSubscriberByEmailHash: async () => ({
      subscriberId: 'subscriber-123',
      emailNormalized: 'fan@example.com',
      emailHash: hash('fan@example.com'),
      status: 'active',
      createdAt: '2026-05-01T12:00:00.000Z',
      unsubscribeToken: 'existing-unsubscribe-token',
      unsubscribeTokenHash: 'existing-unsubscribe-hash',
    }),
    savePendingSubscriber: async (subscriber) => saves.push(subscriber),
    sendConfirmation: async (subscriber) => confirmations.push(subscriber),
  });

  const response = await handler(createPostEvent({ email: 'fan@example.com' }));

  assert.equal(response.statusCode, 200);
  assert.deepEqual(parseResponse(response), {
    success: true,
    message: 'If that email can be subscribed, a confirmation link is on the way.',
  });
  assert.deepEqual(saves, []);
  assert.deepEqual(confirmations, []);
});

test('duplicate pending signup refreshes confirmation token', async () => {
  const savedSubscribers = [];
  const confirmations = [];
  const handler = createHandler({
    now: () => fixedDate,
    uuid: () => 'new-subscriber-id',
    createToken: (() => {
      const tokens = ['new-confirm-token', 'new-unsubscribe-token'];

      return () => tokens.shift();
    })(),
    findSubscriberByEmailHash: async () => ({
      subscriberId: 'subscriber-123',
      emailNormalized: 'fan@example.com',
      emailHash: hash('fan@example.com'),
      status: 'pending',
      createdAt: '2026-05-01T12:00:00.000Z',
      unsubscribeToken: 'existing-unsubscribe-token',
      unsubscribeTokenHash: 'existing-unsubscribe-hash',
    }),
    savePendingSubscriber: async (subscriber) => savedSubscribers.push(subscriber),
    sendConfirmation: async (subscriber, token) => confirmations.push({ subscriber, token }),
  });

  const response = await handler(createPostEvent({ email: 'fan@example.com' }));

  assert.equal(response.statusCode, 200);
  assert.equal(savedSubscribers[0].subscriberId, 'subscriber-123');
  assert.equal(savedSubscribers[0].createdAt, '2026-05-01T12:00:00.000Z');
  assert.equal(savedSubscribers[0].confirmationTokenHash, hash('new-confirm-token'));
  assert.equal(savedSubscribers[0].unsubscribeToken, 'existing-unsubscribe-token');
  assert.equal(savedSubscribers[0].unsubscribeTokenHash, 'existing-unsubscribe-hash');
  assert.equal(confirmations[0].token, 'new-confirm-token');
});

test('valid confirmation activates a pending subscriber and redirects to success', async () => {
  const activations = [];
  const emailHash = hash('fan@example.com');
  process.env.BLOG_SUBSCRIPTIONS_SITE_URL = 'https://drakesfood.com';
  const handler = createHandler({
    now: () => fixedDate,
    findSubscriberByConfirmationTokenHash: async (confirmationTokenHash) => ({
      subscriberId: 'subscriber-123',
      emailHash,
      confirmationTokenHash,
      status: 'pending',
    }),
    activateSubscriber: async (activatedEmailHash, confirmedAt) => activations.push({ emailHash: activatedEmailHash, confirmedAt }),
  });

  const response = await handler(createConfirmEvent('confirm-token'));

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, 'https://drakesfood.com/blog?subscription=confirmed');
  assert.deepEqual(activations, [{ emailHash, confirmedAt: '2026-05-09T12:00:00.000Z' }]);
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});

test('invalid confirmation token redirects to failure', async () => {
  process.env.BLOG_SUBSCRIPTIONS_SITE_URL = 'https://drakesfood.com';
  const handler = createHandler({
    findSubscriberByConfirmationTokenHash: async () => undefined,
  });

  const response = await handler(createConfirmEvent('bad-token'));

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, 'https://drakesfood.com/blog?subscription=invalid');
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});

test('valid unsubscribe token marks subscriber unsubscribed and redirects to success', async () => {
  const unsubscribes = [];
  const emailHash = hash('fan@example.com');
  process.env.BLOG_SUBSCRIPTIONS_SITE_URL = 'https://drakesfood.com';
  const handler = createHandler({
    now: () => fixedDate,
    findSubscriberByUnsubscribeTokenHash: async (unsubscribeTokenHash) => ({
      subscriberId: 'subscriber-123',
      emailHash,
      unsubscribeTokenHash,
      status: 'active',
    }),
    unsubscribeSubscriber: async (unsubscribedEmailHash, unsubscribedAt) => unsubscribes.push({ emailHash: unsubscribedEmailHash, unsubscribedAt }),
  });

  const response = await handler(createUnsubscribeEvent('unsubscribe-token'));

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, 'https://drakesfood.com/blog?subscription=unsubscribed');
  assert.deepEqual(unsubscribes, [{ emailHash, unsubscribedAt: '2026-05-09T12:00:00.000Z' }]);
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});

test('already unsubscribed token redirects to success without another update', async () => {
  const unsubscribes = [];
  process.env.BLOG_SUBSCRIPTIONS_SITE_URL = 'https://drakesfood.com';
  const handler = createHandler({
    findSubscriberByUnsubscribeTokenHash: async () => ({
      subscriberId: 'subscriber-123',
      emailHash: hash('fan@example.com'),
      status: 'unsubscribed',
    }),
    unsubscribeSubscriber: async (emailHash) => unsubscribes.push(emailHash),
  });

  const response = await handler(createUnsubscribeEvent('unsubscribe-token'));

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, 'https://drakesfood.com/blog?subscription=unsubscribed');
  assert.deepEqual(unsubscribes, []);
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});

test('invalid unsubscribe token redirects to failure', async () => {
  process.env.BLOG_SUBSCRIPTIONS_SITE_URL = 'https://drakesfood.com';
  const handler = createHandler({
    findSubscriberByUnsubscribeTokenHash: async () => undefined,
  });

  const response = await handler(createUnsubscribeEvent('bad-token'));

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, 'https://drakesfood.com/blog?subscription=invalid');
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});
