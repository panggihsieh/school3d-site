export function createFieldSpeaker({synth,Utterance,enabled,status,audioSession}){
 let current=null,timer=null,manualReading=false;
 // Load the device voice list before the user's first synchronous speech request.
 synth?.getVoices?.();
 function stop(){clearTimeout(timer);current=null;manualReading=false;synth?.cancel();}
 function speak(text,{manual=false}={}){
  if(!manual&&(!enabled()||manualReading))return false;
  if(!synth||!Utterance){status('此瀏覽器不支援朗讀，請改用 Safari 或 Chrome；目前目標仍顯示在畫面上。');return false;}
  stop();
  try{
   // iOS may route the default session through the silent-switch audio category.
   try{if(audioSession)audioSession.type='playback';}catch{}
   const utterance=new Utterance(text);current=utterance;manualReading=manual;let started=false;utterance.volume=1;utterance.pitch=1;utterance.lang='zh-TW';utterance.rate=.9;
   const voices=synth.getVoices?.()||[];const voice=voices.find(v=>/^zh[-_]TW$/i.test(v.lang)&&v.localService)||voices.find(v=>/^zh[-_]TW$/i.test(v.lang))||voices.find(v=>/^zh/i.test(v.lang));if(voice)utterance.voice=voice;
   status('準備朗讀…');
   utterance.onstart=()=>{if(current!==utterance)return;started=true;clearTimeout(timer);status('瀏覽器已啟動朗讀。若仍無聲，請關閉 iPhone 靜音、調高媒體音量，並檢查藍牙輸出；也可在 Safari 開啟本站重試。');};
   utterance.onend=()=>{if(current!==utterance)return;clearTimeout(timer);current=null;manualReading=false;status('朗讀完成。');};
   utterance.onerror=e=>{if(current!==utterance)return;clearTimeout(timer);current=null;manualReading=false;status(`朗讀未完成（${e.error||'音訊錯誤'}），請先停止語音提問或 STT，再按「語音輸出測試」。`);};
   synth.speak(utterance);if(synth.paused)synth.resume?.();
   if(current===utterance&&!started)timer=setTimeout(()=>{if(current===utterance){stop();status('瀏覽器尚未開始播放，請點「朗讀目前目標」重試，並確認裝置媒體音量與網站音訊設定。');}},8000);
   return true;
  }catch{stop();status('無法啟動朗讀，請再次點選按鈕，或改用 Safari／Chrome。');return false;}
 }
 return {speak,stop};
}
