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

function createUnsubscribeEvent(token, method = 'GET') {
  return {
    requestContext: {
      http: {
        method,
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
    message: 'If that email can be subscribed, a confirmation link is on the way. Check your junk or spam folder if you do not see it soon.',
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
    message: 'If that email can be subscribed, a confirmation link is on the way. Check your junk or spam folder if you do not see it soon.',
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
      unsubscribeTokenHash: hash('existing-unsubscribe-token'),
    }),
    savePendingSubscriber: async (subscriber) => saves.push(subscriber),
    sendConfirmation: async (subscriber) => confirmations.push(subscriber),
  });

  const response = await handler(createPostEvent({ email: 'fan@example.com' }));

  assert.equal(response.statusCode, 200);
  assert.deepEqual(parseResponse(response), {
    success: true,
    message: 'If that email can be subscribed, a confirmation link is on the way. Check your junk or spam folder if you do not see it soon.',
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
  assert.equal(savedSubscribers[0].unsubscribeTokenHash, hash('existing-unsubscribe-token'));
  assert.equal(confirmations[0].token, 'new-confirm-token');
});

test('duplicate pending signup rotates unsubscribe token when legacy record has only a hash', async () => {
  const savedSubscribers = [];
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
      unsubscribeTokenHash: 'legacy-unsubscribe-hash',
    }),
    savePendingSubscriber: async (subscriber) => savedSubscribers.push(subscriber),
    sendConfirmation: async () => undefined,
  });

  const response = await handler(createPostEvent({ email: 'fan@example.com' }));

  assert.equal(response.statusCode, 200);
  assert.equal(savedSubscribers[0].subscriberId, 'subscriber-123');
  assert.equal(savedSubscribers[0].unsubscribeToken, 'new-unsubscribe-token');
  assert.equal(savedSubscribers[0].unsubscribeTokenHash, hash('new-unsubscribe-token'));
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

test('valid confirmation sends admin notification when configured', async () => {
  const adminNotifications = [];
  const emailHash = hash('fan@example.com');
  process.env.BLOG_SUBSCRIPTIONS_SITE_URL = 'https://drakesfood.com';
  const handler = createHandler({
    now: () => fixedDate,
    findSubscriberByConfirmationTokenHash: async (confirmationTokenHash) => ({
      subscriberId: 'subscriber-123',
      emailHash,
      confirmationTokenHash,
      status: 'pending',
      source: 'drakesfood.com',
    }),
    activateSubscriber: async () => undefined,
    sendAdminNotification: async (eventType, subscriber, timestamp) => adminNotifications.push({ eventType, subscriber, timestamp }),
  });

  const response = await handler(createConfirmEvent('confirm-token'));

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, 'https://drakesfood.com/blog?subscription=confirmed');
  assert.deepEqual(adminNotifications, [
    {
      eventType: 'confirmed',
      subscriber: {
        subscriberId: 'subscriber-123',
        emailHash,
        confirmationTokenHash: hash('confirm-token'),
        status: 'pending',
        source: 'drakesfood.com',
      },
      timestamp: '2026-05-09T12:00:00.000Z',
    },
  ]);
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});

test('blank admin recipient skips default confirmation admin notification', async () => {
  const emailHash = hash('fan@example.com');
  delete process.env.BLOG_SUBSCRIPTIONS_ADMIN_RECIPIENT_EMAIL;
  delete process.env.SES_SENDER_EMAIL;
  process.env.BLOG_SUBSCRIPTIONS_SITE_URL = 'https://drakesfood.com';
  const handler = createHandler({
    now: () => fixedDate,
    findSubscriberByConfirmationTokenHash: async (confirmationTokenHash) => ({
      subscriberId: 'subscriber-123',
      emailHash,
      confirmationTokenHash,
      status: 'pending',
    }),
    activateSubscriber: async () => undefined,
  });

  const response = await handler(createConfirmEvent('confirm-token'));

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, 'https://drakesfood.com/blog?subscription=confirmed');
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});

