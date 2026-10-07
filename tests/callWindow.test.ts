import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reserveCall } from '../convex/callWindow.ts';

test('allows thirty calls and blocks further attempts in a rolling hour', () => {
  let calls: number[] = [];
  for (let i = 0; i < 30; i++) calls = reserveCall(calls, i)!;
  assert.equal(calls.length, 30);
  assert.equal(reserveCall(calls, 3599999), null);
  assert.equal(reserveCall(calls, 3600000)?.length, 30);
  assert.equal(reserveCall(calls, 3600000)?.[0], 1);
  assert.deepEqual(reserveCall(calls, 7200000), [7200000]);
});
