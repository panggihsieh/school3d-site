import {addCampusBrand} from './campus-map.js?v=campus-slope-20261111';
// 百分比依既有俯視示意圖估計；出入口與植物群需現場確認。
import {stations,resolveStationId,stationChangeNotice} from './space-domain.js?v=campus-slope-20261111';
const $=s=>document.querySelector(s);
const requested=new URLSearchParams(location.search).get('station');
let mode='phone',selected=resolveStationId(requested)||'P01',completed={},published=[];
const changeNotice=stationChangeNotice(requested);if(changeNotice){const p=document.createElement('p');p.className='notice';p.setAttribute('role','status');p.textContent=changeNotice;document.querySelector('.controls').after(p);}
try{completed=JSON.parse(localStorage.getItem('danan-capture-v1')||'{}')||{};}catch{}
const count=()=>mode==='phone'?4:1;
function select(id){selected=id;render();}
function render(){
 $('#pins').replaceChildren();$('#checklist').replaceChildren();
 $('#total').textContent=`${stations.length} 站 × ${count()} 張＝${stations.length*count()} 張`;
 const done=stations.filter(s=>completed[`${mode}:${s.id}`]).length;
 $('#progress').textContent=`已拍妥 ${done}／${stations.length} 站；尚需 ${stations.length-done} 站（${(stations.length-done)*count()} 張）。`;
 for(const s of stations){
  const checked=!!completed[`${mode}:${s.id}`];
  const pin=document.createElement('button');pin.className=`pin${checked?' done':''}`;pin.style.left=`${s.x}%`;pin.style.top=`${s.y}%`;pin.textContent=`${s.id} ×${count()}`;pin.title=`${s.name}：${s.note}`;pin.setAttribute('aria-label',`${s.id} ${s.name}，建議 ${count()} 張`);pin.setAttribute('aria-pressed',String(selected===s.id));pin.onclick=()=>select(s.id);$('#pins').append(pin);
  const row=document.createElement('div');row.className='check-row';
  const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=checked;checkbox.setAttribute('aria-label',`${s.id} ${s.name} 已拍妥`);
  checkbox.onchange=()=>{completed[`${mode}:${s.id}`]=checkbox.checked;try{localStorage.setItem('danan-capture-v1',JSON.stringify(completed));}catch{alert('無法保存勾選紀錄，請自行記下已拍站點。');}render();};
  const kinds=mode==='sphere'?['panorama']:['north','east','south','west'];const publishedCount=new Set(published.filter(p=>p.target===s.id&&kinds.includes(p.kind)).map(p=>p.kind)).size;
  const button=document.createElement('button');button.textContent=`${s.id} ${s.name} ×${count()}（已發布 ${publishedCount}/${count()}）`;button.onclick=()=>select(s.id);row.append(checkbox,button);$('#checklist').append(row);
 }
 const s=stations.find(s=>s.id===selected);
 const heading=document.createElement('h2');heading.textContent=`${s.id}｜${s.name} ×${count()} 張`;
 const note=document.createElement('p');note.textContent='位置為建議區域，待現勘核對。'+s.note;
 const instructions=document.createElement('p');instructions.textContent=mode==='phone'?'站在同一安全位置，手機橫放，以眼睛高度依序拍前方、右方、後方、左方各 1 張；以本站第一張的朝向為前方，補拍沿用原本的前方，共 4 張。不移動站位，鏡頭約眼睛高度、保持水平；各張涵蓋前方環境，可保留部分重疊。不用拍天空或腳下。儲存前核對站號與方向；勿站車道或跨越圍牆，勿為取景進入危險區域。上傳後可左右切換實景，不會自動拼成完整球面。':'使用 360 相機拍 1 張完整球面環景，輸出 2:1 原圖（建議 6000×3000 以上），相機高約 1.5–1.7 公尺。';
 const file=document.createElement('p');file.textContent=`建議檔名：${s.id}_${s.name}_${mode==='phone'?'01 至 04':'360'}.jpg。保留原圖並記錄拍攝日期、實際位置與朝向。`;
 const upload=document.createElement('a');upload.className='capture-link';upload.href=`./field.html?mode=space&station=${s.id}`;upload.textContent=`前往後台：${s.id} 拍照／上傳 →`;
 $('#selected').replaceChildren(heading,note,instructions,file,upload);
}
addCampusBrand($('#capture-map'));
$('#route').innerHTML=`<polyline points="${stations.map(s=>`${s.x},${s.y}`).join(' ')}"/>`;
$('#mode').onchange=e=>{mode=e.target.value;render();};$('#print').onclick=()=>window.print();render();
fetch('./public-photos.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(items=>{published=items;render();}).catch(()=>{});
