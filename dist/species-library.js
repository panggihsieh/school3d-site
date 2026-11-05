let manifest;
export function loadSpeciesLibrary(){return manifest??=fetch('./species-photos.json').then(r=>{if(!r.ok)throw Error('參考照片清單載入失敗');return r.json();}).catch(e=>{manifest=null;throw e;});}
export function referenceForPlant(data,plant){return data?.species?.[plant.sourceSpeciesCode]||null;}
export function referenceFigure(photo,name){
 const figure=document.createElement('figure');
 if(!/^\.\/assets\/species-reference\/[a-zA-Z0-9-]+\.(jpg|png|webp)$/.test(photo.url))return figure;
 const image=document.createElement('img');image.src=photo.url;image.alt=`${name}同樹種參考：${photo.title}`;image.loading='lazy';
 const caption=document.createElement('figcaption'),source=document.createElement('a');
 source.textContent=photo.title;try{const url=new URL(photo.source);if(url.protocol==='https:'&&['commons.wikimedia.org','journals.plos.org'].includes(url.hostname))source.href=url.href;}catch{}
 source.target='_blank';source.rel='noopener noreferrer';
 const credit=document.createElement('p');credit.textContent=`作者：${photo.artist} · ${photo.license}。圖片使用來源提供的縮圖或組圖，未另修改；完整來源、授權及原圖見連結。`;
 caption.append(source,credit);figure.append(image,caption);return figure;
}
export function createSpeciesReference(target){
 const panel=document.createElement('section');panel.className='wiki-reference species-library';target.after(panel);let last='',version=0;
 return async plant=>{
  const key=plant.sourceSpeciesCode||plant.species;if(last===key)return;last=key;const request=++version;panel.replaceChildren();
  const h=document.createElement('h3');h.textContent='已收錄的樹種實拍參考';const note=document.createElement('p');note.textContent='網路同樹種參考圖，不是校內這株的現場照片。請核對葉片、樹皮與編號；品種、亞種或修剪形態可能不同。';panel.append(h,note);
  try{
   const data=await loadSpeciesLibrary();if(request!==version||!panel.isConnected)return;
   const record=referenceForPlant(data,plant),photos=record?.photos||[];
   if(!photos.length){const status=document.createElement('p');status.textContent='此樹種的可靠授權照片尚待補充，可使用下方維基搜尋。';panel.append(status);return;}
   const gallery=document.createElement('div');gallery.className='wiki-reference-gallery';for(const photo of photos)gallery.append(referenceFigure(photo,plant.species||plant.name));panel.append(gallery);
   if(record.matchNote){const note=document.createElement('p');note.textContent=record.matchNote;panel.append(note);}
  }catch{if(request===version)panel.append(document.createTextNode('目前無法載入已收錄照片，仍可使用維基搜尋或拍攝現場照片。'));}
 };
}
export function showSpeciesReference(plant,parent){const anchor=document.createElement('div');parent.append(anchor);const update=createSpeciesReference(anchor);update(plant);}
