import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPlantAudio} from '../dist/plant-audio.js';
function setup(reject=false){const messages=[];const audio={pause(){},load(){},play(){return reject?Promise.reject(Error('blocked')):Promise.resolve();}};return {audio,messages,player:createPlantAudio({audio,status:t=>messages.push(t),stopSpeech(){}})};}
test('recorded target audio uses normal media and preserves manual playback against automatic reminders',()=>{
 const p=setup();assert.equal(p.player.play('MOE212344'),true);assert.equal(p.audio.src,'./assets/plant-audio/MOE212344.wav');assert.equal(p.player.play('test',{manual:false}),false);
 p.audio.onended();assert.equal(p.player.play('test',{manual:false}),true);p.player.stop();assert.equal(p.player.play('../bad'),false);
});
test('autoplay rejection offers the native player rather than claiming audible success',async()=>{
 const p=setup(true);p.player.play('stt-success');await Promise.resolve();assert.match(p.messages.at(-1),/播放鍵/);p.player.stop();
});
test('every campus tree and diagnostic phrase has a non-silent PCM WAV clip',()=>{
 const trees=JSON.parse(readFileSync(new URL('../dist/data.json',import.meta.url))).points.filter(t=>t.topic==='carbon');
 for(const id of [...trees.map(t=>t.id),'test','stt-success','no-target','location-unavailable','location-stale','location-inaccurate','outside-campus','target-distant',...Array.from({length:18},(_,i)=>'P'+String(i+1).padStart(2,'0'))]){
  const wav=readFileSync(new URL(`../dist/assets/plant-audio/${id}.wav`,import.meta.url));assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');assert.ok(wav.length>1000);assert.ok(wav.subarray(100).some(b=>b>0));
 }
});
