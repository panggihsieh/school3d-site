import test from 'node:test';
import assert from 'node:assert/strict';
import {isAuthorizedAdmin} from '../dist/admin-auth.js';
const admin={email:'teacher.hsieh@gmail.com',emailVerified:true,providerData:[{providerId:'google.com'}]};
test('only the verified designated Google administrator is accepted',()=>{
 assert.equal(isAuthorizedAdmin(admin),true);
 for(const user of [null,{}, {...admin,email:'other@gmail.com'},{...admin,emailVerified:false},{...admin,providerData:[]},{...admin,providerData:[{providerId:'password'}]}])assert.equal(isAuthorizedAdmin(user),false);
});
