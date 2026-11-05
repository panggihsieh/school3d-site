export function treeSearchName(plant){
 const scientific=String(plant.scientificName||'').trim().split(/\s+/);
 return scientific.length>=2?scientific.slice(0,2).join(' '):String(plant.species||plant.name||'').split(/[／/｜]/)[0].trim();
}
function trustedURL(value,host){try{const url=new URL(value);return url.protocol==='https:'&&url.hostname===host?url.href:'';}catch{return '';}}
export function wikiPhotos(data){
 return Object.values(data?.query?.pages||{}).sort((a,b)=>(a.index??0)-(b.index??0)).flatMap(page=>{
  const info=page.imageinfo?.[0],meta=info?.extmetadata||{};
  if(/botanical magazine|illustration|drawing|painting|engraving|herbarium|diagram/i.test(page.title||''))return [];
  const thumbnail=trustedURL(info?.thumburl,'upload.wikimedia.org'),source=trustedURL(info?.descriptionurl,'commons.wikimedia.org');
  if(!thumbnail||!source||!meta.LicenseShortName?.value||!['image/jpeg','image/png','image/webp'].includes(info?.mime))return [];
  return [{title:page.title.replace(/^File:/,''),thumbnail,source,artist:meta.Artist?.value||'作者請見來源頁',license:meta.LicenseShortName.value}];
 }).slice(0,3);
}
export function createWikiReference(target){
 const panel=document.createElement('div');panel.className='wiki-reference';target.after(panel);
 const cache=new Map();let key='',controller=null,generation=0;
 const text=html=>new DOMParser().parseFromString(html,'text/html').body.textContent.trim();
 const link=(label,url)=>{const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
 return function update(plant){
  const name=treeSearchName(plant);if(key===name)return;key=name;controller?.abort();const version=++generation;
  panel.replaceChildren();const heading=document.createElement('h3');heading.textContent='維基樹木實拍對照';
  const note=document.createElement('p');note.textContent=`搜尋：${name}。以下為網路同樹種參考，不是校內這一株；搜尋可能包含近似種或其他主題，請配合葉片、樹皮及編號核對。`;
  const search=new URL('https://commons.wikimedia.org/w/index.php');search.search=new URLSearchParams({title:'Special:MediaSearch',type:'image',search:name}).toString();
  const more=link('開啟 Wikimedia Commons 查看更多 ↗',search.href),button=document.createElement('button');button.type='button';button.textContent='載入參考照片';
  const status=document.createElement('p');status.setAttribute('role','status');const gallery=document.createElement('div');gallery.className='wiki-reference-gallery';
  panel.append(heading,note,more,button,status,gallery);
  async function load(){
   controller=new AbortController();const signal=controller.signal;button.disabled=true;status.textContent='正在載入維基共享資源照片…';gallery.replaceChildren();
   try{
    let photos=cache.get(name);
    if(!photos){
     const url=new URL('https://commons.wikimedia.org/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrnamespace:'6',gsrsearch:`filetype:bitmap "${name.replace(/"/g,'')}" -intitle:illustration -intitle:drawing -intitle:painting -intitle:"Botanical Magazine"`,gsrlimit:'5',prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'640',iiextmetadatafilter:'Artist|LicenseShortName'}).toString();
     const timeout=setTimeout(()=>controller?.abort(),15000);let response;
     try{response=await fetch(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'});}finally{clearTimeout(timeout);}
     if(!response.ok)throw Error('維基服務暫時無法連線');const data=await response.json();if(data.error)throw Error('維基搜尋暫不可用');photos=wikiPhotos(data);cache.set(name,photos);
    }
    if(version!==generation)return;
    if(!photos.length){status.textContent='目前沒有可顯示且含授權資料的照片，請點「查看更多」自行核對。';return;}
    for(const photo of photos){
     const figure=document.createElement('figure'),img=document.createElement('img');img.src=photo.thumbnail;img.alt=`${name} 參考照片：${photo.title}`;img.loading='lazy';img.referrerPolicy='no-referrer';
     img.onerror=()=>{img.hidden=true;const error=document.createElement('p');error.textContent='圖片暫時無法載入，請由來源頁查看。';figure.prepend(error);};
     const caption=document.createElement('figcaption');caption.append(link(text(photo.title),photo.source));
     const attribution=document.createElement('p');attribution.textContent=`作者：${text(photo.artist)} · 授權：${text(photo.license)}。縮圖顯示，完整授權與來源見連結。`;caption.append(attribution);figure.append(img,caption);gallery.append(figure);
    }
    status.textContent=`已載入 ${photos.length} 張樹種參考照片。請現場核對後，再勾選確認單株。`;
   }catch{if(version===generation)status.textContent='照片服務連線失敗或逾時，可重試或開啟維基來源；不影響定位與拍照。';}
   finally{if(version===generation)button.disabled=false;}
  }
  button.onclick=load;
 };
}
