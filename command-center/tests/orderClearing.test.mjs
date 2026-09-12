import test from 'node:test';
import assert from 'node:assert/strict';
import {ordersOlderThan} from '../src/lib/orderClearing.js';

test('age cutoff uses Square order time, includes boundary, and excludes future and invalid tickets',()=>{
  const now=Date.parse('2026-09-12T12:00:00Z');
  const orders=[
    {id:'old',source_created_at:'2026-09-12T09:00:00Z',created_at:'2026-09-12T11:59:00Z'},
    {id:'edge',created_at:'2026-09-12T10:00:00Z'},
    {id:'new',created_at:'2026-09-12T11:00:00Z'},
    {id:'invalid',created_at:'not-a-time'}
  ];
  assert.deepEqual(ordersOlderThan(orders,2,'hours',now).map(o=>o.id),['old','edge']);
  assert.deepEqual(ordersOlderThan(orders,0,'hours',now),[]);
  assert.deepEqual(ordersOlderThan(orders,2,'other',now),[]);
});
