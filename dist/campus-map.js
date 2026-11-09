export const campusMapImage='./assets/campus-overview-reviewed-20261109.png';
export function addCampusBrand(map){const compass=document.createElement('span');compass.className='map-north map-north-large';compass.setAttribute('role','img');compass.setAttribute('aria-label','北朝左下方，指向前門方向');compass.innerHTML='北<span aria-hidden="true">↙</span><small>前門方向</small>';map.append(compass);}
