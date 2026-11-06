const siteQrDialog=document.querySelector('#site-qr-dialog');
document.querySelector('#site-qr-button').addEventListener('click',()=>siteQrDialog.showModal());
siteQrDialog.querySelector('[data-close]').addEventListener('click',()=>siteQrDialog.close());
siteQrDialog.addEventListener('click',event=>{if(event.target===siteQrDialog){const rect=siteQrDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)siteQrDialog.close();}});
