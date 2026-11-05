export const photoKinds=[['whole','全株','退到能拍到完整樹冠的位置，保留周圍地物。'],['bark','樹皮','拍攝樹幹與樹皮紋理。'],['leaf-front','葉片正面','靠近拍清楚葉形，不需摘葉。'],['leaf-back','葉片背面','輕扶葉片拍背面，不需摘葉。'],['label','編號牌','若有編號牌，請拍清楚；沒有可略過。'],['flower-fruit','花或果實','當季有才拍，沒有可略過。']];
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
