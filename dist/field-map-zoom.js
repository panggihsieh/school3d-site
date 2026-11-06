const trigger=document.querySelector('#field-map-zoom');
const map=document.querySelector('#field-map');
const dialog=document.querySelector('#field-map-dialog');
const detail=document.querySelector('#field-map-detail');
trigger.addEventListener('click',()=>{detail.append(map);dialog.showModal();});
document.querySelector('#field-map-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{trigger.prepend(map);trigger.focus();});
