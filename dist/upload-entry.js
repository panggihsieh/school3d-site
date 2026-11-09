const button=document.querySelector('#photo-upload-entry');
if(button){
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-labelledby','photo-upload-title');dialog.style.cssText='width:min(420px,94vw);max-height:90dvh;overflow:auto;border:1px solid #dce1d4;border-radius:12px;padding:22px;background:#fffdf7;color:#24483c';
 dialog.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><h2 id="photo-upload-title" style="margin:0;font-size:21px">管理員相片上傳</h2><button type="button" aria-label="關閉相片上傳入口">✕</button></div><p>手機掃描 QR Code，開啟校園空間拍照與相簿上傳。</p><img src="./assets/space-upload-qr.svg" width="280" height="280" alt="校園空間相片上傳後台 QR Code" style="display:block;width:min(280px,100%);height:auto;margin:12px auto;background:white"><p style="text-align:center"><a href="./field.html?mode=space#space-capture">開啟校園空間相片上傳 →</a></p><p style="font-size:12px">限邦基老師 teacher.hsieh@gmail.com 的已驗證 Google 帳號；掃描 QR Code 後仍須登入。</p>';
 document.body.append(dialog);
 button.onclick=()=>{if(!button.hidden)dialog.showModal();};
 dialog.querySelector('button').onclick=()=>dialog.close();
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 new MutationObserver(()=>{if(button.hidden&&dialog.open)dialog.close();}).observe(button,{attributes:true,attributeFilter:['hidden']});
}
