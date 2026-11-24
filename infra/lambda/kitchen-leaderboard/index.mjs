import { createHash } from 'node:crypto';

const BOARD_KEY = 'survival-v1';
const MAX_ATTEMPTS = 5;
const ALIAS_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _-]{0,15}$/;
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: JSON.stringify(body),
  };
}

function publicEntries(entries) {
  return entries.map(({ alias, score }) => ({ alias, score }));
}

function submission(event) {
  if (
    event.isBase64Encoded ||
    typeof event.body !== 'string' ||
    Buffer.byteLength(event.body) > 512
  ) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return null;
  }

  const { alias, score, token } = payload ?? {};
  const name = typeof alias === 'string' ? alias.trim() : '';
  if (
    !ALIAS_PATTERN.test(name) ||
    typeof token !== 'string' ||
    !TOKEN_PATTERN.test(token) ||
    !Number.isSafeInteger(score) ||
    score < 0 ||
    score % 10 !== 0
  ) {
    return null;
  }

  const player = createHash('sha256').update(token.toLowerCase()).digest('hex');
  return { player, alias: name, score };
}

export const createHandler =
  ({ read = readBoard, write = writeBoard } = {}) =>
  async (event = {}) => {
    const method = event.requestContext?.http?.method;
    try {
      if (method === 'GET') {
        const board = await read();
        return json(200, { entries: publicEntries(board.entries) });
      }

      if (method !== 'POST') return json(405, { error: 'Method not allowed' });

      const entry = submission(event);
      if (!entry) return json(400, { error: 'Invalid score submission' });

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const board = await read();
        const previous = board.entries.find(({ player }) => player === entry.player);
        if (previous && previous.score >= entry.score) {
          return json(200, { entries: publicEntries(board.entries), outcome: 'kept' });
        }

        // Stable sort puts each new submission behind existing entries at the same score.
        const entries = [...board.entries.filter(({ player }) => player !== entry.player), entry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        if (!entries.includes(entry)) {
          return json(200, { entries: publicEntries(board.entries), outcome: 'missed' });
        }

        if (await write(board.version, entries)) {
          return json(200, { entries: publicEntries(entries), outcome: 'placed' });
        }
      }
    } catch (error) {
      console.error('Kitchen leaderboard request failed', error.name);
    }

    return json(503, { error: 'Leaderboard temporarily unavailable' });
  };

let sdkPromise;
function dynamo() {
  sdkPromise ??= import('@aws-sdk/client-dynamodb').then((sdk) => ({
    client: new sdk.DynamoDBClient({}),
    GetItemCommand: sdk.GetItemCommand,
    PutItemCommand: sdk.PutItemCommand,
  }));
  return sdkPromise;
}

async function readBoard() {
  const { client, GetItemCommand } = await dynamo();
  const { Item } = await client.send(
    new GetItemCommand({
      TableName: process.env.KITCHEN_LEADERBOARD_TABLE,
      Key: { board: { S: BOARD_KEY } },
      ConsistentRead: true,
    }),
  );

  return Item
    ? { version: Number(Item.version.N), entries: JSON.parse(Item.entries.S) }
    : { version: 0, entries: [] };
}

async function writeBoard(version, entries) {
  const { client, PutItemCommand } = await dynamo();
  try {
    await client.send(
      new PutItemCommand({
        TableName: process.env.KITCHEN_LEADERBOARD_TABLE,
        Item: {
          board: { S: BOARD_KEY },
          version: { N: String(version + 1) },
          entries: { S: JSON.stringify(entries) },
        },
        ...(version === 0
          ? { ConditionExpression: 'attribute_not_exists(board)' }
          : {
              ConditionExpression: '#version = :previous',
              ExpressionAttributeNames: { '#version': 'version' },
              ExpressionAttributeValues: { ':previous': { N: String(version) } },
            }),
      }),
    );
    return true;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') return false;
    throw error;
  }
}

export const handler = createHandler();
