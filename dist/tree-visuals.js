import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';

const sphere=new THREE.SphereGeometry(1,10,7);
const cylinder=new THREE.CylinderGeometry(1,1,1,9);
const cone=new THREE.ConeGeometry(1,1,12);
const bark=new THREE.MeshStandardMaterial({color:0x806347,roughness:1});
const foliage=new THREE.MeshStandardMaterial({color:0x427744,roughness:1});
const darkFoliage=new THREE.MeshStandardMaterial({color:0x2d6046,roughness:1});

// These are illustrative shape families, not scans or verified crown measurements.
export function treeShape(p){
 if(/棕櫚科|Arecaceae|Palmae/.test(p.family)||/椰子|海棗/.test(p.species))return 'palm';
 if(/象腳王蘭/.test(p.species))return 'rosette';
 if(/南洋杉|五葉松/.test(p.species))return 'tiered';
 if(/柏科|Cupressaceae/.test(p.family))return 'spire';
 if(/榕樹|鳳凰木|雨豆樹|大葉合歡/.test(p.species))return 'spreading';
 return 'broadleaf';
}
const shapeNames={palm:'棕櫚狀',rosette:'葉簇狀',tiered:'層狀',spire:'尖塔狀',spreading:'開展樹冠',broadleaf:'闊葉樹冠'};
export function makeTree(p){
 const tree=new THREE.Group(),shape=treeShape(p);
 const h=p.height>0&&p.height<=80?p.height:6;
 const diameter=p.dbh>0&&p.dbh<=500?p.dbh/100:.25;
 const trunkHeight=shape==='palm'?.83*h:shape==='rosette'?.65*h:.48*h;
 const trunk=new THREE.Mesh(cylinder,bark);trunk.scale.set(diameter/2,trunkHeight,diameter/2);trunk.position.y=trunkHeight/2;tree.add(trunk);
 if(shape==='palm'||shape==='rosette'){
  const count=shape==='palm'?12:18;
  const leaves=new THREE.InstancedMesh(sphere,foliage,count);
  const transform=new THREE.Object3D();
  for(let i=0;i<count;i++){
   const angle=i/count*Math.PI*2,length=h*(shape==='palm'?.22:.13);
   transform.position.set(Math.cos(angle)*length*.7,trunkHeight+h*.055,Math.sin(angle)*length*.7);
   transform.rotation.set(0,-angle,Math.sin(i*2.4)*.15);transform.scale.set(length,h*.025,h*.065);transform.updateMatrix();leaves.setMatrixAt(i,transform.matrix);
  }
  tree.add(leaves);
 }else if(shape==='spire'||shape==='tiered'){
  for(let i=0;i<5;i++){
   const crown=new THREE.Mesh(cone,darkFoliage),size=(1-i*.15)*h*.24;
   crown.scale.set(size,h*.38,size);crown.position.y=h*(.28+i*.14);tree.add(crown);
  }
 }else{
  const spread=shape==='spreading'?1.35:1;
  const count=22,leaves=new THREE.InstancedMesh(sphere,foliage,count),transform=new THREE.Object3D();
  for(let i=0;i<count;i++){
   const angle=i*2.39996,r=Math.sqrt((i+.5)/count)*h*.24*spread;
   transform.position.set(Math.cos(angle)*r,h*.68+Math.sin(i*1.7)*h*.12,Math.sin(angle)*r);
   transform.scale.set(h*.15*spread,h*(shape==='spreading'?.13:.21),h*.15*spread);transform.rotation.set(0,angle,0);transform.updateMatrix();leaves.setMatrixAt(i,transform.matrix);
  }
  tree.add(leaves);
  for(let i=0;i<5;i++){
   const angle=i*Math.PI*2/5,start=new THREE.Vector3(0,trunkHeight*.7,0),end=new THREE.Vector3(Math.cos(angle)*h*.17*spread,h*.65,Math.sin(angle)*h*.17*spread);
   const delta=end.clone().sub(start),branch=new THREE.Mesh(cylinder,bark);
   branch.scale.set(diameter*.22,delta.length(),diameter*.22);branch.position.copy(start.add(end).multiplyScalar(.5));branch.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());tree.add(branch);
  }
 }
 const bounds=new THREE.Box3().setFromObject(tree);tree.scale.y=h/bounds.max.y;
 tree.traverse(o=>o.userData.treeId=p.id);return tree;
}

