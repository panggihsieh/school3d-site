import test from 'node:test';import assert from 'node:assert/strict';
import {stations,directions,stationDescription,latestViews,locatedStations,validStationLocation,nextDirection,stationReadingContext,resolveStationId,stationChangeNotice} from '../dist/space-domain.js';
import {hasPublishedTreePhoto} from '../dist/published-photos.js';
test('15 reviewed stations retain original IDs and four directions without invented GPS',()=>{assert.equal(stations.length,15);assert.equal(new Set(stations.map(s=>s.id)).size,15);assert.deepEqual(directions.map(d=>d[0]),['north','east','south','west']);assert.deepEqual(locatedStations([]),[]);assert.ok(stations.every(s=>s.latitude===undefined));});

test('merged links resolve to retained stations without reusing retired photos or GPS',()=>{
 assert.equal(resolveStationId('P15'),'P11');assert.equal(resolveStationId('P17'),'P16');assert.equal(resolveStationId('P18'),null);assert.equal(resolveStationId('P16'),'P16');assert.equal(resolveStationId('unknown'),null);
 assert.match(stationChangeNotice('P18'),/移除/);assert.match(stationChangeNotice('P17'),/外側不用拍/);
 const old=[{target:'P17',kind:'north',location:{latitude:23.55,longitude:120.55,accuracy:5}}];
 assert.deepEqual(locatedStations(old),[]);assert.deepEqual(latestViews(old,'P16'),{});assert.equal(old[0].target,'P17');
});
test('only reliable station GPS enters nearest-station matching',()=>{const p={latitude:23.558,longitude:120.554,accuracy:10};assert.equal(validStationLocation(p),true);for(const change of [{latitude:91},{longitude:181},{accuracy:30},{accuracy:-1},{latitude:null}])assert.equal(validStationLocation({...p,...change}),false);assert.deepEqual(locatedStations([{target:'P01',location:p,publishedAt:'2026-11-05'}]).map(s=>s.id),['P01']);assert.equal(locatedStations([{target:'MOE123',location:p}]).length,0);});
test('latest directional photo wins while missing directions and full panoramas stay distinct',()=>{const records=[{target:'P01',kind:'north',id:'old',publishedAt:'2026-11-01'},{target:'P01',kind:'north',id:'new',publishedAt:'2026-11-05'},{target:'P01',kind:'panorama',id:'sphere'},{target:'P02',kind:'east',id:'other'}];const views=latestViews(records,'P01');assert.deepEqual(Object.keys(views),['north']);assert.equal(views.north.id,'new');assert.equal(nextDirection('north',-1),'west');assert.equal(nextDirection('west',1),'north');});
test('only published campus tree images replace that individual tree wiki reference',()=>{const p={target:'MOE123',kind:'whole',url:'./assets/uploads/12345678-1234-1234-1234-123456789abc.jpg'};assert.equal(hasPublishedTreePhoto([p],'MOE123'),true);assert.equal(hasPublishedTreePhoto([p],'MOE124'),false);assert.equal(hasPublishedTreePhoto([{...p,url:'./assets/species-reference/0001-abc.jpg'}],'MOE123'),false);assert.equal(hasPublishedTreePhoto([{...p,target:'P01',kind:'north'}],'P01'),false);assert.equal(hasPublishedTreePhoto([],'MOE123'),false);});

test("station descriptions include identity, positioning caveat and four-view capture guidance",()=>{for(const s of stations){const text=stationDescription(s);assert.ok(text.includes(s.id));assert.ok(text.includes(s.name));assert.match(text,/示意建議/);assert.match(text,/前方、右方、後方、左方各拍一張/);assert.match(text,/第一張照片的朝向為前方/);assert.match(text,/補拍同一站時沿用原本的前方/);}});

test('station reading uses a fresh reliable fix and nearby located station, rejecting missing, distant or stale locations',()=>{
 const now=Date.now(),fix={latitude:23.55,longitude:120.55,accuracy:6,time:now};
 const records=[{target:'P02',kind:'north',location:fix}];
 assert.equal(stationReadingContext(records,fix,now).station.id,'P02');
 for(const p of [{...fix,accuracy:26},{...fix,time:now-21000},{...fix,latitude:24.55}])assert.equal(stationReadingContext(records,p,now).station,undefined);
 assert.equal(stationReadingContext([],fix,now).station,undefined);
});
