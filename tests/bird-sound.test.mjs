import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('both map birds use matching licensed audio with intact downloadable originals',()=>{
 const sounds=JSON.parse(readFileSync(new URL('../dist/assets/birds/sounds/sources.json',import.meta.url)));
 assert.deepEqual(sounds.map(s=>s.station),['B01','B02']);
 for(const sound of sounds){
  assert.match(sound.source,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
  assert.ok(sound.artist);assert.match(sound.license,/^CC/);assert.match(sound.licenseUrl,/creativecommons.org/);
  const bytes=readFileSync(new URL('../dist/'+sound.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),sound.sha256);
  const original=readFileSync(new URL('../dist/assets/birds/sounds/'+sound.originalFile,import.meta.url));assert.equal(original.subarray(0,4).toString(),'OggS');
 }
 assert.match(sounds[0].source,/Passer_montanus/);assert.match(sounds[1].source,/Pycnonotus_sinensis/);
});
