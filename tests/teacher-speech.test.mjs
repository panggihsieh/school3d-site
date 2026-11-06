import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('AI target resets do not cancel another component speech; manual reading stops AI recognition',()=>{
 const nodes=new Map(),handlers={};let cancels=0,aborted=false,plant={id:'a',name:'A'};
 const node=key=>{if(!nodes.has(key))nodes.set(key,{value:'',textContent:'',prepend(){},replaceChildren(){}});return nodes.get(key);};
 const section={querySelector:node};
 const window={speechSynthesis:{cancel(){cancels++;}},SpeechRecognition:class{start(){}abort(){aborted=true;}},addEventListener(){}};
 const context=vm.createContext({window,document:{createElement:()=>section,querySelector:node,addEventListener:(name,fn)=>handlers[name]=fn},getPlant:()=>plant});
 const source=readFileSync(new URL('../dist/teacher-ai.js',import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'').replace('export function','function');
 vm.runInContext(source+'\nmountTeacherAI({getUser:()=>null,getPlant,isAdmin:()=>true,compress:()=>{}});',context);
 assert.equal(cancels,0);plant={id:'b',name:'B'};handlers['teacher-context-change']();assert.equal(cancels,0);
 node('.ai-mic').onclick();assert.equal(cancels,1);handlers['teacher-read-target']();assert.equal(aborted,true);assert.equal(cancels,1);
});
