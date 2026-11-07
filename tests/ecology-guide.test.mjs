import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {filterEcologyTopics,seasonForEcologyMonth,ecologyPhotoIds,ecologySeasons} from '../dist/ecology-guide-core.js';
const guide=JSON.parse(readFileSync(new URL('../dist/ecology-guide.json',import.meta.url),'utf8'));
const campus=JSON.parse(readFileSync(new URL('../dist/data.json',import.meta.url),'utf8'));

test('ecology month boundaries and invalid months',()=>{
 assert.deepEqual(Array.from({length:12},(_,i)=>seasonForEcologyMonth(i+1)),['winter','winter','spring','spring','spring','summer','summer','summer','autumn','autumn','autumn','winter']);
 for(const value of [0,13,1.5,NaN,'3'])assert.throws(()=>seasonForEcologyMonth(value),RangeError);
});
test('search combines normalized text with season and gallery excludes pending photos',()=>{
 const topics=[{title:'ＡＢＣ',plant:'樟樹',animals:['青鳳蝶'],seasons:['spring'],photoIds:['ready','pending','ready']},{title:'冬日',plant:'苦楝',animals:[],seasons:['winter'],photoIds:['ready']}];
 assert.equal(filterEcologyTopics(topics,' abc ','spring').length,1);
 assert.equal(filterEcologyTopics(topics,'樟樹','winter').length,0);
 assert.equal(filterEcologyTopics(topics,'青鳳蝶').length,1);
 assert.deepEqual(ecologyPhotoIds(topics,{ready:{url:'./photo.jpg'},pending:{status:'pending'}}),['ready']);
});
test('guide distinguishes reference relations from campus observations and uses existing tree species',()=>{
 assert.equal(guide.topics.length,11);assert.equal(new Set(guide.topics.map(t=>t.id)).size,11);
 const codes=new Set(campus.points.filter(p=>p.topic==='carbon').map(p=>p.sourceSpeciesCode));
 for(const topic of guide.topics){
  assert.equal(topic.confirmed,false);assert.ok(topic.campusStatus);
  assert.ok(topic.seasons.length&&topic.seasons.every(s=>ecologySeasons.includes(s)));
  for(const code of topic.treeSpeciesCodes)assert.ok(codes.has(code));
  for(const id of topic.photoIds)assert.ok(guide.photos[id]);
  for(const source of topic.sources)assert.equal(new URL(source.url).protocol,'https:');
 }
});
test('all 20 reference photos preserve licensed local bytes and provenance',()=>{
 const photos=Object.values(guide.photos).filter(p=>p.url);assert.equal(photos.length,20);
 for(const photo of photos){
  assert.equal(photo.referenceOnly,true);assert.ok(photo.artist&&photo.license&&photo.source&&photo.licenseURL);
  assert.equal(new URL(photo.source).protocol,'https:');assert.equal(new URL(photo.licenseURL).protocol,'https:');
  assert.ok(photo.url.startsWith('./assets/')&&!photo.url.includes('ai-background'));
  const bytes=readFileSync(new URL('../dist/'+photo.url.slice(2),import.meta.url));
  assert.equal(bytes.length,photo.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),photo.sha256);
 }
 assert.equal(guide.photos.larva.status,'pending');assert.ok(!guide.photos.larva.url);
 assert.match(guide.photos.graphium.title,/sarpedon/i);
});
