// 百分比依既有俯視示意圖估計；出入口與植物群需現場確認。
const stations=[
 ['前門外側',11,89,'站在安全人行空間，拍校門正面與入口周邊，勿站車道。'],
 ['前門內側',16,81,'朝校內拍入口動線，再回拍校門。'],
 ['南側校舍入口',29,81,'南排校舍靠入口處；實際入口以現場為準。'],
 ['中間庭院',39,66,'兩排校舍間庭院，拍兩側校舍與連接步道。'],
 ['操場南側校舍入口',53,63,'北排校舍面向庭院的入口候選位置，現場確認。'],
 ['操場南側',40,50,'跑道南側通行處，拍向操場與校舍。'],
 ['操場中央',41,39,'草地中央安全位置，拍四周全貌。'],
 ['操場北側',40,25,'跑道北側往球場的連接處。'],
 ['綜合球場',40,10,'球場旁安全位置，避開進行中的活動。'],
 ['遊戲區',57,22,'遊戲區外側通行處，避開遊具活動範圍。'],
 ['教學大樓入口',66,48,'大樓西側入口候選區，請找實際入口。'],
 ['教學大樓走廊北端',65,28,'走廊北端或轉角，標點示意，請在開放區域拍攝。'],
 ['教學大樓走廊南端',67,58,'走廊南端或轉角，拍與幼兒園方向的銜接。'],
 ['教學大樓樓梯口',73,42,'僅為大樓內候選區，樓梯位置與樓層需現場確認。'],
 ['幼兒園入口',76,69,'可公開的入口外側，位置與開放範圍現場確認。'],
 ['後門內側',81,78,'後門內通行處，拍校內連接動線。'],
 ['後門外側',86,88,'後門外安全站點，不進入車道。'],
 ['特色植物區',19,61,'西側樹帶作為暫定候選，請選實際特色植物群並記錄樹木編號。']
].map(([name,x,y,note],i)=>({id:`P${String(i+1).padStart(2,'0')}`,name,x,y,note}));
const $=s=>document.querySelector(s);
let mode='phone',selected='P01',completed={},published=[];
try{completed=JSON.parse(localStorage.getItem('danan-capture-v1')||'{}')||{};}catch{}
const count=()=>mode==='phone'?6:1;
function select(id){selected=id;render();}
function render(){
 $('#pins').replaceChildren();$('#checklist').replaceChildren();
 $('#total').textContent=`18 站 × ${count()} 張＝${18*count()} 張`;
 const done=stations.filter(s=>completed[`${mode}:${s.id}`]).length;
 $('#progress').textContent=`已拍妥 ${done}／18 站；尚需 ${18-done} 站（${(18-done)*count()} 張）。`;
 for(const s of stations){
  const checked=!!completed[`${mode}:${s.id}`];
  const pin=document.createElement('button');pin.className=`pin${checked?' done':''}`;pin.style.left=`${s.x}%`;pin.style.top=`${s.y}%`;pin.textContent=`${s.id} ×${count()}`;pin.title=`${s.name}：${s.note}`;pin.setAttribute('aria-label',`${s.id} ${s.name}，建議 ${count()} 張`);pin.setAttribute('aria-pressed',String(selected===s.id));pin.onclick=()=>select(s.id);$('#pins').append(pin);
  const row=document.createElement('div');row.className='check-row';
  const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=checked;checkbox.setAttribute('aria-label',`${s.id} ${s.name} 已拍妥`);
  checkbox.onchange=()=>{completed[`${mode}:${s.id}`]=checkbox.checked;try{localStorage.setItem('danan-capture-v1',JSON.stringify(completed));}catch{alert('無法保存勾選紀錄，請自行記下已拍站點。');}render();};
  const kinds=mode==='sphere'?['panorama']:['north','east','south','west','entrance','path'];const publishedCount=new Set(published.filter(p=>p.target===s.id&&kinds.includes(p.kind)).map(p=>p.kind)).size;
  const button=document.createElement('button');button.textContent=`${s.id} ${s.name} ×${count()}（已發布 ${publishedCount}/${count()}）`;button.onclick=()=>select(s.id);row.append(checkbox,button);$('#checklist').append(row);
 }
 const s=stations.find(s=>s.id===selected);
 const heading=document.createElement('h2');heading.textContent=`${s.id}｜${s.name} ×${count()} 張`;
 const note=document.createElement('p');note.textContent=s.note;
 const instructions=document.createElement('p');instructions.textContent=mode==='phone'?'站在同一安全位置，依序拍北、東、南、西方向各 1 張，再補入口或主體近照 1 張、路徑或編號牌細節 1 張，共 6 張。這批用於照片展示與建模參考，不保證可拼接環景。':'使用 360 相機拍 1 張完整球面環景，輸出 2:1 原圖（建議 6000×3000 以上），相機高約 1.5–1.7 公尺。';
 const file=document.createElement('p');file.textContent=`建議檔名：${s.id}_${s.name}_${mode==='phone'?'01 至 06':'360'}.jpg。保留原圖並記錄拍攝日期、實際位置與朝向。`;
 const upload=document.createElement('a');upload.className='capture-link';upload.href=`./field.html?station=${s.id}`;upload.textContent=`前往後台：${s.id} 拍照／上傳 →`;
 $('#selected').replaceChildren(heading,note,instructions,file,upload);
}
$('#route').innerHTML=`<polyline points="${stations.map(s=>`${s.x},${s.y}`).join(' ')}"/>`;
$('#mode').onchange=e=>{mode=e.target.value;render();};$('#print').onclick=()=>window.print();render();
fetch('./public-photos.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(items=>{published=items;render();}).catch(()=>{});
