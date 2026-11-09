import {execFileSync} from 'node:child_process';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';

const root=process.argv[2]||'dist';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const version=`v0.3.${Number(git('rev-list','--count','HEAD'))+1}`;
const modified=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date()).replaceAll('-','/').replace(',','');
const badge=`<!-- project-version:start --><footer id="project-version" aria-label="網站版本資訊" style="display:block;clear:both;margin:16px 12px;padding:10px 14px;border:1px solid #dce1d4;border-radius:6px;background:#fffdf7;color:#24483c;font:12px/1.8 system-ui,sans-serif;overflow-wrap:anywhere">版本：${version} ｜ 最後修改：${modified}（臺灣時間）</footer><!-- project-version:end -->`;
let count=0;
async function stamp(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const path=join(directory,entry.name);
  if(entry.isDirectory()){await stamp(path);continue;}
  if(!entry.name.endsWith('.html'))continue;
  let html=await readFile(path,'utf8');
  html=html.replace(/<!-- project-version:start -->[\s\S]*?<!-- project-version:end -->\s*/g,'');
  if(!/<\/body>/i.test(html))throw Error(`Missing body closing tag: ${path}`);
  if(resolve(path)===resolve(root,'index.html')){
   const topBadge=badge.replace('<footer ','<div ').replace('</footer>','</div>').replace('display:block;clear:both;margin:16px 12px;','display:block;clear:both;text-align:left;margin:0;');
   await writeFile(path,html.replace(/<body\b[^>]*>/i,body=>`${body}\n${topBadge}`));
  }else await writeFile(path,html.replace(/<\/body>/i,`${badge}\n</body>`));
  count++;
 }
}
await stamp(root);
console.log(`Stamped ${count} pages: ${version} | ${modified} Asia/Taipei`);