test('admin notification failure does not block confirmation success', async () => {
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
    sendAdminNotification: async () => {
      throw new Error('SES failed');
    },
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

  const response = await handler(createUnsubscribeEvent('unsubscribe-token', 'POST'));

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, 'https://drakesfood.com/blog?subscription=unsubscribed');
  assert.deepEqual(unsubscribes, [{ emailHash, unsubscribedAt: '2026-05-09T12:00:00.000Z' }]);
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});

test('valid unsubscribe sends admin notification when configured', async () => {
  const adminNotifications = [];
  const emailHash = hash('fan@example.com');
  process.env.BLOG_SUBSCRIPTIONS_SITE_URL = 'https://drakesfood.com';
  const handler = createHandler({
    now: () => fixedDate,
    findSubscriberByUnsubscribeTokenHash: async (unsubscribeTokenHash) => ({
      subscriberId: 'subscriber-123',
      emailHash,
      unsubscribeTokenHash,
      status: 'active',
      source: 'drakesfood.com',
    }),
    unsubscribeSubscriber: async () => undefined,
    sendAdminNotification: async (eventType, subscriber, timestamp) => adminNotifications.push({ eventType, subscriber, timestamp }),
  });

  const response = await handler(createUnsubscribeEvent('unsubscribe-token', 'POST'));

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, 'https://drakesfood.com/blog?subscription=unsubscribed');
  assert.deepEqual(adminNotifications, [
    {
      eventType: 'unsubscribed',
      subscriber: {
        subscriberId: 'subscriber-123',
        emailHash,
        unsubscribeTokenHash: hash('unsubscribe-token'),
        status: 'active',
        source: 'drakesfood.com',
      },
      timestamp: '2026-05-09T12:00:00.000Z',
    },
  ]);
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});

test('admin notification failure does not block unsubscribe success', async () => {
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
    sendAdminNotification: async () => {
      throw new Error('SES failed');
    },
  });

  const response = await handler(createUnsubscribeEvent('unsubscribe-token', 'POST'));

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, 'https://drakesfood.com/blog?subscription=unsubscribed');
  assert.deepEqual(unsubscribes, [{ emailHash, unsubscribedAt: '2026-05-09T12:00:00.000Z' }]);
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});

test('already unsubscribed token redirects to success without another update', async () => {
  const unsubscribes = [];
  const adminNotifications = [];
  process.env.BLOG_SUBSCRIPTIONS_SITE_URL = 'https://drakesfood.com';
  const handler = createHandler({
    findSubscriberByUnsubscribeTokenHash: async () => ({
      subscriberId: 'subscriber-123',
      emailHash: hash('fan@example.com'),
      status: 'unsubscribed',
    }),
    unsubscribeSubscriber: async (emailHash) => unsubscribes.push(emailHash),
    sendAdminNotification: async (eventType) => adminNotifications.push(eventType),
  });

  const response = await handler(createUnsubscribeEvent('unsubscribe-token', 'POST'));

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, 'https://drakesfood.com/blog?subscription=unsubscribed');
  assert.deepEqual(unsubscribes, []);
  assert.deepEqual(adminNotifications, []);
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});

test('invalid unsubscribe token redirects to failure', async () => {
  process.env.BLOG_SUBSCRIPTIONS_SITE_URL = 'https://drakesfood.com';
  const handler = createHandler({
    findSubscriberByUnsubscribeTokenHash: async () => undefined,
  });

  const response = await handler(createUnsubscribeEvent('bad-token', 'POST'));

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, 'https://drakesfood.com/blog?subscription=invalid');
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});

