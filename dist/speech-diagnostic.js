const synth=window.speechSynthesis,select=document.querySelector('#voice'),status=document.querySelector('#status'),log=document.querySelector('#log');
let voices=[],active=null,timer;
function record(message){const state=synth?`speaking=${synth.speaking}, pending=${synth.pending}, paused=${synth.paused}`:'API 不支援';log.textContent+=`${new Date().toLocaleTimeString()} ${message}｜${state}\n`;}
function refresh(){const previous=select.value;voices=synth?.getVoices()||[];select.replaceChildren(new Option('瀏覽器預設（不指定語言或聲音）',''));for(const v of voices.filter(v=>/^zh/i.test(v.lang)))select.add(new Option(`${v.name}（${v.lang}）`,v.voiceURI));if([...select.options].some(o=>o.value===previous))select.value=previous;record(`可列出的聲音 ${voices.length} 個`);}
document.querySelector('#play').onclick=()=>{
 if(!synth||!window.SpeechSynthesisUtterance){status.textContent='此瀏覽器不支援系統語音。';record('無法測試');return;}
 if(active||synth.speaking||synth.pending){status.textContent='請先按「停止並重設佇列」，再按播放。';return;}
 clearTimeout(timer);const u=new SpeechSynthesisUtterance('你好，這是系統語音測試。');active=u;
 const voice=voices.find(v=>v.voiceURI===select.value);if(voice){u.voice=voice;u.lang=voice.lang;}
 record(`要求播放：${voice?voice.name+' '+voice.lang:'瀏覽器預設'}，語言=${u.lang||'未指定'}`);status.textContent='已要求播放，等待 start 事件。';
 u.onstart=()=>{if(active!==u)return;clearTimeout(timer);status.textContent='收到 start；請確認是否真的聽到聲音。';record('收到 start');};
 u.onend=()=>{if(active!==u)return;clearTimeout(timer);active=null;status.textContent='收到 end；請回報是否聽到聲音。';record('收到 end');};
 u.onerror=e=>{if(active!==u)return;clearTimeout(timer);active=null;status.textContent=`收到錯誤：${e.error}`;record(`error=${e.error}`);};
 // Keep this call directly in the click handler, without cancel, timers or audio-session changes.
 try{synth.speak(u);if(active===u)timer=setTimeout(()=>{if(active===u){status.textContent='已等待 10 秒；請回報事件紀錄與是否有聲。';record('等待 10 秒');}},10000);}catch(e){active=null;status.textContent='呼叫失敗：'+e.message;record('例外：'+e.message);}
};
document.querySelector('#stop').onclick=()=>{clearTimeout(timer);active=null;synth?.cancel();status.textContent='已要求停止；可再次按播放。';record('使用者要求停止');};
document.querySelector('#refresh').onclick=refresh;synth?.addEventListener('voiceschanged',refresh);refresh();
window.addEventListener('pagehide',()=>{clearTimeout(timer);if(active){active=null;synth?.cancel();}});
