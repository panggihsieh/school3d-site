import {seasonForMonth} from './learning.js';

const seasons={spring:'春季',summer:'夏季',autumn:'秋季',winter:'冬季'};
const birds={
 swallow:{name:'家燕',color:'#294b60',chest:'#eed7b2',description:'在臺灣有夏候鳥、冬候鳥與過境族群。這裡以春夏情境呈現，不表示其他季節不存在。',url:'https://kmweb.moa.gov.tw/theme_data.php?id=50&theme=bird_illustration'},
 shrike:{name:'紅尾伯勞',color:'#a56e45',chest:'#f3e4c8',description:'在臺灣主要為冬候鳥與過境鳥，秋冬較適合用來認識候鳥季節。此動畫不代表校園實際出現紀錄。',url:'https://kmweb.moa.gov.tw/theme_data.php?id=142&theme=bird_illustration'}
};
const pools={spring:['swallow','shrike'],summer:['swallow'],autumn:['shrike','swallow'],winter:['shrike']};
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
 el.innerHTML='<svg viewBox="0 0 100 70" aria-hidden="true"><path class="bird-tail" d="M35 43 4 52 19 37 6 20 39 30Z"/><ellipse class="bird-body" cx="51" cy="36" rx="27" ry="15"/><ellipse class="bird-chest" cx="58" cy="42" rx="18" ry="8"/><path class="bird-wing" d="M40 34Q24 -4 76 12L63 35Z"/><circle class="bird-body" cx="77" cy="24" r="12"/><path fill="#d8ad5b" d="m87 21 12 5-13 4Z"/><circle fill="#fff" cx="81" cy="21" r="3"/><circle fill="#182b25" cx="82" cy="21" r="1.6"/></svg>';
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