test('unsubscribe GET returns confirmation page without unsubscribing', async () => {
  const unsubscribes = [];
  process.env.BLOG_SUBSCRIPTIONS_SITE_URL = 'https://drakesfood.com';
  process.env.BLOG_SUBSCRIPTIONS_API_BASE_URL = 'https://api.example.com';
  const handler = createHandler({
    findSubscriberByUnsubscribeTokenHash: async () => ({
      subscriberId: 'subscriber-123',
      emailHash: hash('fan@example.com'),
      status: 'active',
    }),
    unsubscribeSubscriber: async (emailHash) => unsubscribes.push(emailHash),
  });

  const response = await handler(createUnsubscribeEvent('unsubscribe-token'));

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'text/html; charset=UTF-8');
  assert.match(response.body, /Unsubscribe from Drake's Food emails\?/);
  assert.match(response.body, /method="post"/);
  assert.match(response.body, /https:\/\/api\.example\.com\/blog-subscriptions\/unsubscribe\?token=unsubscribe-token/);
  assert.deepEqual(unsubscribes, []);
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
  delete process.env.BLOG_SUBSCRIPTIONS_API_BASE_URL;
});

test('unsubscribe GET for already unsubscribed reader returns complete page', async () => {
  process.env.BLOG_SUBSCRIPTIONS_SITE_URL = 'https://drakesfood.com';
  const handler = createHandler({
    findSubscriberByUnsubscribeTokenHash: async () => ({
      subscriberId: 'subscriber-123',
      emailHash: hash('fan@example.com'),
      status: 'unsubscribed',
    }),
  });

  const response = await handler(createUnsubscribeEvent('unsubscribe-token'));

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /You are unsubscribed/);
  delete process.env.BLOG_SUBSCRIPTIONS_SITE_URL;
});

test('dry run reports active recipient count without reserving or sending', async () => {
  const reservations = [];
  const notifications = [];
  const handler = createHandler({
    getBlogPost: () => ({
      slug: 'pizza-night',
      title: 'Pizza Night',
      summary: 'A crispy backyard pizza experiment.',
      path: '/blog/pizza-night',
    }),
    listActiveSubscribers: async () => [
      { subscriberId: 'subscriber-1', emailNormalized: 'one@example.com', unsubscribeToken: 'token-1' },
      { subscriberId: 'subscriber-2', emailNormalized: 'two@example.com', unsubscribeToken: 'token-2' },
    ],
    reserveNotificationSend: async (item) => reservations.push(item),
    sendBlogNotification: async (post, subscriber) => notifications.push({ post, subscriber }),
  });

  const response = await handler({ action: 'sendBlogPostNotification', postSlug: 'pizza-night', dryRun: true });

  assert.equal(response.statusCode, 200);
  assert.equal(response.success, true);
  assert.equal(response.dryRun, true);
  assert.equal(response.recipientCount, 2);
  assert.equal(response.maxRecipients, 50);
  assert.equal(response.overRecipientLimit, false);
  assert.equal(response.sentCount, 0);
  assert.equal(response.failedCount, 0);
  assert.deepEqual(reservations, []);
  assert.deepEqual(notifications, []);
});

test('dry run reports when recipient count exceeds safety cap', async () => {
  process.env.BLOG_NOTIFICATION_MAX_RECIPIENTS = '1';
  const handler = createHandler({
    getBlogPost: () => ({ slug: 'pizza-night', title: 'Pizza Night', summary: 'A crispy backyard pizza experiment.', path: '/blog/pizza-night' }),
    listActiveSubscribers: async () => [
      { subscriberId: 'subscriber-1', emailNormalized: 'one@example.com', unsubscribeToken: 'token-1' },
      { subscriberId: 'subscriber-2', emailNormalized: 'two@example.com', unsubscribeToken: 'token-2' },
    ],
  });

  const response = await handler({ action: 'sendBlogPostNotification', postSlug: 'pizza-night', dryRun: true });

  assert.equal(response.statusCode, 200);
  assert.equal(response.success, true);
  assert.equal(response.recipientCount, 2);
  assert.equal(response.maxRecipients, 1);
  assert.equal(response.overRecipientLimit, true);
  assert.match(response.message, /Real send will be blocked/);
  delete process.env.BLOG_NOTIFICATION_MAX_RECIPIENTS;
});

