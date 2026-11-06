import {nearbyTrees} from './field-domain.js?v=entry-restore-20261106';
export const directions=[['north','前方'],['east','右方'],['south','後方'],['west','左方']];
export const stations=[
 ['前門外側',11,89,'站在人行空間，勿站車道。'],['前門內側',16,81,'拍入口動線與校門。'],['圖下方校舍入口',29,81,'以現場實際入口為準。'],['中間庭院',39,66,'拍兩側校舍與連接步道。'],['操場下方校舍入口',53,63,'拍入口與庭院連接處。'],['操場圖下側',40,50,'在跑道外安全通行處拍攝。'],['操場中央',41,39,'拍草地四周全貌。'],['操場圖上側',40,25,'拍往球場連接處。'],['綜合球場',40,10,'避開進行中的活動。'],['遊戲區',57,22,'在遊具區外側拍攝。'],['教學大樓入口',66,48,'請找實際入口。'],['教學大樓走廊圖上端',65,28,'在開放區域拍攝。'],['教學大樓走廊圖下端',67,58,'拍與幼兒園方向的銜接。'],['教學大樓樓梯口',73,42,'樓梯與樓層須現場確認。'],['幼兒園入口',76,69,'只拍可公開的入口外側。'],['後門內側',81,78,'拍校內連接動線。'],['後門外側',86,88,'勿進入車道。'],['特色植物區',19,61,'樹帶為候選位置，請現場確認。']
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
