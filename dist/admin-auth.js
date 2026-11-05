import {adminEmail} from './firebase-config.js';
export function isAuthorizedAdmin(user){
 return !!user&&user.email===adminEmail&&user.emailVerified===true&&Array.isArray(user.providerData)&&user.providerData.some(provider=>provider.providerId==='google.com');
}
