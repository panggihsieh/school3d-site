export function mountSpeechTest({button,status,result,Recognition,isAdmin,stopSpeech,document}){
 let current=null,received=false,failed=false;
 const stop=()=>{const active=current;current=null;active?.abort();button.textContent='語音測試 STT';};
 if(!Recognition){button.disabled=true;status.textContent='此瀏覽器不支援語音辨識，請用支援的 Safari 或 Chrome。';return {stop};}
 button.onclick=()=>{
  if(current){stop();status.textContent='語音測試已停止。';return;}
  if(!isAdmin())return;
  stopSpeech();received=false;failed=false;result.textContent='';
  const recognition=new Recognition();current=recognition;recognition.lang='zh-TW';recognition.continuous=false;recognition.interimResults=true;
  button.textContent='停止語音測試';status.textContent='正在啟動麥克風，請允許語音辨識權限…';
  recognition.onstart=()=>{if(current===recognition)status.textContent='正在聆聽，請說一句話，例如「大南國小」。';};
  recognition.onresult=event=>{if(current!==recognition)return;received=true;result.textContent=Array.from(event.results).map(item=>item[0].transcript).join('');status.textContent='已收到語音並轉成文字。';};
  recognition.onerror=event=>{if(current!==recognition)return;failed=true;const errors={'not-allowed':'麥克風或語音辨識權限未開啟，請在瀏覽器設定允許後重試。','audio-capture':'無法取得麥克風，請檢查裝置或其他使用麥克風的程式。','no-speech':'未辨識到語音，請靠近麥克風再試一次。',network:'語音辨識連線失敗，請確認網路。'};status.textContent=errors[event.error]||`語音測試未完成（${event.error||'未知錯誤'}）。`;};
  recognition.onend=()=>{if(current!==recognition)return;current=null;button.textContent='語音測試 STT';if(!failed)status.textContent=received?'語音測試完成，辨識文字如下。':'未收到語音，請點「語音測試 STT」重試。';};
  try{recognition.start();}catch{stop();status.textContent='無法啟動語音測試，請重新點選，或使用 Safari／Chrome。';}
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&current){stop();status.textContent='頁面進入背景，語音測試已停止。';}});
 document.addEventListener('teacher-context-change',()=>{if(!isAdmin())stop();});
 return {stop};
}
