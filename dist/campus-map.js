export const campusMapImage='./assets/campus-overview.png';
export function addCampusBrand(map){const compass=document.createElement('span');compass.className='map-north map-north-large';compass.setAttribute('role','img');compass.setAttribute('aria-label','北朝左下方');compass.innerHTML='北<span aria-hidden="true">↙</span>';map.append(compass);}
