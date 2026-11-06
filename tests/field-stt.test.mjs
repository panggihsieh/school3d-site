import test from 'node:test';
import assert from 'node:assert/strict';
import {mountSpeechTest} from '../dist/field-stt.js';
function setup({supported=true,authorized=true}={}){
 const button={},status={},result={},handlers={};let active,stopped=0;
 class Recognition{constructor(){active=this;}start(){this.onstart();}abort(){this.aborted=true;this.onend?.();}}
 const document={addEventListener:(name,handler)=>handlers[name]=handler};
 mountSpeechTest({button,status,result,Recognition:supported?Recognition:null,isAdmin:()=>authorized,stopSpeech:()=>stopped++,document});
 return {button,status,result,document,handlers,active:()=>active,stopped:()=>stopped};
}
test('STT starts only on click, uses Chinese, displays results and resets after completion',()=>{
 const p=setup();assert.equal(p.active(),undefined);p.button.onclick();const r=p.active();assert.equal(r.lang,'zh-TW');assert.equal(p.stopped(),1);
 r.onresult({results:[[{transcript:'大南國小'}]]});assert.equal(p.result.textContent,'大南國小');r.onend();assert.match(p.status.textContent,/完成/);assert.equal(p.button.textContent,'語音測試 STT');
});
test('permission errors remain visible after recognition ends',()=>{
 const p=setup();p.button.onclick();p.active().onerror({error:'not-allowed'});p.active().onend();assert.match(p.status.textContent,/權限未開啟/);
});
test('backgrounding aborts the microphone and ignores late transcripts',()=>{
 const p=setup();p.button.onclick();const r=p.active();p.document.hidden=true;p.handlers.visibilitychange();assert.equal(r.aborted,true);r.onresult({results:[[{transcript:'late'}]]});assert.equal(p.result.textContent,'');
});
test('unsupported browsers and unauthorized users do not open microphones',()=>{
 const p=setup({supported:false});assert.equal(p.button.disabled,true);assert.match(p.status.textContent,/不支援/);
 const q=setup({authorized:false});q.button.onclick();assert.equal(q.active(),undefined);
});
