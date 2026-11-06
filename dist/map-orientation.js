// Preserve original image percentages; rotate image and all overlays together.
export const imageWidth=1586,imageHeight=992;
export const northUpSize=(imageWidth+imageHeight)*Math.SQRT1_2;
export function northUpPoint(x,y){const dx=(x/100-.5)*imageWidth,dy=(y/100-.5)*imageHeight;return {x:50+(-dx-dy)*Math.SQRT1_2/northUpSize*100,y:50+(dx-dy)*Math.SQRT1_2/northUpSize*100};}
export function originalPoint(x,y){const dx=(x/100-.5)*northUpSize,dy=(y/100-.5)*northUpSize;return {x:50+(-dx+dy)*Math.SQRT1_2/imageWidth*100,y:50+(-dx-dy)*Math.SQRT1_2/imageHeight*100};}
export function mountNorthUp(map){
 map.classList.add('north-up-map');const content=document.createElement('div');content.className='north-up-content';
 while(map.firstChild)content.append(map.firstChild);map.append(content);
 const mask=content.querySelector('.map-north');if(mask){mask.replaceChildren();mask.removeAttribute('role');mask.removeAttribute('aria-label');mask.setAttribute('aria-hidden','true');}
 const compass=document.createElement('span');compass.className='north-up-compass';compass.textContent='北 ↑';compass.setAttribute('aria-label','北朝上，依既有示意方向旋轉');map.append(compass);return content;
}