let preview=null;
export function disposeTreeInstances(tree){tree?.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}
export function closeTreePreview(){
 if(!preview)return;
 cancelAnimationFrame(preview.frame);preview.observer?.disconnect();preview.controls?.dispose();disposeTreeInstances(preview.tree);preview.renderer?.dispose();preview=null;
}
export function showTreeCard(p,parent,onPhoto){
 const card=document.createElement('section');card.className='tree-visual-card';
 const heading=document.createElement('h4');heading.textContent='樹木 3D 與實拍';card.append(heading);
 const caption=document.createElement('p');caption.className='coverage';
 caption.textContent=`${shapeNames[treeShape(p)]}示意 · 樹高 ${p.height>0?p.height+' m':'未提供（模型暫用 6 m）'} · 胸徑 ${p.dbh>0?p.dbh+' cm':'未提供（模型暫用 25 cm）'}。樹冠與枝葉為示意，非此株實景重建。`;card.append(caption);
 const open=document.createElement('button');open.textContent='查看可旋轉 3D 樹木';card.append(open);
 const view=document.createElement('div');view.className='tree-preview';view.hidden=true;card.append(view);
 open.onclick=()=>{
  if(preview?.host===view){closeTreePreview();view.replaceChildren();view.hidden=true;open.textContent='查看可旋轉 3D 樹木';return;}
  closeTreePreview();view.hidden=false;view.replaceChildren();
  try{
   const tree=makeTree(p),scene=new THREE.Scene();scene.background=new THREE.Color('#e7eddf');scene.add(tree);scene.add(new THREE.HemisphereLight(0xfff9e9,0x75866b,3));
   const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(5,12,8);scene.add(sun);
   const box=new THREE.Box3().setFromObject(tree),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),extent=Math.max(size.x,size.y,size.z);
   const camera=new THREE.PerspectiveCamera(40,1,.01,1000);camera.position.set(extent,center.y+extent*.3,extent*1.7);
   const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));view.append(renderer.domElement);renderer.domElement.setAttribute('aria-label',`${p.name}，可拖曳旋轉的 3D 示意模型`);
   const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(center);controls.enablePan=false;controls.minDistance=extent*.7;controls.maxDistance=extent*5;controls.update();
   const session={renderer,controls,tree,host:view,frame:0};preview=session;
   session.observer=new ResizeObserver(()=>{const w=view.clientWidth,h=260;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});session.observer.observe(view);
   const animate=()=>{if(preview!==session)return;session.frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);};animate();open.textContent='關閉 3D 預覽';
  }catch{closeTreePreview();view.textContent='此裝置無法顯示 3D，仍可查看尺寸資料與實拍照片。';}
 };
 if(p.photoData){const img=document.createElement('img');img.src=p.photoData;img.alt=`${p.name}，使用者上傳的實拍照片`;img.className='tree-photo';card.append(img);}
 const label=document.createElement('label');label.className='file-button';label.textContent=p.photoData?'更換此株實拍照片':'加入此株實拍照片';
 const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;label.append(input);card.append(label);
 const status=document.createElement('p');status.className='coverage';status.textContent='實拍照片上限 2 MB，隨導覽資料存於此瀏覽器並可匯出 JSON。單張照片不會自動轉為 3D。';card.append(status);
 input.onchange=async()=>{
  const file=input.files[0];if(!file)return;
  if(file.size>2*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)){status.textContent='請選擇 2 MB 以下的 JPG、PNG 或 WebP。';return;}
  try{
   const url=URL.createObjectURL(file),probe=new Image();
   try{probe.src=url;await probe.decode();}finally{URL.revokeObjectURL(url);}
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});onPhoto(p.id,data);
  }catch{status.textContent='照片無法讀取，請改用有效的圖片檔。';}
 };
 if(p.photoData){const remove=document.createElement('button');remove.className='text-button';remove.textContent='移除實拍照片';remove.onclick=()=>onPhoto(p.id,'');card.append(remove);}
 const description=parent.querySelector('.detail-description');if(description)description.after(card);else parent.append(card);
}
