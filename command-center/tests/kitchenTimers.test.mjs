import test from 'node:test';
import assert from 'node:assert/strict';
import { finishElapsed, remainingMs, restoreTimers, timerLabels } from '../src/lib/kitchenTimers.js';

test('independent countdowns survive a reload and only elapsed timers finish', () => {
  const saved = [{ id: 'a', label: 'Fries', state: 'running', endsAt: 124000, remainingMs: 240000 }, { id: 'b', label: 'Fries', state: 'running', endsAt: 364000, remainingMs: 240000 }];
  const restored = restoreTimers(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(timerLabels(restored), ['Fries 1', 'Fries 2']);
  assert.equal(remainingMs(restored[0], 120000), 4000);
  assert.equal(remainingMs(restored[1], 120000), 244000);
  assert.deepEqual(finishElapsed(restored, 125000).map(timer => timer.state), ['done', 'running']);
});

test('invalid stored timers cannot enter the service board', () => {
  assert.deepEqual(restoreTimers([{ id: 'bad', label: 'Fries', state: 'running', endsAt: 'tomorrow', remainingMs: 240000 }]), []);
  assert.equal(remainingMs({ state: 'paused', remainingMs: 90000 }, Date.now()), 90000);
});
