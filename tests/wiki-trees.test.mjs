import test from 'node:test';
import assert from 'node:assert/strict';
import {treeSearchName,wikiPhotos} from '../dist/wiki-trees.js';
test('species search uses binomial name without author or Chinese aliases',()=>{
 assert.equal(treeSearchName({scientificName:'Mangifera indica L.'}),'Mangifera indica');
 assert.equal(treeSearchName({species:'芒果/芒果樹'}),'芒果');
});
test('only Wikimedia thumbnails with a Commons source and license are displayed',()=>{
 const info={mime:'image/jpeg',thumburl:'https://upload.wikimedia.org/tree.jpg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Tree.jpg',extmetadata:{Artist:{value:'Photographer'},LicenseShortName:{value:'CC BY-SA 4.0'}}};
 const data=i=>({query:{pages:{1:{title:'File:Tree.jpg',imageinfo:[i]}}}});
 assert.equal(wikiPhotos(data(info)).length,1);
 assert.equal(wikiPhotos(data({...info,thumburl:'https://other.invalid/image'})).length,0);
 assert.equal(wikiPhotos(data({...info,descriptionurl:'javascript:alert(1)'})).length,0);
 assert.equal(wikiPhotos(data({...info,extmetadata:{}})).length,0);
 assert.deepEqual(wikiPhotos({}),[]);
});
