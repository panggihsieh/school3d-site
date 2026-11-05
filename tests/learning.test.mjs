import test from 'node:test';
import assert from 'node:assert/strict';
import {seasonForMonth,circumferenceToDbh,plantAnswer} from '../dist/learning.js';
import {calculateCarbon} from '../dist/tree/carbon.js';

test('Taiwan calendar season boundaries include December and February in winter',()=>{
 assert.deepEqual(Array.from({length:12},(_,i)=>seasonForMonth(i+1)),[
  'winter','winter','spring','spring','spring','summer','summer','summer','autumn','autumn','autumn','winter'
 ]);
 for(const value of [0,13,1.5,NaN])assert.throws(()=>seasonForMonth(value));
});
test('measured circumference converts to diameter and rejects invalid measurements',()=>{
 assert.ok(Math.abs(circumferenceToDbh(31.4159265359)-10)<1e-9);
 for(const value of [0,-1,Infinity,NaN,2001])assert.throws(()=>circumferenceToDbh(value));
});
test('plant answers do not substitute carbon stock for missing annual uptake',()=>{
 const tree={name:'測試樹',species:'測試樹',height:12,dbh:20,sourceStockCO2e:100,uptake:null,emissions:null};
 assert.match(plantAnswer(tree,'每年吸碳多少'),/目前沒有資料/);
 assert.doesNotMatch(plantAnswer(tree,'每年吸碳多少'),/100 kg/);
 assert.match(plantAnswer(tree,'平台儲碳多少'),/100 kg CO₂e/);
 assert.match(plantAnswer(tree,'一年維護排碳多少'),/年度維護排碳/);
 assert.match(plantAnswer(tree,'樹高'),/12 公尺/);
 assert.match(plantAnswer(tree,'未知的問題'),/尚未連接生成式 AI/);
});
test('maintenance exercise calculates emissions without inventing uptake and requires a source',()=>{
 const request={year:2026,uptake:null,activities:[{name:'教學澆水用電',quantity:4,unit:'kWh',factor:.5,source:'僅為教學假設'}]};
 const result=calculateCarbon(request);
 assert.equal(result.emissions,2);assert.equal(result.uptake,null);assert.equal(result.difference,null);
 assert.throws(()=>calculateCarbon({...request,activities:[{...request.activities[0],source:''}]}));
 assert.throws(()=>calculateCarbon({...request,activities:[{...request.activities[0],quantity:-1}]}));
});
