import test from 'node:test';
import assert from 'node:assert/strict';
import {findOrders} from '../src/lib/orderSearch.js';

const orders=[{id:'a',ticket_number:42,customer_name:'Mike',status:'active',items:[{name:'Double Smash',modifiers:['No onion']}]},{id:'b',ticket_number:43,customer_name:'Sarah',status:'ready',items:[{name:'Loaded Fries',note:'Sauce on side'}]}];
test('order finder searches tickets, customers, items, modifiers, and notes',()=>{assert.deepEqual(findOrders(orders,'#42').map(o=>o.id),['a']);assert.deepEqual(findOrders(orders,'mike smash').map(o=>o.id),['a']);assert.deepEqual(findOrders(orders,'no onion').map(o=>o.id),['a']);assert.deepEqual(findOrders(orders,'sauce side').map(o=>o.id),['b']);});
test('order finder is empty for blank input and respects its result limit',()=>{assert.deepEqual(findOrders(orders,'  '),[]);assert.equal(findOrders([...orders,...orders.map(o=>({...o,id:`${o.id}2`}))],'active',1).length,1);});
