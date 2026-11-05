import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {referenceForPlant} from '../dist/species-library.js';
const data=JSON.parse(readFileSync(new URL('../dist/data.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../dist/species-photos.json',import.meta.url)));
const trees=data.points.filter(p=>p.topic==='carbon');
test('every campus tree maps to an explicit species reference or pending record',()=>{
 assert.equal(trees.length,127);assert.equal(Object.keys(manifest.species).length,46);assert.equal(manifest.referenceOnly,true);
 for(const tree of trees){const record=referenceForPlant(manifest,tree);assert.ok(record,tree.id);assert.equal(record.referenceOnly,true);assert.equal(record.scientificName,tree.scientificName);assert.ok(['pending','available'].includes(record.status));if(record.status==='pending'){assert.equal(record.photos.length,0);assert.ok(record.reason);}}
 assert.equal(referenceForPlant(manifest,{sourceSpeciesCode:'unknown'}),null);
});
test('downloaded reference photos have verifiable bytes, author, license and source',()=>{
 for(const record of Object.values(manifest.species))for(const photo of record.photos){
  assert.match(photo.url,/^\.\/assets\/species-reference\/[a-zA-Z0-9-]+\.(jpg|png|webp)$/);
  assert.equal(new URL(photo.source).hostname,'commons.wikimedia.org');assert.equal(new URL(photo.source).protocol,'https:');
  assert.ok(photo.artist);assert.match(photo.license,/^(CC BY|CC0|Public domain)/i);assert.ok(photo.licenseURL);
  assert.doesNotMatch(photo.title,/illustration|drawing|painting|diagram|\brange\b|\bmaps?\b/i);
  const bytes=readFileSync(new URL('../dist/'+photo.url.slice(2),import.meta.url));assert.equal(bytes.length,photo.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),photo.sha256);
 }
});
