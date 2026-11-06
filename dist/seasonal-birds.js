import {seasonForMonth} from './learning.js';

const seasons={spring:'春季',summer:'夏季',autumn:'秋季',winter:'冬季'};
const birds={
 swallow:{name:'麻雀',image:'./assets/birds/sparrow.jpg',description:'校方介紹鳥類的參考照片。此照片移動僅為情境示意，不代表當季校園觀測或真實飛行影片。攝影及授權請見「校方鳥類照片」。',url:'https://www.dnps.cyc.edu.tw/file/bird/bird.htm'},
 shrike:{name:'白頭翁',image:'./assets/birds/bulbul.jpg',description:'校方介紹鳥類的參考照片。各季均可認識這些鳥類；此處沒有即時觀測資料。攝影及授權請見「校方鳥類照片」。',url:'https://www.dnps.cyc.edu.tw/file/bird/bird.htm'}
};
const pools={spring:['swallow','shrike'],summer:['swallow','shrike'],autumn:['shrike','swallow'],winter:['shrike','swallow']};
const bar=document.createElement('section');bar.className='seasonal-bar';bar.setAttribute('aria-label','季節鳥類情境');
bar.innerHTML='<span>季節鳥類 · 情境動畫</span><label>季節 <select aria-label="鳥類動畫季節"><option value="auto">依臺灣目前月份</option><option value="spring">春季</option><option value="summer">夏季</option><option value="autumn">秋季</option><option value="winter">冬季</option></select></label><button type="button" class="bird-toggle">暫停動畫</button><button type="button" class="bird-show">看看季節鳥</button><small>非即時觀測；點鳥看介紹</small>';
document.querySelector('.topics').after(bar);
const layer=document.createElement('div');layer.className='seasonal-birds';document.querySelector('.map-panel').append(layer);
const info=document.createElement('div');info.className='bird-information';info.hidden=true;info.setAttribute('role','status');document.querySelector('.map-panel').append(info);
const seasonSelect=bar.querySelector('select'),toggle=bar.querySelector('.bird-toggle');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let enabled=!motion.matches,timer=null,removeTimer=null;
function season(){const month=Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Taipei',month:'numeric'}).format(new Date()));return seasonSelect.value==='auto'?seasonForMonth(month):seasonSelect.value;}
function describe(bird){
 info.replaceChildren();info.hidden=false;
 const title=document.createElement('strong');title.textContent=`${seasons[season()]}情境 · ${bird.name}`;
 const text=document.createElement('p');text.textContent=bird.description;
 const link=document.createElement('a');link.href=bird.url;link.target='_blank';link.rel='noopener';link.textContent='農業部鳥類資料 ↗';
 const close=document.createElement('button');close.textContent='關閉';close.onclick=()=>info.hidden=true;info.append(title,text,link,close);
}
function spawn(manual=false){
 if(document.hidden||(!enabled&&!manual))return;
 clearTimeout(removeTimer);layer.replaceChildren();
 const options=pools[season()],bird=birds[options[Math.floor(Math.random()*options.length)]],el=document.createElement('button');
 el.type='button';el.className=`seasonal-bird ${motion.matches?'still-bird':''}`;el.style.top=`${42+Math.random()*22}%`;el.style.setProperty('--bird-color',bird.color);el.style.setProperty('--bird-chest',bird.chest);el.setAttribute('aria-label',`${bird.name}，季節情境動畫，點選介紹`);
 const photo=document.createElement('img');photo.src=bird.image;photo.alt=bird.name;photo.style.cssText='width:110px;height:80px;object-fit:cover;border-radius:12px;border:2px solid white';el.append(photo);
 el.onclick=()=>{clearTimeout(removeTimer);el.classList.add('bird-paused');describe(bird);removeTimer=setTimeout(()=>el.remove(),15000);};
 el.onpointerenter=()=>el.classList.add('bird-paused');el.onfocus=()=>el.classList.add('bird-paused');
 if(manual){el.style.animationDelay='-2s';describe(bird);}
 layer.append(el);removeTimer=setTimeout(()=>el.remove(),motion.matches?12000:10000);
}
function schedule(){clearTimeout(timer);if(enabled&&!document.hidden&&!motion.matches)timer=setTimeout(()=>{spawn();schedule();},10000+Math.random()*14000);}
function update(){toggle.textContent=enabled?'暫停動畫':'開啟動畫';toggle.setAttribute('aria-pressed',String(enabled));schedule();}
toggle.onclick=()=>{enabled=!enabled;if(!enabled){layer.replaceChildren();clearTimeout(removeTimer);}update();};
bar.querySelector('.bird-show').onclick=()=>spawn(true);
seasonSelect.onchange=()=>{info.hidden=true;spawn(true);schedule();};
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);clearTimeout(removeTimer);layer.replaceChildren();}else schedule();});
motion.addEventListener('change',()=>{enabled=!motion.matches;layer.replaceChildren();update();});
window.addEventListener('pagehide',()=>{clearTimeout(timer);clearTimeout(removeTimer);layer.replaceChildren();});
update();
