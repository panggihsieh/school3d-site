let pending;
export function refreshPublishedPhotos(){pending=null;return loadPublishedPhotos();}
export function loadPublishedPhotos(){return pending??=fetch('./public-photos.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('實拍相簿載入失敗');return r.json();}).catch(e=>{pending=null;throw e;});}
export function hasPublishedTreePhoto(records,id){return /^MOE\d+$/.test(id||'')&&records.some(p=>p.target===id&&['whole','bark','leaf-front','leaf-back','label','flower-fruit'].includes(p.kind)&&/^\.\/assets\/uploads\/[a-f0-9-]{36}\.jpg$/.test(p.url||''));}
