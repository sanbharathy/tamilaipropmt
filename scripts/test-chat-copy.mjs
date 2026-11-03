import assert from 'node:assert/strict';
import { copyChatLink } from '../lib/chat-copy.ts';
const originalNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    'navigator',
  ),
  originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
let removed = 0,
  selected = 0,
  fallback = false,
  copies = 0;
try {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      activeElement: { focus() {} },
      body: { appendChild() {} },
      createElement() {
        return {
          style: {},
          setAttribute() {},
          focus() {},
          select() {
            selected++;
          },
          setSelectionRange() {},
          remove() {
            removed++;
          },
        };
      },
      execCommand() {
        copies++;
        return fallback;
      },
    },
  });
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (text) =>
          assert.equal(text, 'https://example.test/chat#invite=test'),
      },
    },
  });
  assert.equal(
    await copyChatLink('https://example.test/chat#invite=test'),
    true,
  );
  assert.equal(copies, 0);
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        writeText: async () => {
          throw new Error('Blocked');
        },
      },
    },
  });
  fallback = true;
  assert.equal(await copyChatLink('fallback test'), true);
  assert.equal(selected, 1);
  assert.equal(removed, 1);
  fallback = false;
  assert.equal(await copyChatLink('manual test'), false);
  assert.equal(removed, 2);
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {},
  });
  fallback = true;
  assert.equal(await copyChatLink('older browser'), true);
  assert.equal(await copyChatLink(''), false);
  console.log(
    'PASS: exact clipboard text, blocked Clipboard API fallback, older browsers, manual-copy failure reporting and temporary-field cleanup.',
  );
} finally {
  if (originalNavigator)
    Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else delete globalThis.navigator;
  if (originalDocument)
    Object.defineProperty(globalThis, 'document', originalDocument);
  else delete globalThis.document;
}
