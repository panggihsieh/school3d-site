export const campusMapImage='./assets/campus-overview-3d-north-v4.png';
export function addCampusBrand(map){const brand=document.createElement('div');brand.className='campus-brand';const image=document.createElement('img');image.src='./assets/campus-map-brand.png';image.alt='大南國小 校園俯覽圖';brand.append(image);map.append(brand);}
