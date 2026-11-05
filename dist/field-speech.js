export function createFieldSpeaker({synth,Utterance,enabled,status}){
 let current=null,timer=null;
 function stop(){clearTimeout(timer);current=null;synth?.cancel();}
 function speak(text,{manual=false}={}){
  if(!manual&&!enabled())return false;
  if(!synth||!Utterance){status('此瀏覽器不支援朗讀，請改用 Safari 或 Chrome；目前目標仍顯示在畫面上。');return false;}
  stop();
  try{
   const utterance=new Utterance(text);current=utterance;utterance.lang='zh-TW';utterance.rate=.9;
   const voices=synth.getVoices?.()||[];const voice=voices.find(v=>/^zh[-_]TW$/i.test(v.lang))||voices.find(v=>/^zh/i.test(v.lang));if(voice)utterance.voice=voice;
   status('準備朗讀…');
   utterance.onstart=()=>{if(current!==utterance)return;clearTimeout(timer);status('正在朗讀目前提示…若聽不到，請檢查媒體音量、藍牙耳機與網站音訊設定。');};
   utterance.onend=()=>{if(current!==utterance)return;clearTimeout(timer);current=null;status('朗讀完成。');};
   utterance.onerror=e=>{if(current!==utterance)return;clearTimeout(timer);current=null;status(`朗讀未完成（${e.error||'音訊錯誤'}），請檢查音量及音訊輸出，再按「朗讀目前目標」。`);};
   synth.resume?.();synth.speak(utterance);
   if(current===utterance)timer=setTimeout(()=>{if(current===utterance){stop();status('瀏覽器尚未開始播放，請點「朗讀目前目標」重試，並確認裝置媒體音量與網站音訊設定。');}},8000);
   return true;
  }catch{stop();status('無法啟動朗讀，請再次點選按鈕，或改用 Safari／Chrome。');return false;}
 }
 return {speak,stop};
}
