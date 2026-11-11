import {nearbyTrees} from './field-domain.js?v=entry-restore-20261106';
export const directions=[['north','前方'],['east','右方'],['south','後方'],['west','左方']];
export const stations=[
 ['前門外側',21.5,89,'站在前門外可安全停留的人行空間，以面向校門為第一張照片的前方，拍攝四周環境。'],['前門內側',22,85,'進入前門後，站在不妨礙通行的位置，以朝校內主要通道為第一張照片的前方，拍攝四周環境。'],['入口芒果樹',24,82,'拍攝入口芒果樹及周邊入口動線，站在可安全通行的位置。'],['中間庭院',40,72,'拍兩側校舍與連接步道。'],['川堂入口',42,70,'站在川堂入口不妨礙通行的位置，拍攝入口與周邊動線；圖上標點是否需移位待確認。'],['司令台附近',39,58,'站在司令台附近可安全停留、不妨礙通行的位置，拍攝司令台與操場周邊環境。'],['操場中央',40,44,'拍草地四周全貌。'],['操場與綜合球場連接處',40,32,'站在操場與綜合球場之間可安全通行的位置，拍攝兩處的連接動線與周邊環境。'],['綜合球場',33.5,24.5,'站在綜合球場內可安全停留的位置，拍攝球場設施與四周環境，避開進行中的活動。'],['遊戲區（綜合球場旁）',45,28,'在綜合球場旁的遊具區外側拍攝遊具與周邊動線，與庭院遊戲區不同。'],['視聽大樓／幼兒園入口',58,37,'右側校舍上段：2F 視聽大樓、1F 幼兒園；入口仍需現場核對。'],['視聽大樓／幼兒園走廊',58,32,'校舍上段，僅在開放區域拍攝。'],['鼓隊練習室外側',67,62,'站在鼓隊練習室外可通行的位置，拍攝練習室外觀與周邊動線。'],['圖書館樓梯口',58,49,'此處為通往二樓圖書館的樓梯口，拍攝入口與連接動線，僅在開放區域拍攝。'],['幼兒園入口',63,37,'右側校舍上段 1F，只拍可公開的入口外側。'],['後門內側',69,81,'站在後門內不妨礙通行的位置，拍攝後門與校內連接動線。'],['後門外側',73,90,'勿進入車道。'],['特色植物區',24,62,'樹帶為候選位置，請現場確認。']
].map(([name,x,y,note],i)=>({id:`P${String(i+1).padStart(2,'0')}`,name,x,y,note,confirmed:false})).filter(s=>!['P15','P17','P18'].includes(s.id));
// Preserve historical IDs; redirects change selection only, never relabel old photos or GPS.
export function resolveStationId(id){const target=({P15:'P11',P17:'P16'})[id]||id;return stations.some(s=>s.id===target)?target:null;}
export function stationChangeNotice(id){return id==='P15'?'P15 已合併至 P11，請在視聽大樓／幼兒園入口拍攝。':id==='P17'?'P17 已合併至 P16，只需拍攝後門內側，外側不用拍。':id==='P18'?'P18 已移除，不再安排拍攝。請選擇其他站點。':'';}
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
