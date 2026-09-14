import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const targetUrl = 'https://drakejrobert-sudo.github.io/galaxy-grown-games';
const sourceUrl = new URL('./game-shortlink.js', import.meta.url);
const source = (await readFile(sourceUrl, 'utf8')).replace(
  '__GAME_SHORTLINK_TARGET_URL__',
  JSON.stringify(targetUrl),
);
const context = vm.createContext({ encodeURIComponent });
vm.runInContext(source, context);

function redirect(uri = '/', querystring = {}, host = 'play.drakesfood.com') {
  return context.handler({
    request: {
      uri,
      querystring,
      headers: { host: { value: host } },
    },
  });
}

function assertRedirect(response, expectedLocation) {
  assert.equal(response.statusCode, 302);
  assert.equal(response.statusDescription, 'Found');
  assert.equal(response.headers.location.value, expectedLocation);
  assert.equal(response.headers['cache-control'].value, 'no-store');
}

test('redirects the root path to the game root', () => {
  assertRedirect(redirect(), `${targetUrl}/`);
});

test('preserves nested paths', () => {
  assertRedirect(
    redirect('/missions/asteroid-field'),
    `${targetUrl}/missions/asteroid-field`,
  );
});

test('preserves ordinary query parameters', () => {
  assertRedirect(
    redirect('/', {
      role: { value: 'pilot' },
      difficulty: { value: 'very easy' },
    }),
    `${targetUrl}/?role=pilot&difficulty=very%20easy`,
  );
});

test('preserves repeated query parameters', () => {
  assertRedirect(
    redirect('/practice', {
      tag: {
        value: 'touch',
        multiValue: [{ value: 'touch' }, { value: 'desktop' }],
      },
    }),
    `${targetUrl}/practice?tag=touch&tag=desktop`,
  );
});

test('preserves empty query values', () => {
  assertRedirect(
    redirect('/', { practice: { value: '' } }),
    `${targetUrl}/?practice=`,
  );
});

test('does not accept a redirect target from the host or query string', () => {
  assertRedirect(
    redirect('/', { url: { value: 'https://example.com' } }, 'example.com'),
    `${targetUrl}/?url=https%3A%2F%2Fexample.com`,
  );
});
