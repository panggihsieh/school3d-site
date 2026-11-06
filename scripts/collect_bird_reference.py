"""Collect Commons photographs with explicit attribution; keep original school image slots distinct from taxa.
Run: python scripts/collect_bird_reference.py --species PATH --output dist/bird-reference.json
The species input lists id/name/taxon/schoolPhotoNumber. No credentials are required.
"""
import argparse, concurrent.futures, hashlib, html, json, re, urllib.parse, urllib.request
from pathlib import Path
UA='School3dBirdReference/1.0 (educational species photographs and attribution)'
def request(url):
    return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=45).read()
def clean(value): return html.unescape(re.sub('<[^>]+>','',str(value))).strip()
def collect(row):
    query={'action':'query','format':'json','generator':'search','gsrsearch':f'intitle:"{row["taxon"]}" filetype:bitmap -skeleton -egg -map -distribution -museum','gsrnamespace':6,'gsrlimit':8,'prop':'imageinfo','iiprop':'url|size|extmetadata','iiurlwidth':1400}
    data=json.loads(request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(query)))
    candidates=[]
    for page in data.get('query',{}).get('pages',{}).values():
        info=page.get('imageinfo',[{}])[0];meta=info.get('extmetadata',{});license=clean(meta.get('LicenseShortName',{}).get('value',''))
        if not re.match(r'^(CC BY|CC0|Public domain)',license):continue
        if info.get('width',0)<1000 or info.get('height',0)<650:continue
        if not re.search(r'\.(jpe?g|png)$',page['title'],re.I):continue
        candidates.append((page.get('index',999),page,info,meta,license))
    if not candidates:raise RuntimeError('No suitable licensed photograph: '+row['id'])
    candidates.sort(key=lambda x:x[0]);choice=1 if row['id']=='owl-b' and len(candidates)>1 else 0
    _,page,info,meta,license=candidates[choice]
    url=info.get('thumburl') or info['url'];raw=request(url)
    suffix='.png' if '.png' in urllib.parse.urlparse(url).path.lower() else '.jpg'
    target=OUT/'assets'/'birds'/(row['id']+suffix);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
    return {**row,'image':'./assets/birds/'+target.name,'sourceUrl':info['descriptionurl'],'downloadUrl':url,'originalUrl':info['url'],'artist':clean(meta.get('Artist',{}).get('value','')),'license':license,'licenseUrl':meta.get('LicenseUrl',{}).get('value',''),'sourceWidth':info['width'],'sourceHeight':info['height'],'sha256':hashlib.sha256(raw).hexdigest(),'schoolSource':'https://www.dnps.cyc.edu.tw/file/bird/bird.htm','evidence':'school-introduction','locationNote':'物種參考照片，非梅山現地拍攝或當日校園目擊證據。','animation':None}
if __name__=='__main__':
    args=argparse.ArgumentParser();args.add_argument('--species',required=True);args.add_argument('--output',required=True);a=args.parse_args();OUT=Path(a.output).parent
    rows=json.loads(Path(a.species).read_text(encoding='utf-8'));cached=json.loads(Path(a.output).read_text(encoding='utf-8')).get('birds',[]) if Path(a.output).exists() else [];result=[r for r in cached if (OUT/r['image'].removeprefix('./')).exists()];rows=[r for r in rows if r['id'] not in {x['id'] for x in result}];expected=len(rows)+len(result)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for future in concurrent.futures.as_completed([pool.submit(collect,r) for r in rows]):
            try:
                item=future.result();result.append(item);print(item['id'],item['sourceWidth'],item['sourceHeight'],item['license'],flush=True)
            except Exception as e:print('FAILED',str(e),flush=True)
    result.sort(key=lambda r:r['schoolPhotoNumber']);Path(a.output).write_text(json.dumps({'retrievedAt':'2026-11-06','basis':'校方頁面共12張照片，不等於12個已鑑定物種；兩張角鴞保留分開並標示待核對。','birds':result},ensure_ascii=False,indent=2),encoding='utf-8')
    if len(result)!=expected:raise SystemExit('Incomplete photo set: '+str(len(result)))
