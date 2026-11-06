"""Refresh original-resolution bird photos from the birdsound reviewed manifests."""
import base64, hashlib, io, json, subprocess, urllib.request, urllib.error
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
paths=['data/bird-photos.json','data/v1-birds-9-18.json','data/v2-regional-birds.json']
sources={}
for path in paths:
 data=json.loads(subprocess.check_output(['gh','api','repos/panggihsieh/birdsound/contents/'+path]))
 obj=json.loads(base64.b64decode(data['content']))
 for row in obj.get('photos',obj.get('birds',[])):
  taxon=row.get('scientificName',row.get('fields',{}).get('scientificName'))
  if taxon:sources[taxon]=(row.get('photo',row),path)
manifest=ROOT/'dist/bird-reference.json'
data=json.loads(manifest.read_text(encoding='utf-8'))
def upgrade(bird):
 source,path=sources.get(bird['taxon'],({},''))
 url=source.get('downloadUrl',bird['originalUrl']).split('?')[0]
 if '/thumb/' in url:url=url.replace('thumb.wikimedia.org','upload.wikimedia.org').replace('/thumb/','/').rsplit('/',1)[0]
 request=urllib.request.Request(url,headers={'User-Agent':'School3dBirdReference/2.0 educational photo attribution'})
 raw=urllib.request.urlopen(request,timeout=45).read()
 with Image.open(io.BytesIO(raw)) as image:
  image.verify()
 with Image.open(io.BytesIO(raw)) as image:width,height=image.size
 (ROOT/'dist'/bird['image'].removeprefix('./')).write_bytes(raw)
 if source:
  for key in ['sourceUrl','artist','license','licenseUrl']:bird[key]=source[key]
  bird['referenceManifest']='https://github.com/panggihsieh/birdsound/blob/main/'+path
 bird.update(originalUrl=url,downloadUrl=url,sourceWidth=width,sourceHeight=height,sha256=hashlib.sha256(raw).hexdigest(),imageWidth=width,imageHeight=height,changes='下載原始解析度照片，未放大或 AI 補畫；網頁以等比例縮放顯示。')
 print(bird['id'],width,height,'birdsound' if source else 'existing-source',flush=True)
 return bird
results=[]
for bird in data['birds']:
 try:results.append(upgrade(dict(bird)))
 except Exception as error:
  print('RETAINED',bird['id'],str(error),flush=True)
  # Keep both the existing file and its matching metadata on a failed download.
  results.append(bird)
data['birds']=results;data['photoSourceRepository']='https://github.com/panggihsieh/birdsound';data['retrievedAt']='2026-11-06'
manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')

