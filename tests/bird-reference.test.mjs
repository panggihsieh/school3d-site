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

test('verified school birds retain attributed video bytes while the unverified owl stays pending',()=>{
 const data=JSON.parse(readFileSync(new URL('../dist/bird-reference.json',import.meta.url)));
 for(const bird of data.birds){
  if(bird.name.includes('待核對')){assert.equal(bird.animation??null,null);continue;}
  const bytes=readFileSync(new URL('../dist/'+bird.animation,import.meta.url));assert.equal(bytes.subarray(0,4).toString('hex'),'1a45dfa3');assert.equal(createHash('sha256').update(bytes).digest('hex'),bird.animationSha256);assert.equal(bird.animationDurationSeconds,15);assert.ok(bird.animationAttribution);assert.ok(bird.animationLicense);assert.match(bird.animationSource,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
 }
});
