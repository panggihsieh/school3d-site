"""Download attributable Wikimedia species reference photos, never campus specimens."""
import concurrent.futures, datetime, hashlib, html, json, pathlib, re, time, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist' / 'assets' / 'species-reference'
MANIFEST = ROOT / 'dist' / 'species-photos.json'
UA = 'School3D-SpeciesReference/1.0 (https://github.com/panggihsieh/school3d-site)'
ALIASES={
 '0328':('Juniperus chinensis Kaizuka','"Juniperus chinensis" "Kaizuka"','龍柏栽培品種參考，單株修剪造型仍以現場為準。',''),
 '0606':('Codiaeum variegatum','"Codiaeum variegatum"','此為變葉木種層級參考，尚未確認為清冊指定的細葉型。',''),
 '0297':('Koelreuteria elegans subsp. formosana','"Koelreuteria elegans" "formosana"','依 Kew 與林試所異名對照搜尋，保留清冊原學名。','https://www.tfri.gov.tw/News_Content.aspx?n=7658&s=217'),
 '0213':('Cinnamomum burmanni','"Cinnamomum burmanni"','使用清冊學名的另一拼寫搜尋，保留原始資料。','https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=119261'),
 '0216':('Crateva formosensis','"Crateva formosensis"','使用魚木的現行分類名稱搜尋，保留清冊原學名。','https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A2742338-4')
}
OUT.mkdir(parents=True, exist_ok=True)

def plain(value):
    return html.unescape(re.sub('<[^>]+>', '', str(value or ''))).strip()

def taxon(value):
    words=value.split()
    length=3 if len(words)>2 and words[1] in ('×', 'x') else 2
    base=' '.join(words[:length])
    for marker in ('var.', 'subsp.', 'forma', 'cv.'):
        if marker in words:
            i=words.index(marker)
            if i+1<len(words): base+=' '+marker+' '+words[i+1]
    return base