test('real send over recipient cap aborts before reservation', async () => {
  const reservations = [];
  const notifications = [];
  process.env.BLOG_NOTIFICATION_MAX_RECIPIENTS = '1';
  const handler = createHandler({
    getBlogPost: () => ({ slug: 'pizza-night', title: 'Pizza Night', summary: 'A crispy backyard pizza experiment.', path: '/blog/pizza-night' }),
    listActiveSubscribers: async () => [
      { subscriberId: 'subscriber-1', emailNormalized: 'one@example.com', unsubscribeToken: 'token-1' },
      { subscriberId: 'subscriber-2', emailNormalized: 'two@example.com', unsubscribeToken: 'token-2' },
    ],
    reserveNotificationSend: async (item) => reservations.push(item),
    sendBlogNotification: async (post, subscriber) => notifications.push({ post, subscriber }),
  });

  const response = await handler({ action: 'sendBlogPostNotification', postSlug: 'pizza-night', dryRun: false });

  assert.equal(response.statusCode, 400);
  assert.equal(response.success, false);
  assert.equal(response.recipientCount, 2);
  assert.equal(response.maxRecipients, 1);
  assert.deepEqual(reservations, []);
  assert.deepEqual(notifications, []);
  delete process.env.BLOG_NOTIFICATION_MAX_RECIPIENTS;
});

test('real send reserves post slug and sends to active subscribers', async () => {
  const reservations = [];
  const completions = [];
  const notifications = [];
  const post = {
    slug: 'pizza-night',
    title: 'Pizza Night',
    summary: 'A crispy backyard pizza experiment.',
    path: '/blog/pizza-night',
  };
  const handler = createHandler({
    now: () => fixedDate,
    getBlogPost: () => post,
    listActiveSubscribers: async () => [
      { subscriberId: 'subscriber-1', emailNormalized: 'one@example.com', unsubscribeToken: 'token-1' },
      { subscriberId: 'subscriber-2', emailNormalized: 'two@example.com', unsubscribeToken: 'token-2' },
    ],
    reserveNotificationSend: async (item) => reservations.push(item),
    completeNotificationSend: async (postSlug, values) => completions.push({ postSlug, values }),
    sendBlogNotification: async (sentPost, subscriber) => notifications.push({ post: sentPost, subscriber }),
  });

  const response = await handler({ action: 'sendBlogPostNotification', postSlug: 'pizza-night', dryRun: false });

  assert.equal(response.statusCode, 200);
  assert.equal(response.success, true);
  assert.deepEqual(reservations, [
    {
      postSlug: 'pizza-night',
      status: 'sending',
      dryRun: 'false',
      startedAt: '2026-05-09T12:00:00.000Z',
      recipientCount: '2',
      sentCount: '0',
      failedCount: '0',
    },
  ]);
  assert.equal(notifications.length, 2);
  assert.equal(notifications[0].subscriber.unsubscribeToken, 'token-1');
  assert.deepEqual(completions, [
    {
      postSlug: 'pizza-night',
      values: {
        status: 'sent',
        completedAt: '2026-05-09T12:00:00.000Z',
        recipientCount: '2',
        sentCount: '2',
        failedCount: '0',
      },
    },
  ]);
});

test('real send uses bounded concurrent batches', async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const subscribers = Array.from({ length: 7 }, (_, index) => ({
    subscriberId: `subscriber-${index}`,
    emailNormalized: `reader-${index}@example.com`,
    unsubscribeToken: `token-${index}`,
  }));
  const handler = createHandler({
    getBlogPost: () => ({ slug: 'pizza-night', title: 'Pizza Night', summary: 'A crispy backyard pizza experiment.', path: '/blog/pizza-night' }),
    listActiveSubscribers: async () => subscribers,
    reserveNotificationSend: async () => undefined,
    completeNotificationSend: async () => undefined,
    sendBlogNotification: async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
    },
  });

  const response = await handler({ action: 'sendBlogPostNotification', postSlug: 'pizza-night', dryRun: false });

  assert.equal(response.statusCode, 200);
  assert.equal(response.sentCount, 7);
  assert.equal(maxInFlight, 5);
});

