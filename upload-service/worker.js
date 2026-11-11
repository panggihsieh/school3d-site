import {validEcologyId,validateEcologyPosition} from '../dist/ecology-position-core.js';
import {createRemoteJWKSet, jwtVerify} from 'jose';
import {handleAI} from './ai.js';
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const MAX_IMAGE=650000;
export async function verifyTeacher(token,env,keySet=keys){
 const {payload}=await jwtVerify(token,keySet,{algorithms:['RS256'],issuer:`https://securetoken.google.com/${env.FIREBASE_PROJECT}`,audience:env.FIREBASE_PROJECT,requiredClaims:['exp','iat','sub','auth_time']});
 if(!payload.sub || payload.sub.length>128 || payload.email!==env.ADMIN_EMAIL || payload.email_verified!==true || payload.firebase?.sign_in_provider!=='google.com' || payload.iat>Date.now()/1000 || payload.auth_time>Date.now()/1000)throw Error('無管理權限');
 return payload;
}
export function validatePhoto(body){
 if(!body || !/^[a-f0-9-]{36}$/.test(body.id))throw Error('照片欄位不正確');
 const station=/^P(0[1-9]|1[0-8])$/.test(body.target)||validEcologyId(body.target);
 if(!(station?['north','east','south','west','entrance','path','panorama'].includes(body.kind):/^MOE\d+$/.test(body.target)&&['whole','bark','leaf-front','leaf-back','label','flower-fruit'].includes(body.kind)))throw Error('照片欄位不正確');
 const maximum=body.kind==='panorama'?2600000:MAX_IMAGE;
 if(typeof body.title!=='string'||!body.title.trim()||body.title.length>120||typeof body.description!=='string'||body.description.length>1000)throw Error('名稱或說明不正確');
 if(typeof body.image!=='string'||body.image.length>Math.ceil(maximum/3)*4||!/^[A-Za-z0-9+/]+={0,2}$/.test(body.image)||body.image.length%4)throw Error('照片過大或格式不正確');
 const bytes=atob(body.image);if(bytes.length>maximum||bytes.length<4||bytes.charCodeAt(0)!==255||bytes.charCodeAt(1)!==216||bytes.charCodeAt(2)!==255)throw Error('只接受壓縮後 JPEG');
 let location;
 if(body.location!==undefined){const p=body.location;if(!station||!p||!Number.isFinite(p.latitude)||Math.abs(p.latitude)>90||!Number.isFinite(p.longitude)||Math.abs(p.longitude)>180||!Number.isFinite(p.accuracy)||p.accuracy<0||p.accuracy>25)throw Error('站點定位資料不正確或誤差大於 25 公尺');location={latitude:p.latitude,longitude:p.longitude,accuracy:p.accuracy};}
 return {id:body.id,target:body.target,kind:body.kind,title:body.title.trim(),description:body.description,image:body.image,...(location?{location}:{})};
}
async function github(env,path,method='GET',body){
 const r=await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/${path}`,{method,headers:{Authorization:`Bearer ${env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10','User-Agent':'school3d-upload','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 if(!r.ok){const error=Error(`GitHub 回應 ${r.status}`);error.status=r.status;throw error;}return r.json();
}
const utf8base64=s=>{const bytes=new TextEncoder().encode(s);let text='';for(const b of bytes)text+=String.fromCharCode(b);return btoa(text);};
export async function publishPhoto(env,photo){
 const branch=env.GITHUB_BRANCH||'main';
 const head=await github(env,`git/ref/heads/${branch}`);
 const commit=await github(env,`git/commits/${head.object.sha}`);
 let manifest=[];
 try{const file=await github(env,`contents/dist/public-photos.json?ref=${head.object.sha}`);manifest=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0))));}catch(e){if(e.status!==404)throw e;}
 const existing=manifest.find(p=>p.id===photo.id);if(existing)return {record:existing,commit:head.object.sha,duplicate:true};
 if(manifest.length>=1500)throw Error('相簿已達 1500 張上限，請先整理照片');
 // 確認目標來自倉庫中的官方植物清單；不接受任意寫入路徑。
 const data=await github(env,`contents/dist/data.json?ref=${head.object.sha}`);
 const trees=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\s/g,'')),c=>c.charCodeAt(0)))).points;
 if(!validEcologyId(photo.target)&&!/^P(0[1-9]|1[0-8])$/.test(photo.target)&&!trees.some(t=>t.id===photo.target&&t.topic==='carbon'))throw Error('樹木編號不存在');
 const record={id:photo.id,target:photo.target,kind:photo.kind,title:photo.title,description:photo.description,url:`./assets/uploads/${photo.id}.jpg`,publishedAt:new Date().toISOString(),...(photo.location?{location:photo.location}:{})};
 const image=await github(env,'git/blobs','POST',{content:photo.image,encoding:'base64'});
 const index=await github(env,'git/blobs','POST',{content:utf8base64(JSON.stringify([...manifest,record],null,2)),encoding:'base64'});
 const tree=await github(env,'git/trees','POST',{base_tree:commit.tree.sha,tree:[{path:`dist/assets/uploads/${photo.id}.jpg`,mode:'100644',type:'blob',sha:image.sha},{path:'dist/public-photos.json',mode:'100644',type:'blob',sha:index.sha}]});
 const next=await github(env,'git/commits','POST',{message:`Publish ${photo.target} ${photo.kind} photo`,tree:tree.sha,parents:[head.object.sha]});
 // 非強制更新，與其他上傳衝突時回報重試，不覆蓋別人的照片。
 await github(env,`git/refs/heads/${branch}`,'PATCH',{sha:next.sha,force:false});
 return {record,commit:next.sha};
}
export async function publishEcologyPosition(env,body){
 if(!validEcologyId(body?.id))throw Error('生態主題編號不正確');
 const position=validateEcologyPosition(body.position),previous=validateEcologyPosition(body.previous);
 const branch=env.GITHUB_BRANCH||'main',head=await github(env,`git/ref/heads/${branch}`),commit=await github(env,`git/commits/${head.object.sha}`);
 const file=await github(env,`contents/dist/ecology-positions.json?ref=${head.object.sha}`);
 const manifest=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0))));
 const old=manifest.positions[body.id]||null;
 if(JSON.stringify(old)!==JSON.stringify(previous)){const e=Error('此景點已由其他操作更新，請重新整理後再調整');e.status=409;throw e;}
 if(position)manifest.positions[body.id]=position;else delete manifest.positions[body.id];
 const index=await github(env,'git/blobs','POST',{content:utf8base64(JSON.stringify(manifest,null,2)),encoding:'base64'});
 const tree=await github(env,'git/trees','POST',{base_tree:commit.tree.sha,tree:[{path:'dist/ecology-positions.json',mode:'100644',type:'blob',sha:index.sha}]});
 const next=await github(env,'git/commits','POST',{message:`更新生態景點 ${body.id} 圖片位置`,tree:tree.sha,parents:[head.object.sha]});
 await github(env,`git/refs/heads/${branch}`,'PATCH',{sha:next.sha,force:false});return {commit:next.sha};
}
export function validateRegions(data){if(data?.version!==1||data.base!=='campus-v3-20261111'||!Array.isArray(data.regions)||data.regions.length!==18)throw Error('區域圖層格式不正確');const ids=new Set();for(const r of data.regions){if(!/^R(0[1-9]|1[0-8])$/.test(r.id)||ids.has(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>60||!Number.isFinite(r.x)||!Number.isFinite(r.y)||r.x<0||r.x>100||r.y<0||r.y>100)throw Error('區域名稱或位置不正確');ids.add(r.id);}return {version:1,base:data.base,regions:data.regions.map(({id,name,x,y})=>({id,name:name.trim(),x,y}))};}
export async function publishRegions(env,body){const data=validateRegions(body?.data);const branch=env.GITHUB_BRANCH||'main',head=await github(env,`git/ref/heads/${branch}`),file=await github(env,`contents/dist/campus-regions.json?ref=${head.object.sha}`);const old=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0))));if(JSON.stringify(old)!==JSON.stringify(body.previous)){const e=Error('圖層已更新，請重新整理後再修改');e.status=409;throw e;}const parent=await github(env,`git/commits/${head.object.sha}`),entries=[];
const blob=await github(env,'git/blobs','POST',{content:utf8base64(JSON.stringify(data,null,2)+'\n'),encoding:'base64'});entries.push({path:'dist/campus-regions.json',mode:'100644',type:'blob',sha:blob.sha});
const time=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()).replaceAll('-','/');
for(const path of ['index.html','field.html','capture.html','tour.html','ecology.html','photos.html','speech-diagnostic.html','tree/index.html']){const f=await github(env,`contents/dist/${path}?ref=${head.object.sha}`);let html=new TextDecoder().decode(Uint8Array.from(atob(f.content.replace(/\s/g,'')),c=>c.charCodeAt(0)));html=html.replace(/版本：v0\.3\.(\d+) ｜ 最後修改：[^<]+/,(_,n)=>`版本：v0.3.${Number(n)+1} ｜ 最後修改：${time}（臺灣時間）`);const b=await github(env,'git/blobs','POST',{content:utf8base64(html),encoding:'base64'});entries.push({path:'dist/'+path,mode:'100644',type:'blob',sha:b.sha});}
const tree=await github(env,'git/trees','POST',{base_tree:parent.tree.sha,tree:entries});const next=await github(env,'git/commits','POST',{message:'更新校園區域名稱、位置與版本時間',tree:tree.sha,parents:[head.object.sha]});await github(env,`git/refs/heads/${branch}`,'PATCH',{sha:next.sha,force:false});return {commit:next.sha};}

