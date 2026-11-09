import {nearbyTrees} from './field-domain.js?v=entry-restore-20261106';
export const directions=[['north','前方'],['east','右方'],['south','後方'],['west','左方']];
export const stations=[
 ['前門外側',12.8,98,'站在人行空間，勿站車道。'],['前門內側',17,90,'拍入口動線與校門。'],['圖下方校舍入口',29,88,'位於前門附近的圖下方校舍；入口與正式名稱待逐站核對。'],['中間庭院',43,73,'拍兩側校舍與連接步道。'],['東邊校舍／辦公室入口',42,68,'依校方標註，拍入口與庭院連接處；站位仍待逐站核對。'],['操場圖下側',45,58,'在跑道外安全通行處拍攝。'],['操場中央',43.4,43.7,'拍草地四周全貌。'],['操場圖上側',45,27,'拍往球場連接處。'],['綜合球場',45,14,'避開進行中的活動。'],['遊戲區',63,25,'在球場旁的遊具區外側拍攝，與庭院遊戲區不同。'],['視聽大樓／幼兒園入口',73,28,'右側校舍上段：2F 視聽大樓、1F 幼兒園；入口仍需現場核對。'],['視聽大樓／幼兒園走廊',73,36,'校舍上段，僅在開放區域拍攝。'],['鼓隊練習室外側',76,61,'位於右側校舍下段；站位仍待逐站核對。'],['圖書館樓梯口候選',77,47,'2F 為圖書館；樓梯實際位置與開放範圍仍需確認。'],['幼兒園入口',73,23,'右側校舍上段 1F，只拍可公開的入口外側。'],['後門內側',90,87,'拍校內連接動線。'],['後門外側',95,98,'勿進入車道。'],['特色植物區',22,66,'樹帶為候選位置，請現場確認。']
].map(([name,x,y,note],i)=>({id:`P${String(i+1).padStart(2,'0')}`,name,x,y,note,confirmed:false}));
export function validStationLocation(p){return !!p&&Number.isFinite(p.latitude)&&p.latitude>=-90&&p.latitude<=90&&Number.isFinite(p.longitude)&&p.longitude>=-180&&p.longitude<=180&&Number.isFinite(p.accuracy)&&p.accuracy>=0&&p.accuracy<=25;}
export function latestViews(records,target){
 const views={};for(const record of records.filter(r=>r.target===target&&directions.some(([kind])=>kind===r.kind)).sort((a,b)=>String(a.publishedAt||'').localeCompare(String(b.publishedAt||''))))views[record.kind]=record;
 return views;
}
export function locatedStations(records){return stations.flatMap(s=>{const record=records.filter(r=>r.target===s.id&&validStationLocation(r.location)).sort((a,b)=>String(b.publishedAt||b.createdAt||'').localeCompare(String(a.publishedAt||a.createdAt||'')))[0];return record?[{...s,...record.location}]:[];});}
export function nextDirection(kind,step=1){const i=directions.findIndex(([value])=>value===kind);return directions[((i<0?0:i)+step+4)%4][0];}

export function stationDescription(station){return `目前選取站點，${station.id}，${station.name}。${station.note}位置是示意建議，請現場核對。站在同一安全位置，手機橫放，鏡頭約眼睛高度，以本站第一張照片的朝向為前方，固定此基準，依前方、右方、後方、左方各拍一張；重新補拍同一站時沿用原本的前方。儲存前核對站號與方向，勿站車道或進入危險區域。`;}

export function stationReadingContext(records,position,now=Date.now()){
 if(!validStationLocation(position))return {message:'定位精度不足，請移到空曠處重新定位後再朗讀。'};
 if(!Number.isFinite(position.time)||now-position.time>20000||position.time>now+5000)return {message:'定位資料已過期，請重新定位後再朗讀。'};
 const nearest=nearbyTrees(locatedStations(records),position)[0];
 if(!nearest)return {message:'尚無可比對的站點 GPS，無法確認目前站點。請先依地圖選站、現場確認並拍攝上傳，以建立站點座標。'};
 if(nearest.distance>30)return {message:`距離最近的已定位站點約 ${Math.round(nearest.distance)} 公尺，尚未接近（需在 30 公尺內），暫不朗讀。`};
 return {station:nearest,message:`定位完成，最近站點 ${nearest.id} ${nearest.name}，約 ${Math.round(nearest.distance)} 公尺；請核對現場位置。`};
}
