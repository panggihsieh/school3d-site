export const ecologySeasons=['spring','summer','autumn','winter'];
export function seasonForEcologyMonth(month){
 if(!Number.isInteger(month)||month<1||month>12)throw new RangeError('月份須介於 1–12');
 return month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
}
export function filterEcologyTopics(topics,query='',season='all'){
 const needle=String(query).normalize('NFKC').trim().toLowerCase();
 return topics.filter(t=>(season==='all'||t.seasons.includes(season))&&(!needle||[t.title,t.plant,...t.animals,t.timing,t.relation,t.idea,t.mission,t.campusStatus].join(' ').normalize('NFKC').toLowerCase().includes(needle)));
}
export function ecologyPhotoIds(topics,photos){return [...new Set(topics.flatMap(t=>t.photoIds))].filter(id=>photos[id]?.url);}
