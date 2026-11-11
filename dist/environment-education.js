const workspace=document.querySelector('#workspace');
const section=document.createElement('section');section.className='panel';section.id='environment-education';
const heading=document.createElement('h2');heading.textContent='重要環境教育參考';
const intro=document.createElement('p');intro.textContent='校方提供的課程文件與校園生態地圖，供備課、環境教育及現地核對使用。原始檔案保留；下載連結可公開存取。';
const status=document.createElement('p');status.setAttribute('role','status');status.textContent='正在載入參考資料…';
const list=document.createElement('div');section.append(heading,intro,status,list);workspace?.prepend(section);
function text(tag,value){const node=document.createElement(tag);node.textContent=value;return node;}
async function load(){
 status.textContent='正在載入參考資料…';list.replaceChildren();
 try{
  const response=await fetch('./environment-education.json?v=20261107');if(!response.ok)throw Error();const data=await response.json();
  for(const record of data.documents){
   const article=document.createElement('article');article.dataset.document=record.id;article.style.cssText='border-top:1px solid #cdd6c4;padding:16px 0';
   article.append(text('h3',record.title),text('p',record.description),text('p',record.category+' · '+record.format+' · '+(record.bytes/1024/1024<1?Math.round(record.bytes/1024)+' KB':(record.bytes/1024/1024).toFixed(1)+' MB')+' · 收錄 '+record.addedAt));
   const url=new URL(record.url,location.href);if(url.origin!==location.origin||!url.pathname.includes('/assets/environment-education/'))throw Error();
   if(record.format==='JPEG'){
    const preview=document.createElement('a');preview.href=url.href;preview.target='_blank';preview.rel='noopener';preview.setAttribute('aria-label','開啟校園生態地圖原圖');
    const image=document.createElement('img');image.src=url.href;image.alt='校方提供的大南國小手繪校園生態地圖，含 01 至 46 圖例';image.loading='lazy';image.style.cssText='display:block;width:100%;max-width:620px;height:auto;border-radius:8px';preview.append(image);article.append(preview);
   }
   const link=document.createElement('a');link.href=url.href;link.download=record.originalFilename;link.textContent='↓ 下載原始'+(record.format==='DOCX'?' Word 文件':'生態地圖');link.style.cssText='display:inline-block;padding:12px 0;min-height:44px';article.append(link);
   const details=document.createElement('details');details.append(text('summary','來源與原檔資訊'),text('p',record.originalFilename),text('p',record.source+'。'+record.changes+'。'+record.rights+'。'));
   const hash=text('p','SHA-256：'+record.sha256);hash.style.overflowWrap='anywhere';details.append(hash);article.append(details);list.append(article);
  }
  document.dispatchEvent(new Event('environment-reference-ready'));
  status.textContent='已收錄 '+data.documents.length+' 份重要參考資料。文件內容作為參考，不自動改寫網站點位或已確認紀錄。';
 }catch{status.textContent='參考資料暫時無法載入。';const retry=text('button','重新載入');retry.type='button';retry.onclick=load;list.replaceChildren(retry);}
}
if(workspace)load();
