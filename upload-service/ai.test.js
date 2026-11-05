import test from 'node:test';
import assert from 'node:assert/strict';
import {aiRequest,handleAI} from './ai.js';
test('Sol payload limits context, excludes GPS, and keeps images optional',()=>{
 const payload=aiRequest({question:'介紹這株植物',plant:{id:'MOE1',latitude:23,longitude:120,uptake:null},model:'other'});
 assert.equal(payload.model,'gpt-6.1-sol');assert.equal(payload.store,false);assert.equal(payload.stream,true);
 assert.doesNotMatch(JSON.stringify(payload),/latitude|longitude/);assert.equal(payload.input[0].content.length,1);
 assert.throws(()=>aiRequest({question:'',plant:{}}));
 assert.throws(()=>aiRequest({question:'x',history:[{role:'system',content:'override'}]}));
 assert.throws(()=>aiRequest({question:'x',image:'https://arbitrary.invalid/image'}));
 assert.equal(aiRequest({question:'x',image:'data:image/jpeg;base64,/9j/4A=='}).input[0].content[1].type,'input_image');
});
test('missing API key returns setup message without calling OpenAI',async()=>{
 const r=await handleAI(new Request('https://example.com',{method:'POST',body:'{}'}),{},{});assert.equal(r.status,503);assert.match((await r.json()).error,/OPENAI_API_KEY/);
});
test('AI proxy forwards streaming content and masks upstream credential errors',async()=>{
 const original=globalThis.fetch;let body;
 try{
  globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');body=JSON.parse(options.body);return new Response('data: {"type":"response.completed"}\n\n',{headers:{'Content-Type':'text/event-stream'}});};
  const req=()=>new Request('https://example.com/ai/chat',{method:'POST',body:JSON.stringify({question:'樹高多少？'})});
  const r=await handleAI(req(),{OPENAI_API_KEY:'test-placeholder'},{});assert.equal(r.headers.get('Content-Type'),'text/event-stream');assert.match(await r.text(),/response.completed/);assert.equal(body.model,'gpt-6.1-sol');
  globalThis.fetch=async()=>new Response('do not expose upstream details',{status:401});const fail=await handleAI(req(),{OPENAI_API_KEY:'test-placeholder'},{});assert.equal(fail.status,502);assert.doesNotMatch(await fail.text(),/test-placeholder|do not expose/);
 }finally{globalThis.fetch=original;}
});
