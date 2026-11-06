import {firebaseConfig} from './firebase-config.js';
import {isAuthorizedAdmin} from './admin-auth.js';
const logout=document.querySelector('#site-logout');
const login=document.querySelector('#teacher-login');
async function start(){
 const base='https://www.gstatic.com/firebasejs/13.2.0/';
 const [app,api]=await Promise.all([import(`${base}firebase-app.js`),import(`${base}firebase-auth.js`)]);
 const auth=api.getAuth(app.getApps().length?app.getApp():app.initializeApp(firebaseConfig));
 api.onAuthStateChanged(auth,user=>{const admin=isAuthorizedAdmin(user);logout.hidden=!admin;login.textContent=admin?'教師後台':'教師登入';});
 logout.addEventListener('click',async()=>{
  logout.disabled=true;
  try{await api.signOut(auth);}catch{alert('登出失敗，請稍後重試。');}finally{logout.disabled=false;}
 });
}
start().catch(()=>{logout.hidden=true;});
