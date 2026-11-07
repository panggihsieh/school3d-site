export const validEcologyId=id=>/^EC(0[1-9]|1[01])$/.test(id);
export function validateEcologyPosition(p){if(p===null)return null;if(!p||typeof p.x!=='number'||typeof p.y!=='number'||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>100||p.y<0||p.y>100)throw Error('圖片位置須介於 0–100%');return {x:Math.round(p.x*100)/100,y:Math.round(p.y*100)/100};}
export function pointerPosition(rect,x,y){return validateEcologyPosition({x:Math.max(0,Math.min(100,(x-rect.left)/rect.width*100)),y:Math.max(0,Math.min(100,(y-rect.top)/rect.height*100))});}