test('duplicate real send is blocked before sending', async () => {
  const notifications = [];
  const handler = createHandler({
    getBlogPost: () => ({ slug: 'pizza-night', title: 'Pizza Night', summary: 'A crispy backyard pizza experiment.', path: '/blog/pizza-night' }),
    listActiveSubscribers: async () => [{ subscriberId: 'subscriber-1', emailNormalized: 'one@example.com', unsubscribeToken: 'token-1' }],
    reserveNotificationSend: async () => {
      const error = new Error('Duplicate');
      error.name = 'ConditionalCheckFailedException';
      throw error;
    },
    sendBlogNotification: async (post, subscriber) => notifications.push({ post, subscriber }),
  });

  const response = await handler({ action: 'sendBlogPostNotification', postSlug: 'pizza-night', dryRun: false });

  assert.equal(response.statusCode, 409);
  assert.equal(response.success, false);
  assert.equal(response.duplicate, true);
  assert.deepEqual(notifications, []);
});

test('send action counts subscriber send failures without exposing email addresses', async () => {
  const completions = [];
  const handler = createHandler({
    now: () => fixedDate,
    getBlogPost: () => ({ slug: 'pizza-night', title: 'Pizza Night', summary: 'A crispy backyard pizza experiment.', path: '/blog/pizza-night' }),
    listActiveSubscribers: async () => [
      { subscriberId: 'subscriber-1', emailNormalized: 'one@example.com', unsubscribeToken: 'token-1' },
      { subscriberId: 'subscriber-2', emailNormalized: 'two@example.com', unsubscribeToken: 'token-2' },
    ],
    reserveNotificationSend: async () => undefined,
    completeNotificationSend: async (postSlug, values) => completions.push({ postSlug, values }),
    sendBlogNotification: async (_post, subscriber) => {
      if (subscriber.subscriberId === 'subscriber-2') {
        throw new Error('SES failed');
      }
    },
  });

  const response = await handler({ action: 'sendBlogPostNotification', postSlug: 'pizza-night', dryRun: false });

  assert.equal(response.statusCode, 200);
  assert.equal(response.success, false);
  assert.equal(response.recipientCount, 2);
  assert.equal(response.sentCount, 1);
  assert.equal(response.failedCount, 1);
  assert.equal(completions[0].values.status, 'failed');
});

test('send action rejects unknown post slug', async () => {
  const handler = createHandler({
    getBlogPost: () => undefined,
  });

  const response = await handler({ action: 'sendBlogPostNotification', postSlug: 'missing-post', dryRun: true });

  assert.equal(response.statusCode, 404);
  assert.equal(response.success, false);
});

test('default real send fails before reservation when SES sender is missing', async () => {
  const reservations = [];
  delete process.env.SES_SENDER_EMAIL;
  const handler = createHandler({
    getBlogPost: () => ({ slug: 'pizza-night', title: 'Pizza Night', summary: 'A crispy backyard pizza experiment.', path: '/blog/pizza-night' }),
    listActiveSubscribers: async () => [{ subscriberId: 'subscriber-1', emailNormalized: 'one@example.com', unsubscribeToken: 'token-1' }],
    reserveNotificationSend: async (item) => reservations.push(item),
  });

  const response = await handler({ action: 'sendBlogPostNotification', postSlug: 'pizza-night', dryRun: false });

  assert.equal(response.statusCode, 500);
  assert.equal(response.success, false);
  assert.equal(response.recipientCount, 1);
  assert.deepEqual(reservations, []);
});
