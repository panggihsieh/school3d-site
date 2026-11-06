export const directions=[['north','北（圖中上方 ↑）'],['east','東（圖中右方 →）'],['south','南（圖中下方 ↓）'],['west','西（圖中左方 ←）']];
// Image percentages are suggested regions only; IDs and actual station GPS remain stable.
export const stations=[
 ['前門外側',61,4.5,'入口對應區域待現勘；在安全人行空間拍攝，勿站車道。'],
 ['前門內側',61,10,'校門位置及可通行動線待現場確認。'],
 ['臨路校舍入口',47,27,'請確認實際校舍入口，不依屋頂推定門的位置。'],
 ['中間庭院',52,30,'拍兩側校舍與連接步道，保持同一站位。'],
 ['操場旁校舍入口',49,48,'請確認走廊與入口，勿阻礙通行。'],
 ['操場靠校舍側',52,54,'在跑道外安全處拍攝，避開運動中的師生。'],
 ['操場中央',58,61,'拍草地四周全貌；活動期間請改在安全處並記錄實際站位。'],
 ['操場靠球場側',64,72,'在跑道外拍向球場的連接區域。'],
 ['綜合球場',71,79,'避開進行中的活動，確認安全後再拍攝。'],
 ['遊戲區',63,83,'用途與實際遊具位置尚未確認；此為候選區域，現場確認後才拍攝。'],
 ['教學大樓入口',34,72,'建物用途及實際入口待現勘確認，勿只依示意圖判定。'],
 ['教學大樓走廊靠操場端',30,66,'走廊所在建物待確認，只在開放且可通行區域拍攝。'],
 ['教學大樓走廊另一端',39,83,'走廊與建物用途待確認，保持在可公開通行區域。'],
 ['教學大樓樓梯口',35,77,'候選區域，樓梯位置與樓層須現場確認，勿阻擋動線。'],
 ['幼兒園入口',40,85,'幼兒園用途與入口尚待確認，只拍可公開的入口外側。'],
 ['後門內側',44,93,'實際後門與校內連接動線待確認。'],
 ['後門外側',44,98,'實際出口待確認；在安全人行空間拍攝，不進車道。'],
 ['特色植物區',22,56,'樹帶為候選區域，請現場核對特色植物與安全站位。']
].map(([name,x,y,note],i)=>({id:`P${String(i+1).padStart(2,'0')}`,name,x,y,note,confirmed:false}));

export function validStationLocation(p){return !!p&&Number.isFinite(p.latitude)&&p.latitude>=-90&&p.latitude<=90&&Number.isFinite(p.longitude)&&p.longitude>=-180&&p.longitude<=180&&Number.isFinite(p.accuracy)&&p.accuracy>=0&&p.accuracy<=25;}
export function latestViews(records,target){
 const views={};for(const record of records.filter(r=>r.target===target&&directions.some(([kind])=>kind===r.kind)).sort((a,b)=>String(a.publishedAt||'').localeCompare(String(b.publishedAt||''))))views[record.kind]=record;
 return views;
}
export function locatedStations(records){return stations.flatMap(s=>{const record=records.filter(r=>r.target===s.id&&validStationLocation(r.location)).sort((a,b)=>String(b.publishedAt||b.createdAt||'').localeCompare(String(a.publishedAt||a.createdAt||'')))[0];return record?[{...s,...record.location}]:[];});}
export function nextDirection(kind,step=1){const i=directions.findIndex(([value])=>value===kind);return directions[((i<0?0:i)+step+4)%4][0];}
