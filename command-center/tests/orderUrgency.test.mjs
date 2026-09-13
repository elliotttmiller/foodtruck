import test from 'node:test';
import assert from 'node:assert/strict';
import {orderUrgency} from '../src/lib/orderUrgency.js';

const now=Date.parse('2026-09-13T12:00:00Z');
test('active-order urgency starts overdue at exactly ten minutes',()=>{
  assert.equal(orderUrgency({created_at:'2026-09-13T11:50:01Z'},now),'warning');
  assert.equal(orderUrgency({created_at:'2026-09-13T11:50:00Z'},now),'overdue');
  assert.equal(orderUrgency({created_at:'2026-09-13T11:49:59Z'},now),'overdue');
});
test('Square creation time takes precedence and invalid dates stay neutral',()=>{
  assert.equal(orderUrgency({source_created_at:'2026-09-13T11:54:00Z',created_at:'2026-09-13T11:00:00Z'},now),'warning');
  assert.equal(orderUrgency({created_at:'invalid'},now),'');
});
