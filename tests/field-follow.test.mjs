import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {photoKinds,nearbyTrees,arrivalEligible,chooseNearbyTarget,targetReadingContext} from '../dist/field-domain.js';
// Run the page's actual GPS callback without Firebase, device permissions or network.
function page(){
 const elements=new Map(),references=[],events=[],spoken=[],clips=[],handlers={};let onPosition;
 class Element{constructor(){this.children=[];this.checked=false;this.value='';this.namespaceURI='http://www.w3.org/2000/svg';}replaceChildren(...children){this.children=children;}append(...children){this.children.push(...children);}setAttribute(key,value){this[key]=value;}}
 const element=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 element('#follow-location').checked=true;
 const context=vm.createContext({URLSearchParams,location:{search:''},photoKinds,nearbyTrees,arrivalEligible,chooseNearbyTarget,targetReadingContext,showPublishedPhotos:()=>{},createPlantAudio:()=>({play(id,options){clips.push({id,options});},stop(){}}),createFieldSpeaker:()=>({speak(text,options){spoken.push({text,options});},stop(){}}),createWikiReference:()=>()=>{},createSpeciesReference:()=>plant=>references.push(plant.id),isAuthorizedAdmin:()=>true,window:{addEventListener(){}},navigator:{geolocation:{watchPosition(callback){onPosition=callback;return 1;},clearWatch(){}}},Event:class{constructor(type){this.type=type;}},document:{querySelector:element,createElement:()=>new Element(),createElementNS:()=>new Element(),addEventListener(type,handler){handlers[type]=handler;},dispatchEvent:e=>events.push(e.type)}});
 const source=readFileSync(new URL('../dist/field.js',import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'').replace(/^publicGallery\(\);start\(\).*$/m,'');
 vm.runInContext(source,context);
 vm.runInContext(`trees=[{id:'west',name:'西側樹',label:'T001',species:'芒果',latitude:23.5588,longitude:120.5547},{id:'east',name:'東側樹',label:'T002',species:'榕樹',latitude:23.5588,longitude:120.5552}];selected=trees[1];locate();`,context);
 return {element,references,events,spoken,clips,visibility:hidden=>{context.document.hidden=hidden;handlers.visibilitychange();},run:code=>vm.runInContext(code,context),fix:(longitude,accuracy=6)=>onPosition({coords:{latitude:23.5588,longitude,accuracy},timestamp:Date.now()})};
}
test('GPS watch changes the displayed plant, photograph and AI context as the phone moves',()=>{
 const p=page();p.element('#confirmed').checked=true;p.fix(120.5547);
 assert.equal(p.run('selected.id'),'west');assert.equal(p.references.at(-1),'west');assert.equal(p.element('#confirmed').checked,false);assert.equal(p.element('#camera').disabled,true);
 p.fix(120.5552);assert.equal(p.run('selected.id'),'east');assert.equal(p.references.at(-1),'east');assert.equal(p.events.filter(e=>e==='teacher-context-change').length,2);assert.match(p.element('#follow-status').textContent,/自動跟隨中/);
});
test('manual selection stays fixed until restarting location restores automatic following',()=>{
 const p=page();p.fix(120.5547);p.run("manualTarget('west')");p.fix(120.5552);
 assert.equal(p.element('#follow-location').checked,false);assert.equal(p.run('selected.id'),'west');p.run('locate()');p.fix(120.5552);assert.equal(p.run('selected.id'),'east');assert.equal(p.element('#follow-location').checked,true);
});
test('poor GPS fixes preserve the target until accuracy recovers',()=>{
 const p=page();p.fix(120.5547,80);assert.equal(p.run('selected.id'),'east');assert.match(p.element('#follow-status').textContent,/精度改善/);
 p.fix(120.5547,8);assert.equal(p.run('selected.id'),'west');
});

test('nearest plant keeps updating while the photograph target is locked',()=>{
 const p=page();p.fix(120.5547);p.run("manualTarget('west')");p.element('#confirmed').checked=true;p.fix(120.5552);
 assert.equal(p.run('selected.id'),'west');assert.match(p.element('#nearest-live').textContent,/T002 榕樹/);assert.equal(p.element('#resume-follow').hidden,false);
 p.run('locate()');p.fix(120.5552);assert.equal(p.run('selected.id'),'west');
});

test('returning to the foreground resumes the active location watch',()=>{
 const p=page();p.fix(120.5547);p.visibility(true);assert.equal(p.run('watch'),undefined);
 p.visibility(false);assert.equal(p.run('watch'),1);p.fix(120.5552);assert.equal(p.run('selected.id'),'east');
});

test('faint campus background renders behind GPS points with a registration notice',()=>{
 const p=page();p.fix(120.5547);const nodes=p.element('#field-map').children;
 const image=nodes.findIndex(n=>n.href==='./assets/campus-base-v3-20261111.png');assert.equal(image,0);assert.equal(nodes[image].opacity,.4);
 assert.ok(nodes.some(n=>String(n.textContent).includes('未精準對位')));
 assert.ok(nodes.slice(image+1).some(n=>n.fill==='#d06c0b'));assert.equal(p.run('selected.id'),'west');
});

test('current target uses a short speech request independent of long photo instructions',()=>{
 const p=page();p.fix(120.5547);p.element('#instructions').textContent='很長的拍照說明'.repeat(100);
 p.run('readCurrentTarget()');const reading=p.spoken.at(-1);assert.equal(reading.text,'目前目標，T001，芒果。');assert.equal(reading.options.manual,true);assert.ok(p.events.includes('teacher-read-target'));
 p.fix(120.5552);p.run('readCurrentTarget()');assert.equal(p.spoken.at(-1).text,'目前目標，T002，榕樹。');
});

test('recorded reminders honor the automatic speech switch; manual target reading still works',()=>{
 const p=page();p.element('#tts-voice').value='recorded';p.fix(120.5547);assert.equal(p.clips.length,0);
 p.run('readCurrentTarget()');assert.equal(p.clips.at(-1).id,'west');
 p.element('#voice').checked=true;p.fix(120.5552);assert.equal(p.clips.at(-1).id,'east');assert.equal(p.clips.at(-1).options.manual,false);
});

test('off-campus manual reading warns instead of playing the selected tree in both modes',()=>{
 for(const mode of ['system','recorded']){
  const p=page();p.element('#tts-voice').value=mode;p.fix(120.60);p.run('readCurrentTarget()');
  assert.match(p.element('#gps-status').textContent,/不在校園樹木附近/);
  if(mode==='recorded')assert.equal(p.clips.at(-1).id,'outside-campus');
  else assert.match(p.spoken.at(-1).text,/不在校園樹木附近/);
 }
});
test('manual reading rejects stopped, stale and inaccurate GPS even with a selected tree',()=>{
 const p=page();p.element('#tts-voice').value='recorded';p.fix(120.5547);
 p.run('position.time=Date.now()-31000;readCurrentTarget()');assert.equal(p.clips.at(-1).id,'location-stale');
 p.fix(120.5547,80);p.run('readCurrentTarget()');assert.equal(p.clips.at(-1).id,'location-inaccurate');
 p.fix(120.5547);p.run('stopLocation();readCurrentTarget()');assert.equal(p.clips.at(-1).id,'location-unavailable');
});
test('reading proximity guards preserve the near target and distinguish a distant manual target',()=>{
 const now=100000,tree={id:'MOE1',label:'T001',species:'芒果',latitude:23.5588,longitude:120.5547};
 const position={...tree,time:now,accuracy:5};
 assert.equal(targetReadingContext([tree],tree,position,true,now).clip,tree.id);
 assert.equal(targetReadingContext([tree],null,position,true,now).clip,'no-target');
 assert.equal(targetReadingContext([tree],tree,undefined,true,now).clip,'location-unavailable');
 assert.equal(targetReadingContext([tree],tree,{...position,time:now+6000},true,now).clip,'location-stale');
 assert.equal(targetReadingContext([tree],{...tree,longitude:120.557},position,true,now).clip,'target-distant');
});

test('25 km GPS uncertainty never claims nearest plants or shows a precise phone point',()=>{const p=page();p.fix(120.60,25000);assert.match(p.element('#nearest-live').textContent,/無法判斷最近植物/);assert.equal(p.element('#nearby').children.length,0);assert.equal(p.run('selected.id'),'east');assert.ok(!p.element('#field-map').children.some(n=>n.fill==='#0876ca'));p.fix(120.5547,6);assert.match(p.element('#nearest-live').textContent,/T001/);assert.equal(p.element('#nearby').children.length,2);});
test('accurate but distant GPS reports outside campus without auto-switching the target',()=>{const p=page();p.fix(120.60,6);assert.match(p.element('#nearest-live').textContent,/不在校園樹木附近/);assert.equal(p.element('#nearby').children.length,0);assert.equal(p.run('selected.id'),'east');});
