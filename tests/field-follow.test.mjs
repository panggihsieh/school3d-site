import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {photoKinds,nearbyTrees,arrivalEligible,chooseNearbyTarget} from '../dist/field-domain.js';
// Run the page's actual GPS callback without Firebase, device permissions or network.
function page(){
 const elements=new Map(),references=[],events=[];let onPosition;
 class Element{constructor(){this.children=[];this.checked=false;this.value='';this.namespaceURI='http://www.w3.org/2000/svg';}replaceChildren(...children){this.children=children;}append(...children){this.children.push(...children);}setAttribute(key,value){this[key]=value;}}
 const element=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 element('#follow-location').checked=true;
 const context=vm.createContext({photoKinds,nearbyTrees,arrivalEligible,chooseNearbyTarget,createFieldSpeaker:()=>({speak(){},stop(){}}),createWikiReference:()=>()=>{},createSpeciesReference:()=>plant=>references.push(plant.id),isAuthorizedAdmin:()=>true,window:{addEventListener(){}},navigator:{geolocation:{watchPosition(callback){onPosition=callback;return 1;},clearWatch(){}}},Event:class{constructor(type){this.type=type;}},document:{querySelector:element,createElement:()=>new Element(),createElementNS:()=>new Element(),addEventListener(){},dispatchEvent:e=>events.push(e.type)}});
 const source=readFileSync(new URL('../dist/field.js',import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'').replace(/^publicGallery\(\);start\(\).*$/m,'');
 vm.runInContext(source,context);
 vm.runInContext(`trees=[{id:'west',name:'西側樹',label:'T001',species:'芒果',latitude:23.5588,longitude:120.5547},{id:'east',name:'東側樹',label:'T002',species:'榕樹',latitude:23.5588,longitude:120.5552}];selected=trees[1];locate();`,context);
 return {element,references,events,run:code=>vm.runInContext(code,context),fix:(longitude,accuracy=6)=>onPosition({coords:{latitude:23.5588,longitude,accuracy},timestamp:Date.now()})};
}
test('GPS watch changes the displayed plant, photograph and AI context as the phone moves',()=>{
 const p=page();p.element('#confirmed').checked=true;p.fix(120.5547);
 assert.equal(p.run('selected.id'),'west');assert.equal(p.references.at(-1),'west');assert.equal(p.element('#confirmed').checked,false);assert.equal(p.element('#camera').disabled,true);
 p.fix(120.5552);assert.equal(p.run('selected.id'),'east');assert.equal(p.references.at(-1),'east');assert.equal(p.events.filter(e=>e==='teacher-context-change').length,2);assert.match(p.element('#follow-status').textContent,/自動跟隨中/);
});
test('manual selection stays fixed during GPS updates and GPS restart',()=>{
 const p=page();p.fix(120.5547);p.run("manualTarget('west')");p.fix(120.5552);
 assert.equal(p.element('#follow-location').checked,false);assert.equal(p.run('selected.id'),'west');p.run('locate()');p.fix(120.5552);assert.equal(p.run('selected.id'),'west');
});
test('poor GPS fixes preserve the target until accuracy recovers',()=>{
 const p=page();p.fix(120.5547,80);assert.equal(p.run('selected.id'),'east');assert.match(p.element('#follow-status').textContent,/精度改善/);
 p.fix(120.5547,8);assert.equal(p.run('selected.id'),'west');
});
