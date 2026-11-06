import test from 'node:test';import assert from 'node:assert/strict';
import {northUpPoint,originalPoint,imageWidth,imageHeight} from '../dist/map-orientation.js';
import {stations,directions} from '../dist/space-domain.js';
test('135 degree rotation sends original lower-left north upward',()=>{const a=northUpPoint(50,50),b=northUpPoint(50-100/imageWidth,50+100/imageHeight);assert.ok(Math.abs(a.x-b.x)<1e-10);assert.ok(b.y<a.y);});
test('corners and all station percentages round-trip without losing legacy coordinates',()=>{for(const p of [...stations,{x:0,y:0},{x:100,y:0},{x:0,y:100},{x:100,y:100}]){const q=northUpPoint(p.x,p.y);assert.ok(q.x>=-1e-10&&q.x<=100+1e-10&&q.y>=-1e-10&&q.y<=100+1e-10);const r=originalPoint(q.x,q.y);assert.ok(Math.abs(r.x-p.x)<1e-10);assert.ok(Math.abs(r.y-p.y)<1e-10);}assert.equal(stations[0].id,'P01');assert.equal(stations[0].x,11);assert.equal(stations[0].y,89);});
test('capture direction keys stay unchanged and labels match north-up',()=>{assert.deepEqual(directions.map(x=>x[0]),['north','east','south','west']);assert.match(directions[0][1],/上方/);assert.match(directions[1][1],/右方/);});
