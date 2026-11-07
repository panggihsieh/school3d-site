import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('environment education originals retain their recorded bytes and provenance',()=>{
 const data=JSON.parse(readFileSync(new URL('../dist/environment-education.json',import.meta.url),'utf8'));
 assert.equal(data.documents.length,2);
 for(const item of data.documents){
  assert.equal(item.priority,'important');assert.ok(item.originalFilename&&item.source&&item.rights);
  assert.ok(item.url.startsWith('./assets/environment-education/'));
  const raw=readFileSync(new URL('../dist/'+item.url.slice(2),import.meta.url));
  assert.equal(raw.length,item.bytes);assert.equal(createHash('sha256').update(raw).digest('hex'),item.sha256);
  assert.equal(raw.subarray(0,2).toString('hex'),item.format==='DOCX'?'504b':'ffd8');
 }
});