export default {async fetch(request,env){
 env={FIREBASE_PROJECT:'school3d-site',ADMIN_EMAIL:'teacher.hsieh@gmail.com',ALLOWED_ORIGIN:'https://panggihsieh.github.io',GITHUB_REPO:'panggihsieh/school3d-site',GITHUB_BRANCH:'main',...env};
 const origin=request.headers.get('Origin');const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':env.ALLOWED_ORIGIN,'Vary':'Origin','Cache-Control':'no-store'};
 const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
 if(origin!==env.ALLOWED_ORIGIN)return reply({error:'來源網域不允許'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Max-Age':'3600'}});
 if(new URL(request.url).pathname==='/ai/chat'&&request.method==='POST'){
  try{await verifyTeacher((request.headers.get('Authorization')||'').replace(/^Bearer /,''),env);}catch{return reply({error:'僅限已驗證的管理員登入。'},401);}
  return handleAI(request,env,headers);
 }
 if(new URL(request.url).pathname==='/campus/regions'&&request.method==='POST'){
  try{await verifyTeacher((request.headers.get('Authorization')||'').replace(/^Bearer /,''),env);}catch{return reply({error:'僅限已驗證的管理員登入'},401);}
  try{const text=await request.text();if(text.length>20000)return reply({error:'圖層資料過大'},413);return reply(await publishRegions(env,JSON.parse(text)),201);}catch(e){return reply({error:e.message},e.status===409?409:400);}
 }
 if(new URL(request.url).pathname==='/ecology/position'&&request.method==='POST'){
  try{await verifyTeacher((request.headers.get('Authorization')||'').replace(/^Bearer /,''),env);}catch{return reply({error:'僅限已驗證的管理員登入'},401);}
  if(!env.GITHUB_TOKEN)return reply({error:'尚未設定 GitHub 寫入授權'},503);
  let body;try{const reader=request.body?.getReader();if(!reader)throw Error('缺少位置資料');let text='',size=0;const decoder=new TextDecoder();while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>2048){await reader.cancel();throw Error('位置資料過大')}text+=decoder.decode(value,{stream:true})}text+=decoder.decode();body=JSON.parse(text);if(!validEcologyId(body?.id))throw Error('生態主題編號不正確');validateEcologyPosition(body.position);validateEcologyPosition(body.previous)}catch(e){return reply({error:e.message},400)}
  try{return reply(await publishEcologyPosition(env,body),201)}catch(e){return reply({error:[409,422].includes(e.status)?'位置或版本已更新，請重新整理後重試':e.status?'GitHub 寫入失敗，請檢查專用授權':e.message},[409,422].includes(e.status)?409:502)}
 }
 if(new URL(request.url).pathname!=='/upload'||request.method!=='POST')return reply({error:'找不到端點'},404);
 if(!env.GITHUB_TOKEN)return reply({error:'管理員尚未設定 GitHub 寫入授權，照片仍保留本機'},503);
 try{await verifyTeacher((request.headers.get('Authorization')||'').replace(/^Bearer /,''),env);}catch{return reply({error:'登入已失效或非管理員，請重新登入'},401);}
 let photo;
 try{
  // 不信任 Content-Length；逐段限制實際請求大小。
  const reader=request.body?.getReader();if(!reader)throw Error('缺少照片');let size=0;const chunks=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>3500000){await reader.cancel();throw Error('照片過大');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  photo=validatePhoto(JSON.parse(new TextDecoder().decode(bytes)));
 }catch(e){return reply({error:e.message},400);}
 try{return reply(await publishPhoto(env,photo),201);}catch(e){return reply({error:[409,422].includes(e.status)?'另一筆資料剛更新，請重試；照片仍在本機':e.status?'GitHub 寫入失敗，請管理員檢查專用授權與額度':e.message},[409,422].includes(e.status)?409:502);}
}};
