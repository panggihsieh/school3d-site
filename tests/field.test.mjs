import test from 'node:test';import assert from 'node:assert/strict';import {distanceMeters,nearbyTrees,arrivalEligible,chooseNearbyTarget} from '../dist/field-domain.js';
test('distance and nearest trees use geographic coordinates',()=>{const origin={latitude:23.5588,longitude:120.5547};assert.equal(distanceMeters(origin,origin),0);const close={id:'near',latitude:23.55881,longitude:120.5547},far={id:'far',latitude:23.5688,longitude:120.5547};assert.equal(nearbyTrees([far,close],origin)[0].id,'near');assert.ok(distanceMeters(origin,far)>1000);});
test('arrival requires proximity and acceptable GPS accuracy',()=>{assert.equal(arrivalEligible(10,15),true);assert.equal(arrivalEligible(30,5),false);assert.equal(arrivalEligible(5,40),false);assert.equal(arrivalEligible(NaN,5),false);});
test('first location fix chooses the nearest tree and movement updates it',()=>{
 const trees=[{id:'west',latitude:23.5588,longitude:120.5547},{id:'east',latitude:23.5588,longitude:120.5552}];
 let nearby=nearbyTrees(trees,trees[0]);assert.equal(chooseNearbyTarget(nearby,null,8).tree.id,'west');
 nearby=nearbyTrees(trees,trees[1]);assert.equal(chooseNearbyTarget(nearby,'west',8).tree.id,'east');
});
test('GPS jitter and overlapping coordinates keep the current tree stable',()=>{
 assert.equal(chooseNearbyTarget([{id:'a',distance:7},{id:'b',distance:9}],'b',6).tree.id,'b');
 assert.equal(chooseNearbyTarget([{id:'a',distance:0},{id:'b',distance:0}],'b',2).tree.id,'b');
 assert.equal(chooseNearbyTarget([{id:'a',distance:2},{id:'b',distance:20}],'b',6).tree.id,'a');
});
test('inaccurate fixes defer selection and empty data is safe',()=>{
 const nearby=[{id:'a',distance:2},{id:'b',distance:20}];
 for(const accuracy of [26,100,NaN,-1]){assert.equal(chooseNearbyTarget(nearby,null,accuracy).tree,null);assert.equal(chooseNearbyTarget(nearby,'b',accuracy).tree.id,'b');}
 assert.equal(chooseNearbyTarget([],null,5).tree,null);
});
