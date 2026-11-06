export function createPlantAudio({audio,status,stopSpeech}){
 let version=0,manualActive=false;
 function stop(){version++;manualActive=false;audio.pause();audio.onended=null;audio.onerror=null;}
 function play(id,{manual=true}={}){
  if(!/^(MOE\d+|test|stt-success|no-target)$/.test(id)||(!manual&&manualActive))return false;
  stop();stopSpeech();manualActive=manual;const request=version;
  audio.src=`./assets/plant-audio/${id}.wav`;audio.volume=1;audio.load();
  status('正在播放標準音訊…');
  audio.onended=()=>{if(version===request){manualActive=false;status('標準音訊播放結束。');}};
  audio.onerror=()=>{if(version===request){manualActive=false;status('音檔載入失敗，請檢查網路後重試。');}};
  try{audio.play().catch(()=>{if(version===request){manualActive=false;status('瀏覽器未允許自動播放，請點下方音訊播放器的播放鍵。');}});}catch{manualActive=false;status('請點下方音訊播放器的播放鍵。');}
  return true;
 }
 return {play,stop};
}
