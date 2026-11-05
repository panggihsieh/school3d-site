import {plantAnswer,circumferenceToDbh,carbonQuestions} from './learning.js';
import {calculateCarbon} from './tree/carbon.js';

let stopCurrent=()=>{};
export function closePlantExperience(){stopCurrent();stopCurrent=()=>{};}
function element(tag,text,className){const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;}
function button(text,handler){const el=element('button',text);el.type='button';el.onclick=handler;return el;}
function inputField(form,name,label,type='text',attrs={}){
 const wrap=element('label',label,'field'),input=document.createElement('input');input.name=name;input.type=type;Object.assign(input,attrs);wrap.append(input);form.append(wrap);return input;
}
export function showPlantExperience(p,parent){
 closePlantExperience();
 const card=element('section',null,'plant-experience');parent.querySelector('.tree-visual-card')?.after(card);
 if(!card.isConnected)parent.append(card);
 card.append(element('h4','和這棵樹對話'));
 card.append(element('p','依本株資料回答，不是開放式 AI。語音辨識可能由瀏覽器供應商在線處理；只有按下語音提問才會啟動麥克風。','coverage'));
 let recognition=null,disposed=false;
 const synth=window.speechSynthesis;
 const output=element('p','選一個問題，或輸入你想知道的事。','plant-reply');output.setAttribute('role','status');
 const speak=text=>{if(!synth)return;synth.cancel();const voice=new SpeechSynthesisUtterance(text);voice.lang='zh-TW';voice.rate=.92;synth.speak(voice);};
 const form=element('form',null,'plant-question');
 const question=inputField(form,'question','詢問這棵植物','text',{maxLength:160,placeholder:'例如：這棵樹有多高？'});
 const send=element('button','送出問題');send.type='submit';form.append(send);
 const answer=text=>{output.textContent=plantAnswer(p,text);};
 form.onsubmit=e=>{e.preventDefault();answer(question.value);};card.append(form);
 const prompts=element('div',null,'learning-actions');
 ['介紹這棵樹','葉子長什麼樣','每年吸碳多少','維護如何排碳'].forEach(text=>prompts.append(button(text,()=>{question.value=text;answer(text);})));card.append(prompts,output);
 const speechButtons=element('div',null,'learning-actions');
 speechButtons.append(button('朗讀回答',()=>speak(output.textContent)),button('停止朗讀',()=>synth?.cancel()));
 if(!synth){speechButtons.querySelectorAll('button').forEach(b=>b.disabled=true);card.append(element('p','此瀏覽器不支援朗讀，可直接閱讀回答。','coverage'));}
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 const mic=button('開始語音提問',()=>{
  if(recognition){recognition.abort();return;}
  synth?.cancel();const current=new Recognition();recognition=current;current.lang='zh-TW';current.continuous=false;current.interimResults=false;
  current.onstart=()=>{if(!disposed){mic.textContent='停止聆聽';output.textContent='正在聆聽，請說出植物問題…';}};
  current.onresult=e=>{if(disposed)return;question.value=e.results[0][0].transcript;answer(question.value);speak(output.textContent);};
  current.onerror=e=>{if(!disposed)output.textContent=e.error==='not-allowed'?'未取得麥克風權限，請使用文字提問。':e.error==='aborted'?'已停止聆聽。':'語音辨識未完成，請再試一次或使用文字提問。';};
  current.onend=()=>{if(recognition===current)recognition=null;if(!disposed)mic.textContent='開始語音提問';};
  try{current.start();}catch{recognition=null;output.textContent='無法啟動語音辨識，請使用文字提問。';}
 });
 mic.disabled=!Recognition;speechButtons.prepend(mic);card.append(speechButtons);
 if(!Recognition)card.append(element('p','此瀏覽器不支援語音辨識，文字提問與支援的朗讀功能仍可使用。','coverage'));
 stopCurrent=()=>{disposed=true;recognition?.abort();recognition=null;synth?.cancel();};

 const tasks=element('details',null,'learning-tasks');tasks.append(element('summary','植物碳任務與遊戲'));card.append(tasks);
 const completed=new Set(),records={treeId:p.id,treeName:p.name};
 const progress=element('p','本次任務 0 / 3：量測、維護碳排、知識遊戲。','learning-progress');tasks.append(progress);
 const complete=key=>{completed.add(key);progress.textContent=`本次任務 ${completed.size} / 3 ${completed.size===3?'・獲得校園碳探索家勳章！':'・完成後可下載紀錄。'}`;};
 tasks.append(element('p','任務紀錄保留在這張卡片，切換植物前請下載。實作結果不會覆寫平台紀錄。','coverage'));
 tasks.append(element('h5','任務 1｜觀察與量測'));
 const measure=element('form');
 const circumference=inputField(measure,'circumference','現場胸圍（cm，請量胸圍，不是胸徑）','number',{required:true,min:.1,max:2000,step:'any'});
 const observation=inputField(measure,'observation','現場觀察：葉片、樹皮或周圍環境','text',{required:true,maxLength:500});
 const measureResult=element('p',null,'task-result');measureResult.setAttribute('role','status');
 const measureSubmit=element('button','完成量測任務');measureSubmit.type='submit';measure.append(measureSubmit,measureResult);tasks.append(measure);
 measure.onsubmit=e=>{e.preventDefault();try{
  if(!observation.value.trim())throw Error('請填寫現場觀察。');
  const dbh=circumferenceToDbh(Number(circumference.value));records.measurement={circumferenceCm:Number(circumference.value),dbhCm:dbh,observation:observation.value.trim()};
  measureResult.textContent=`你的胸徑約 ${dbh.toFixed(2)} cm。${p.dbh?`平台登錄為 ${p.dbh} cm；不同時間與量法可能有差異。`: '這株尚無平台胸徑。'}完成！`;complete('measure');
 }catch(error){measureResult.textContent=error.message;}};

 tasks.append(element('h5','任務 2｜維護活動排碳'));
 tasks.append(element('p','輸入活動量與有來源的係數。不預填真實係數，也不拿累積儲碳抵銷排放。','coverage'));
 const carbon=element('form');
 const year=inputField(carbon,'year','活動年度','number',{required:true,min:1900,max:2200,value:new Intl.DateTimeFormat('en',{timeZone:'Asia/Taipei',year:'numeric'}).format(new Date())});
 const activity=inputField(carbon,'activity','維護活動名稱','text',{required:true,maxLength:100,placeholder:'例如：澆水用電'});
 const quantity=inputField(carbon,'quantity','活動量','number',{required:true,min:0,max:1e9,step:'any'});
 const unit=inputField(carbon,'unit','活動量單位','text',{required:true,maxLength:40,placeholder:'例如：kWh'});
 const factor=inputField(carbon,'factor','每單位排放係數（kg CO₂e／上方單位）','number',{required:true,min:0,max:1e9,step:'any'});
 const source=inputField(carbon,'source','係數來源、年份與適用範圍','text',{required:true,maxLength:500});
 const carbonResult=element('p',null,'task-result');carbonResult.setAttribute('role','status');
 const calculate=element('button','計算並完成任務');calculate.type='submit';carbon.append(calculate,carbonResult);tasks.append(carbon);
 carbon.onsubmit=e=>{e.preventDefault();try{
  const report=calculateCarbon({year:Number(year.value),uptake:null,uptakeSource:'',activities:[{name:activity.value,quantity:Number(quantity.value),unit:unit.value,factor:Number(factor.value),source:source.value}]});
  records.maintenance=report;carbonResult.textContent=`這筆維護活動排碳 ${report.emissions.toLocaleString('zh-TW',{maximumFractionDigits:4})} kg CO₂e。只代表所填活動範圍，未比較年度吸碳。`;complete('carbon');
 }catch(error){carbonResult.textContent=error.message;}};

 tasks.append(element('h5','任務 3｜碳知識闖關'));
 const game=element('div',null,'carbon-game');tasks.append(game);
 let rounds=[],round=0,score=0,answered=false;
 function drawQuestion(){
  game.replaceChildren();const q=rounds[round];answered=false;
  const scoreLabel=element('p',`第 ${round+1} / 3 題 · 已答對 ${score} 題`,'coverage');game.append(scoreLabel,element('p',q.question));
  const result=element('p',null,'task-result');result.setAttribute('role','status');
  const next=button(round===2?'查看成績':'下一題',()=>{round++;if(round<3)drawQuestion();else{
   records.quiz={score,total:3};game.replaceChildren(element('p',`本輪答對 ${score} / 3 題。${score===3?'過關！':'可再挑戰並複習解說。'}`));if(score===3)complete('quiz');game.append(button('再玩一次',startGame));
  }});next.hidden=true;
  q.options.forEach((text,i)=>game.append(button(text,()=>{
   if(answered)return;answered=true;if(i===q.correct)score++;
   scoreLabel.textContent=`第 ${round+1} / 3 題 · 已答對 ${score} 題`;
   game.querySelectorAll('button').forEach(b=>b.disabled=true);next.disabled=false;next.hidden=false;
   result.textContent=`${i===q.correct?'答對了！':'再想一想。'}${q.explanation}`;
  })));game.append(result,next);
 }
 function startGame(){rounds=[...carbonQuestions];for(let i=rounds.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rounds[i],rounds[j]]=[rounds[j],rounds[i]];}rounds=rounds.slice(0,3);round=score=0;drawQuestion();}
 startGame();
 tasks.append(button('下載本次任務紀錄',()=>{
  const data={...records,completed:[...completed],recordedAt:new Date().toISOString()},a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=`${p.id}-learning.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 }));
}
