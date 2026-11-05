import test from 'node:test';
import assert from 'node:assert/strict';
import {createFieldSpeaker} from '../dist/field-speech.js';
test('manual target reading works even with automatic reminders disabled',()=>{
 const spoken=[],messages=[];class Utterance{constructor(text){this.text=text;}}
 const speaker=createFieldSpeaker({synth:{cancel(){},resume(){},getVoices:()=>[{lang:'zh-TW'}],speak:u=>spoken.push(u)},Utterance,enabled:()=>false,status:t=>messages.push(t)});
 assert.equal(speaker.speak('自動提示'),false);assert.equal(spoken.length,0);
 assert.equal(speaker.speak('目前目標 T001',{manual:true}),true);assert.equal(spoken[0].text,'目前目標 T001');assert.equal(spoken[0].voice.lang,'zh-TW');
 spoken[0].onstart();assert.match(messages.at(-1),/正在朗讀/);spoken[0].onend();assert.equal(messages.at(-1),'朗讀完成。');speaker.stop();
});
test('missing speech capability produces visible feedback',()=>{
 let message='';const speaker=createFieldSpeaker({enabled:()=>true,status:t=>message=t});assert.equal(speaker.speak('目標',{manual:true}),false);assert.match(message,/不支援/);
});
test('browser speech errors do not fail silently',()=>{
 let speech,message='';const speaker=createFieldSpeaker({synth:{cancel(){},speak:u=>speech=u},Utterance:class{},enabled:()=>true,status:t=>message=t});speaker.speak('目標');speech.onerror({error:'not-allowed'});assert.match(message,/not-allowed/);speaker.stop();
});
