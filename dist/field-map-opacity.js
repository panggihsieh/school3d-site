const map=document.querySelector('#field-map');
if(map){
 const storageKey='danan-field-map-transparency';
 let transparency=60;
 try{const saved=localStorage.getItem(storageKey);if(saved!==null&&Number.isFinite(Number(saved)))transparency=Math.max(0,Math.min(100,Number(saved)));}catch{}
 const controls=[];
 function update(){
  map.querySelectorAll('image').forEach(image=>image.setAttribute('opacity',String(1-transparency/100)));
  for(const {range,output} of controls){range.value=String(transparency);output.value=`${transparency}%`;}
 }
 function createControl(){
  const label=document.createElement('label');label.className='map-transparency-control';
  label.style.cssText='display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:14px 0';
  const text=document.createElement('span');text.textContent='俯視圖透明度';
  const range=document.createElement('input');range.type='range';range.min='0';range.max='100';range.step='1';range.value=String(transparency);range.setAttribute('aria-label','俯視圖透明度');range.style.cssText='width:220px;max-width:100%;accent-color:#245b3e';
  const output=document.createElement('output');output.value=`${transparency}%`;output.style.minWidth='4ch';
  range.addEventListener('input',()=>{transparency=Number(range.value);update();try{localStorage.setItem(storageKey,String(transparency));}catch{}});
  label.append(text,range,output);controls.push({range,output});return label;
 }
 const container=map.closest('button')||map;
 container.before(createControl());
 const detail=document.querySelector('#field-map-detail');if(detail)detail.before(createControl());
 new MutationObserver(update).observe(map,{childList:true});
 update();
}
