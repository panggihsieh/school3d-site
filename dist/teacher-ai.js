import {uploadServiceURL} from './field-config.js';
export function mountTeacherAI({getUser,getPlant,isAdmin,compress}){
 const section=document.createElement('section');section.id='teacher-ai';section.innerHTML='<h2>教師 AI 對話 · GPT-6.1 Sol</h2><p>文字／照片問答與逐段回覆，搭配瀏覽器語音輸入、朗讀。連續語音採輪流問答，非 Realtime 音訊串流。</p><p>送出時會將問題、近期對話、選取植物資料及附加照片送至 OpenAI；不傳送目前 GPS。照片不會自動公開。API 依用量計費。</p><p class="ai-target"></p><label>問題<textarea class="ai-question" rows="3" maxlength="2000" placeholder="介紹這株植物，或指導我拍攝葉片"></textarea></label><label>附加照片（選填）<input class="ai-image" type="file" accept="image/*"></label><p class="ai-image-status"></p><button class="ai-remove" type="button">移除照片</button><p><button class="ai-send" type="button">送出問題</button> <button class="ai-mic" type="button">語音提問</button> <button class="ai-live" type="button">開始連續語音</button> <button class="ai-stop" type="button">停止</button></p><label><input class="ai-read" type="checkbox" checked> 朗讀 AI 回答</label><p class="ai-status" role="status">需部署新版 Worker，並設定 OPENAI_API_KEY Secret；金鑰不要填在此頁。</p><div class="ai-log" style="white-space:pre-wrap;line-height:1.8;max-height:360px;overflow:auto"></div><button class="ai-clear" type="button">清除對話</button>';
 document.querySelector('#workspace').prepend(section);
 const $=s=>section.querySelector(s),question=$('.ai-question'),status=$('.ai-status'),log=$('.ai-log');
 let history=[],image='',controller=null,recognition=null,live=false,session=0,plantId='',processingImage=false,imageVersion=0,aiUtterance=null;
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 const stop=()=>{session++;live=false;recognition?.abort();recognition=null;controller?.abort();controller=null;if(aiUtterance){aiUtterance=null;window.speechSynthesis?.cancel();}$('.ai-live').textContent='開始連續語音';$('.ai-send').disabled=false;};
 function speak(text,version){
  if(!$('.ai-read').checked||!window.speechSynthesis){if(live)listen();return;}
  speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);aiUtterance=utterance;utterance.lang='zh-TW';
  utterance.onend=()=>{if(aiUtterance!==utterance)return;aiUtterance=null;if(live&&version===session)listen();};utterance.onerror=()=>{if(aiUtterance!==utterance)return;aiUtterance=null;live=false;$('.ai-live').textContent='開始連續語音';status.textContent='朗讀中斷，可再按語音提問。';};speechSynthesis.speak(utterance);
 }
 function listen(){
  if(!Recognition||!isAdmin()||recognition||controller||document.hidden)return;
  window.speechSynthesis?.cancel();const current=new Recognition();recognition=current;current.lang='zh-TW';current.continuous=false;current.interimResults=false;let received=false;
  current.onstart=()=>status.textContent='正在聆聽…';
  current.onresult=e=>{received=true;question.value=e.results[0][0].transcript;recognition=null;send();};
  current.onerror=e=>{live=false;$('.ai-live').textContent='開始連續語音';status.textContent=`語音未完成（${e.error}），可使用文字提問。`;};
  current.onend=()=>{if(recognition===current)recognition=null;if(!received&&live){live=false;$('.ai-live').textContent='開始連續語音';status.textContent='未收到語音，請再按開始。';}};
  try{current.start();}catch{recognition=null;live=false;status.textContent='無法啟動麥克風，請使用文字。';}
 }
 async function send(){
  if(!isAdmin()||controller||processingImage)return;
  const text=question.value.trim();if(!text){status.textContent='請輸入問題。';return;}
  recognition?.abort();recognition=null;const version=session,plant=getPlant(),requestController=new AbortController();controller=requestController;$('.ai-send').disabled=true;
  const userLine=document.createElement('p');userLine.textContent=`老師：${text}${image?'［附照片］':''}`;const answer=document.createElement('p');answer.textContent='AI：';log.append(userLine,answer);status.textContent='正在連接 Sol…';let output='',completed=false;
  try{
   const token=await getUser().getIdToken();if(version!==session||!isAdmin())throw new DOMException('Stopped','AbortError');const response=await fetch(`${uploadServiceURL.replace(/\/$/,'')}/ai/chat`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({question:text,plant,history,image}),signal:requestController.signal});
   if(!response.ok){let error;try{error=(await response.json()).error;}catch{}throw Error(error||`服務回應 ${response.status}；請確認已部署新版 Worker。`);}
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
   function process(event){
    const data=event.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(!data||data==='[DONE]')return;
    const item=JSON.parse(data);if(item.type==='response.output_text.delta'){output+=item.delta;answer.textContent=`AI：${output}`;log.scrollTop=log.scrollHeight;}
    if(item.type==='response.completed')completed=true;
    if(['error','response.failed','response.incomplete'].includes(item.type))throw Error('AI 未完成回答，請重試或縮短問題。');
   }
   while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true}).replace(/\r\n/g,'\n');let end;while((end=buffer.indexOf('\n\n'))!==-1){process(buffer.slice(0,end));buffer=buffer.slice(end+2);}}
   buffer+=decoder.decode();if(buffer.trim())process(buffer);
   if(!completed||!output)throw Error('回答串流中斷或沒有文字，請重試。');
   if(version!==session)return;history.push({role:'user',content:text},{role:'assistant',content:output.slice(0,5000)});history=history.slice(-12);question.value='';status.textContent='回答完成。AI 內容請由老師確認。';controller=null;speak(output,version);
  }catch(error){requestController.abort();if(version===session){live=false;$('.ai-live').textContent='開始連續語音';status.textContent=error.name==='AbortError'?'已停止。':error.message;}}
  finally{if(controller===requestController)controller=null;$('.ai-send').disabled=false;}
 }
 $('.ai-image').onchange=async e=>{const file=e.target.files[0],version=++imageVersion;image='';if(!file)return;processingImage=true;$('.ai-image-status').textContent='照片處理中…';try{const blob=await compress(file);const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});if(version===imageVersion){image=data;$('.ai-image-status').textContent='已附加壓縮照片，送出後交給 AI 分析。';}}catch(error){$('.ai-image-status').textContent=error.message;}finally{if(version===imageVersion)processingImage=false;}};
 $('.ai-remove').onclick=()=>{imageVersion++;processingImage=false;image='';$('.ai-image').value='';$('.ai-image-status').textContent='未附照片。';};
 $('.ai-send').onclick=send;$('.ai-mic').onclick=listen;$('.ai-live').onclick=()=>{if(live){stop();return;}live=true;$('.ai-live').textContent='結束連續語音';listen();};$('.ai-stop').onclick=()=>{stop();status.textContent='已停止。';};
 $('.ai-clear').onclick=()=>{stop();history=[];log.replaceChildren();status.textContent='對話已清除。';};
 if(!Recognition){$('.ai-mic').disabled=$('.ai-live').disabled=true;status.textContent='此瀏覽器不支援語音辨識，可用文字／照片提問。';}
 const update=()=>{const p=getPlant();if(!isAdmin()||p?.id!==plantId){stop();history=[];imageVersion++;processingImage=false;image='';$('.ai-image').value='';$('.ai-image-status').textContent='';log.replaceChildren();plantId=p?.id||'';}$('.ai-target').textContent=p?`目前植物：${p.name}`:'請先選取植物。';};
 document.addEventListener('teacher-read-target',stop);document.addEventListener('teacher-context-change',update);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);update();
}
