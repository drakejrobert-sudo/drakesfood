import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createHandler } from './index.mjs';

function setup() {
  let board = { version: 0, entries: [] };
  let conflicts = 0;
  const handler = createHandler({
    read: async () => board,
    write: async (version, entries) => {
      if (board.version !== version) {
        conflicts++;
        return false;
      }
      board = { version: version + 1, entries };
      return true;
    },
  });

  const request = async (method, body) => {
    const result = await handler({ requestContext: { http: { method } }, body });
    return { status: result.statusCode, ...JSON.parse(result.body) };
  };

  return {
    get: () => request('GET'),
    post: (payload) => request('POST', JSON.stringify(payload)),
    request,
    conflicts: () => conflicts,
  };
}

test('returns only the best three profiles and preserves the first accepted tie', async () => {
  const { get, post } = setup();
  const player = randomUUID();
  assert.deepEqual(await get(), { status: 200, entries: [] });
  for (const [alias, score] of [
    ['Egg', 10],
    ['Burger', 80],
    ['Taco', 80],
  ]) {
    assert.equal((await post({ alias, score, token: randomUUID() })).outcome, 'placed');
  }
  assert.equal((await post({ alias: 'Pizza', score: 0, token: player })).outcome, 'missed');
  assert.equal((await post({ alias: 'Pizza', score: 40, token: player })).outcome, 'placed');
  assert.equal(
    (await post({ alias: 'Strawberry', score: 40, token: randomUUID() })).outcome,
    'missed',
  );
  assert.equal((await post({ alias: 'Other', score: 20, token: player })).outcome, 'kept');
  assert.equal((await post({ alias: 'Other', score: 40, token: player })).outcome, 'kept');
  assert.equal((await post({ alias: 'Pizza', score: 90, token: player })).outcome, 'placed');
  assert.deepEqual((await get()).entries, [
    { alias: 'Pizza', score: 90 },
    { alias: 'Burger', score: 80 },
    { alias: 'Taco', score: 80 },
  ]);
});

test('retries concurrent updates without losing higher scores or duplicating profiles', async () => {
  const { get, post, conflicts } = setup();
  const token = randomUUID();
  const results = await Promise.all([
    post({ alias: 'Egg', score: 10, token }),
    post({ alias: 'Egg', score: 50, token }),
    post({ alias: 'Burger', score: 30, token: randomUUID() }),
    post({ alias: 'Taco', score: 20, token: randomUUID() }),
    post({ alias: 'Pizza', score: 40, token: randomUUID() }),
  ]);
  assert(results.every(({ status }) => status === 200));
  assert(conflicts() > 0);
  assert.deepEqual((await get()).entries, [
    { alias: 'Egg', score: 50 },
    { alias: 'Pizza', score: 40 },
    { alias: 'Burger', score: 30 },
  ]);
});

test('rejects bad submissions and bounds retries when writes keep conflicting', async () => {
  const { get, post, request } = setup();
  assert.equal((await request('POST', 'broken JSON')).status, 400);
  assert.equal((await request('POST', ' '.repeat(513))).status, 400);
  assert.equal((await request('DELETE')).status, 405);
  const valid = { alias: 'Egg', score: 10, token: randomUUID() };
  for (const invalid of [
    { score: -10 },
    { score: 3 },
    { score: '10' },
    { alias: '<Egg>' },
    { token: 'guess' },
  ]) {
    assert.equal((await post({ ...valid, ...invalid })).status, 400);
  }
  assert.deepEqual((await get()).entries, []);

  let writes = 0;
  const handler = createHandler({
    read: async () => ({ version: 0, entries: [] }),
    write: async () => {
      writes++;
      return false;
    },
  });
  const response = await handler({
    requestContext: { http: { method: 'POST' } },
    body: JSON.stringify(valid),
  });
  assert.equal(response.statusCode, 503);
  assert.equal(writes, 5);
});
