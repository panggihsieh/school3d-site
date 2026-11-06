import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {campusMapImage} from '../dist/campus-map.js';import {stations,directions,latestViews} from '../dist/space-domain.js';
const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
test('all active campus overview surfaces use the same current image and north-up labels',()=>{
 assert.ok(existsSync(new URL('../dist/'+campusMapImage,import.meta.url)));
 assert.ok(read('capture.html').includes(campusMapImage));assert.ok(read('space-capture.js').includes(campusMapImage));assert.ok(read('field.js').includes(campusMapImage));
 assert.match(read('photo-map.js'),/image.src=campusMapImage/);
 for(const name of ['capture.html','capture.js','space-capture.js','field.html','field-domain.js']){assert.ok(!read(name).includes('左下 ↙'),name);assert.ok(!read(name).includes('campus-overview.png'),name);}
 assert.deepEqual(directions.map(x=>x[0]),['north','east','south','west']);assert.match(directions[0][1],/上方/);assert.match(directions[1][1],/右方/);
});
test('image station relocation preserves photo identity without inventing measured GPS',()=>{
 assert.deepEqual(stations.map(x=>x.id),Array.from({length:18},(_,i)=>'P'+String(i+1).padStart(2,'0')));
 for(const s of stations){assert.ok(s.x>=0&&s.x<=100&&s.y>=0&&s.y<=100);assert.equal(s.confirmed,false);assert.equal(s.latitude,undefined);}
 assert.deepEqual(stations.find(s=>s.id==='P07').x,58);assert.deepEqual(stations.find(s=>s.id==='P09').y,79);
 const record={target:'P09',kind:'north',id:'existing'};assert.equal(latestViews([record],'P09').north,record);
});
