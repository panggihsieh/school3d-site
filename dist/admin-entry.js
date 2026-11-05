const adminEntry=document.querySelector('.brand');
const adminDialog=document.createElement('dialog');adminDialog.setAttribute('aria-labelledby','teacher-entry-title');
adminDialog.innerHTML='<div class="dialog-heading"><h2 id="teacher-entry-title">教師後台</h2><button type="button" aria-label="關閉教師入口">✕</button></div><p>手機掃描 QR Code，開啟定位與拍照採集。</p><a href="./field.html"><img src="./assets/photo-admin-qr.png" width="220" height="220" alt="教師拍照後台 QR Code" style="display:block;margin:16px auto;max-width:100%;height:auto"></a><p style="text-align:center"><a href="./field.html">在此裝置開啟教師後台 →</a></p><p class="coverage">僅限指定管理員 Google 帳號登入。</p>';
document.body.append(adminDialog);adminDialog.querySelector('button').onclick=()=>adminDialog.close();
let logoClicks=0,lastLogoClick=0;
adminEntry.addEventListener('click',event=>{event.preventDefault();const now=Date.now();logoClicks=now-lastLogoClick<=3000?logoClicks+1:1;lastLogoClick=now;if(logoClicks===5){logoClicks=0;adminDialog.showModal();}});
