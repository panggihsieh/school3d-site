import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('twelve school photo slots retain licensed photographs and verified file hashes',()=>{
 const data=JSON.parse(readFileSync(new URL('../dist/bird-reference.json',import.meta.url)));
 assert.equal(data.birds.length,12);
 assert.equal(new Set(data.birds.map(b=>b.id)).size,12);
 for(const bird of data.birds){
  assert.ok(bird.artist);assert.match(bird.license,/^(CC BY|CC0|Public domain)/);
  assert.match(bird.sourceUrl,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
  assert.match(bird.licenseUrl,/^https?:\/\//);
  assert.equal(createHash('sha256').update(readFileSync(new URL('../dist/'+bird.image,import.meta.url))).digest('hex'),bird.sha256);
 }
 assert.match(data.birds.find(b=>b.id==='owl-b').name,/待核對/);
});
