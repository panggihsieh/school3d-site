export const photoKinds=[['whole','全株','退到能拍到完整樹冠的位置，保留周圍地物。校園俯視圖北在上方 ↑、東在右方 →、南在下方 ↓、西在左方 ←；現場方位請用手機指南針確認。'],['bark','樹皮','拍攝樹幹與樹皮紋理。'],['leaf-front','葉片正面','靠近拍清楚葉形，不需摘葉。'],['leaf-back','葉片背面','輕扶葉片拍背面，不需摘葉。'],['label','編號牌','若有編號牌，請拍清楚；沒有可略過。'],['flower-fruit','花或果實','當季有才拍，沒有可略過。']];
export function distanceMeters(a,b){const rad=Math.PI/180;const dlat=(b.latitude-a.latitude)*rad,dlon=(b.longitude-a.longitude)*rad;const v=Math.sin(dlat/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(dlon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v));}
export function nearbyTrees(trees,position){return trees.map(t=>({...t,distance:distanceMeters(position,t)})).sort((a,b)=>a.distance-b.distance);}
export function arrivalEligible(distance,accuracy){return Number.isFinite(distance)&&Number.isFinite(accuracy)&&accuracy<=25&&distance<=12;}
export function chooseNearbyTarget(nearby,currentId,accuracy){
 const nearest=nearby[0],current=nearby.find(t=>t.id===currentId);
 if(!nearest)return {tree:null,reason:'empty'};
 if(!Number.isFinite(accuracy)||accuracy<0||accuracy>25)return {tree:current||null,reason:'accuracy'};
 if(!current)return {tree:nearest,reason:'initial'};
 if(nearest.id===current.id)return {tree:current,reason:'nearest'};
 // Nearby trees may be closer together than the phone's GPS uncertainty.
 const margin=Math.max(3,Math.min(accuracy,10));
 return current.distance-nearest.distance>margin?{tree:nearest,reason:'changed'}:{tree:current,reason:'stable'};
}

// Proximity to surveyed trees is a reading guard, not an official campus boundary.
export function targetReadingContext(trees,selected,position,active,now=Date.now()){
 if(!selected)return {clip:'no-target',message:'請先選擇目標樹木。'};
 if(!active||!position)return {clip:'location-unavailable',message:'尚未取得有效手機定位。請先開始定位；目前選取的樹木不代表您所在的位置。'};
 if(!Number.isFinite(position.time)||now-position.time>30000||position.time>now+5000)return {clip:'location-stale',message:'手機定位已過期。請重新取得定位，再朗讀目前目標。'};
 if(!Number.isFinite(position.latitude)||!Number.isFinite(position.longitude)||!Number.isFinite(position.accuracy)||position.accuracy<0||position.accuracy>25)return {clip:'location-inaccurate',message:'目前定位精度不足，無法確認您是否在目標附近。請在安全空曠處重新定位。'};
 const nearest=nearbyTrees(trees,position)[0];
 if(!nearest)return {clip:'location-unavailable',message:'目前沒有可比對的校園樹木座標。'};
 if(nearest.distance>200)return {clip:'outside-campus',message:`您目前不在校園樹木附近，距離最近校樹約 ${Math.round(nearest.distance)} 公尺。選取的樹木不是您的所在位置。`};
 const distance=distanceMeters(position,selected);
 if(distance>100)return {clip:'target-distant',message:`目前選取的樹木距離約 ${Math.round(distance)} 公尺，尚未接近目標。請確認目標編號，勿將橘色樹木點當作手機位置。`};
 return {clip:selected.id,message:`目前目標，${String(selected.label||'').slice(0,16)}，${String(selected.species||selected.name||'植物').slice(0,24)}。`};
}
