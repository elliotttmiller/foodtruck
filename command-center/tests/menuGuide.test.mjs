import test from 'node:test';
import assert from 'node:assert/strict';
import {BURGER_BUILDS,LOADED_FRIES_BUILDS} from '../src/lib/menuGuide.js';

test('cook guide contains only the four burger and three loaded-fries menu builds',()=>{assert.equal(BURGER_BUILDS.length,4);assert.equal(LOADED_FRIES_BUILDS.length,3);assert.deepEqual(BURGER_BUILDS.map(item=>item.name),['The Uff-Da','Single Smash','Beef Bacon Smash','The Northside']);assert.deepEqual(LOADED_FRIES_BUILDS.map(item=>item.name),['Classic Loaded','Smash-Style','Buffalo Chicken']);});
test('cook guide preserves the printed ingredients for signature builds',()=>{assert.deepEqual(BURGER_BUILDS[0].ingredients,['Double smash','American','Pickle','Onion','House sauce']);assert.deepEqual(BURGER_BUILDS[3].ingredients,['Double smash','Pepper jack','Jalapeño','Hot honey']);assert.deepEqual(LOADED_FRIES_BUILDS[1].ingredients,['Burger crumble','Cheese','Pickle','Onion','House sauce']);});