def get(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':UA}), timeout=25) as response:
                data=response.read(5_000_001)
                if len(data)>5_000_000: raise ValueError('Image larger than 5 MB')
                return data
        except Exception:
            if attempt==2: raise
            time.sleep(2+attempt*2)

def collect(item):
    code,p=item
    query=taxon(p['scientificName'])
    record={'code':code,'species':p['species'],'scientificName':p['scientificName'],'query':query,'referenceOnly':True,'photos':[],'status':'pending'}
    search_term=f'"{query}"'
    if code in ALIASES:
        query,search_term,note,source=ALIASES[code]
        record.update(query=query,matchNote=note,taxonomySource=source)
    try:
        params={'action':'query','format':'json','generator':'search','gsrnamespace':6,'gsrsearch':f'filetype:bitmap {search_term} -intitle:illustration -intitle:drawing -intitle:painting -intitle:"Botanical Magazine"','gsrlimit':8,'prop':'imageinfo','iiprop':'url|mime|extmetadata','iiurlwidth':640,'iiextmetadatafilter':'Artist|LicenseShortName|LicenseUrl|ImageDescription|Categories|Credit'}
        data=json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)))
        pages=sorted(data.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',100))
        for page in pages:
            info=(page.get('imageinfo') or [{}])[0];meta=info.get('extmetadata',{})
            title=page.get('title','');description=plain(meta.get('ImageDescription',{}).get('value',''))
            if re.search(r'habitat and cliffs|canelle|cinnamon sticks|powder',title,re.I): continue
            if re.search(r'botanical magazine|illustration|drawing|painting|engraving|herbarium|diagram|\brange\b|\bmaps?\b|wood sample|museum specimen',title+' '+plain(meta.get('Categories',{}).get('value','')),re.I): continue
            license=plain(meta.get('LicenseShortName',{}).get('value',''))
            artist=plain(meta.get('Artist',{}).get('value',''))
            if not artist or not re.match(r'^(CC BY|CC0|Public domain)',license,re.I): continue
            thumbnail=info.get('thumburl','');source=info.get('descriptionurl','')
            if urllib.parse.urlparse(thumbnail).hostname not in ('upload.wikimedia.org','thumb.wikimedia.org') or urllib.parse.urlparse(source).hostname!='commons.wikimedia.org': continue
            if info.get('mime') not in ('image/jpeg','image/png','image/webp'): continue
            # Require the binomial in filename, description or categories, not only a search match.
            base=' '.join(query.split()[:3 if ' × ' in query else 2]).lower().replace('×','')
            normalized=re.sub(r'\s+',' ',(title.replace('_',' ')+' '+description+' '+plain(meta.get('Categories',{}).get('value',''))).lower().replace('×',''))
            if re.sub(r'\s+',' ',base) not in normalized: continue
            raw=get(thumbnail)
            if raw.startswith(b'\xff\xd8\xff'): extension='jpg'
            elif raw.startswith(b'\x89PNG\r\n\x1a\n'): extension='png'
            elif raw[:4]==b'RIFF' and raw[8:12]==b'WEBP': extension='webp'
            else: continue
            filename=code+'-'+hashlib.sha256(raw).hexdigest()[:12]+'.'+extension
            (OUT/filename).write_bytes(raw)
            record['photos'].append({'title':title.removeprefix('File:'),'url':'./assets/species-reference/'+filename,'source':source,'originalURL':info.get('url',''),'downloadURL':thumbnail,'artist':artist,'license':license,'licenseURL':(meta.get('LicenseUrl',{}).get('value','') or source),'credit':plain(meta.get('Credit',{}).get('value','')),'retrievedAt':datetime.date.today().isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'changes':'Wikimedia-provided thumbnail; no further edits'})
            record['status']='available'
            break
        if not record['photos']: record['reason']='未找到可確認學名且具完整可重用授權的實拍照片，待人工補充。'
    except Exception as error:
        record['reason']=str(error)[:250]
    print(code,query,record['status'],flush=True)
    return code,record

if __name__=='__main__':
    points=json.loads((ROOT/'dist'/'data.json').read_text(encoding='utf-8'))['points']
    species={p['sourceSpeciesCode']:p for p in points if p['topic']=='carbon' and p.get('sourceSpeciesCode')}
    records={}
    if MANIFEST.exists(): records=json.loads(MANIFEST.read_text(encoding='utf-8')).get('species',{})
    todo=[(code,p) for code,p in species.items() if not(records.get(code,{}).get('photos') and all((ROOT/'dist'/photo['url'].removeprefix('./')).exists() for photo in records[code]['photos']))]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for code,record in pool.map(collect,todo):
            records[code]=record
            result={'version':1,'referenceOnly':True,'species':records}
            MANIFEST.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    available=sum(bool(r['photos']) for r in records.values())
    result={'version':1,'referenceOnly':True,'species':records}
    MANIFEST.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=['# 樹種參考照片與授權','','這些是 Wikimedia Commons 同樹種參考照片，不是校內單株實拍。原始清冊學名不會因搜尋異名而改寫。','','重新收集：`python scripts/collect_species_photos.py`。已存在的照片會保留；待補項目會重試。','','每張圖片採 Wikimedia 提供的縮圖，未另作修改。授權與作者逐檔保留如下。','']
    for code,record in sorted(records.items()):
        lines += [f"## {code} {record['species']}",'',record['scientificName'],'']
        if record.get('matchNote'): lines += [record['matchNote'],'']
        if record.get('taxonomySource'): lines += [f"分類對照：{record['taxonomySource']}",'']
        for photo in record['photos']:
            lines += [f"- 檔案：`dist/{photo['url'].removeprefix('./')}`",f"- [來源：{photo['title']}]({photo['source']})",f"- 作者：{photo['artist']}",f"- [授權：{photo['license']}]({photo['licenseURL']})",f"- 取用日期：{photo['retrievedAt']}",'']
        if not record['photos']: lines += ['待確認及補充；不以近似種替代。','']
    (ROOT/'SPECIES-PHOTO-SOURCES.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(f'RESULT {available}/{len(species)} species',flush=True)
