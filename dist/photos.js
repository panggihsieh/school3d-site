import { firebaseConfig, adminEmail } from './firebase-config.js';
const $ = selector => document.querySelector(selector);
const labels = { campus: '校園照片', plant: '植物照片', panorama: '360° 環景素材' };
let sdk, user, photos = [], previewURL, selectedFile;
const message = text => { $('#status').textContent = text; };
const isAdmin = () => user?.email === adminEmail && user.emailVerified;
function render() {
  $('#gallery').replaceChildren();
  const items = photos.filter(p => $('#filter').value === 'all' || p.category === $('#filter').value);
  $('#gallery-status').textContent = items.length ? `${items.length} 張照片` : '尚無此類照片。';
  for (const p of items) {
    const card = document.createElement('article'); card.className = 'photo-card';
    const link = document.createElement('a'); link.href = p.url; link.target = '_blank'; link.rel = 'noopener';
    const img = document.createElement('img'); img.src = p.url; img.alt = p.title; img.loading = 'lazy'; link.append(img);
    const title = document.createElement('h3'); title.textContent = p.title;
    const detail = document.createElement('p'); detail.textContent = `${labels[p.category]} · ${p.target}\n${p.description}`;
    card.append(link, title, detail);
    if (isAdmin()) {
      const edit = document.createElement('button'); edit.textContent = '編輯說明';
      edit.onclick = async () => {
        const title = prompt('照片名稱', p.title); if (title === null) return;
        const description = prompt('照片說明', p.description); if (description === null) return;
        if (!title.trim() || title.length > 100 || description.length > 1000) { message('名稱需為 1–100 字，說明最多 1000 字。'); return; }
        edit.disabled = true;
        try { await sdk.updateDoc(sdk.doc(sdk.db, 'photos', p.id), { title: title.trim(), description }); await load(); message('已更新。'); }
        catch (e) { message(`更新失敗：${e.code || e.message}`); } finally { edit.disabled = false; }
      };
      const remove = document.createElement('button'); remove.textContent = '刪除';
      remove.onclick = async () => {
        if (!confirm(`確定刪除「${p.title}」？`)) return;
        remove.disabled = true;
        try {
          try { await sdk.deleteObject(sdk.ref(sdk.storage, p.path)); } catch (e) { if (e.code !== 'storage/object-not-found') throw e; }
          await sdk.deleteDoc(sdk.doc(sdk.db, 'photos', p.id)); await load(); message('已刪除。');
        } catch (e) { message(`刪除未完成，請重試：${e.code || e.message}`); } finally { remove.disabled = false; }
      };
      card.append(edit, ' ', remove);
    }
    $('#gallery').append(card);
  }
}
async function load() {
  const result = await sdk.getDocs(sdk.collection(sdk.db, 'photos'));
  photos = result.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  render();
}
$('#filter').onchange = render;
const fileInput = document.querySelector('[name=photo]');
const cameraInput = document.querySelector('[name=camera]');
function previewFile(input, otherInput) {
  const file = input.files[0];
  if (!file) return;
  otherInput.value = '';
  selectedFile = file;
  if (previewURL) URL.revokeObjectURL(previewURL);
  $('#preview').hidden = !file;
  if (file) { previewURL = URL.createObjectURL(file); $('#preview').src = previewURL; }
}
fileInput.onchange = () => previewFile(fileInput, cameraInput);
cameraInput.onchange = () => previewFile(cameraInput, fileInput);
async function start() {
  if (!['apiKey','authDomain','projectId','storageBucket','appId'].every(k => firebaseConfig[k])) {
    $('#setup-state').textContent = '尚未啟用：請依序完成以下設定。'; return;
  }
  $('#setup-state').textContent = `已填入專案：${firebaseConfig.projectId}。若登入失敗，請檢查授權網域及服務規則。`;
  const base = 'https://www.gstatic.com/firebasejs/13.2.0/';
  const [app, auth, db, storage] = await Promise.all(['app','auth','firestore','storage'].map(name => import(`${base}firebase-${name}.js`)));
  const instance = app.initializeApp(firebaseConfig);
  sdk = { ...auth, ...db, ...storage, db: db.getFirestore(instance), storage: storage.getStorage(instance), auth: auth.getAuth(instance) };
  const data = await fetch('./data.json').then(r => { if (!r.ok) throw new Error('地點資料載入失敗'); return r.json(); });
  for (const p of data.points) { const option = document.createElement('option'); option.value = p.id; option.textContent = `${p.id} ${p.name}`; document.querySelector('[name=target]').append(option); }
  for (let n=1;n<=18;n++) { const option = document.createElement('option'); option.value = `P${String(n).padStart(2,'0')}`; option.textContent = `${option.value} 環景站點`; document.querySelector('[name=target]').append(option); }
  $('#login').disabled = false;
  $('#login').onclick = async () => {
    $('#login').disabled = true;
    try { const provider = new auth.GoogleAuthProvider(); provider.setCustomParameters({ prompt: 'select_account' }); await auth.signInWithPopup(sdk.auth, provider); }
    catch (e) { message(`登入失敗：${e.code || e.message}。請確認允許彈出視窗及授權網域。`); }
    finally { $('#login').disabled = false; }
  };
  $('#logout').onclick = () => auth.signOut(sdk.auth).catch(e => message(`登出失敗：${e.code}`));
  auth.onAuthStateChanged(sdk.auth, current => {
    user = current; $('#editor').hidden = !isAdmin(); $('#logout').hidden = !user; $('#login').hidden = !!user;
    message(isAdmin() ? '已登入，可以上傳與管理公開照片。' : user ? '此帳號沒有管理權限，請登出後使用指定帳號。' : '訪客模式，可瀏覽公開照片。'); render();
  });
  $('#upload-form').onsubmit = async event => {
    event.preventDefault(); if (!isAdmin()) return;
    const form = event.currentTarget; const file = selectedFile;
    if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 20*1024*1024 || !file.size) { message('請選擇 20 MB 以下的 JPG、PNG 或 WebP。'); return; }
    if (form.elements.category.value === 'panorama') {
      const img = new Image(); img.src = previewURL;
      try { await img.decode(); } catch { message('圖片無法讀取，請重新選擇 JPG、PNG 或 WebP。'); return; }
      if (Math.abs(img.width / img.height - 2) > .02) { message('環景照片應為 2:1 完整球面圖片，請確認檔案。'); return; }
    }
    $('#upload-fields').disabled = true; message('正在上傳，請勿關閉頁面…');
    const record = db.doc(db.collection(sdk.db, 'photos'));
    const path = `photos/${record.id}/original`;
    let uploaded = false;
    try {
      const ref = storage.ref(sdk.storage, path); await storage.uploadBytes(ref, file, { contentType: file.type }); uploaded = true;
      const url = await storage.getDownloadURL(ref);
      await db.setDoc(record, { title: form.elements.title.value.trim(), description: form.elements.description.value, category: form.elements.category.value, target: form.elements.target.value, path, url, createdAt: db.serverTimestamp() });
      form.reset(); selectedFile = undefined; $('#preview').hidden = true; if (previewURL) URL.revokeObjectURL(previewURL); await load(); message('上傳完成，照片已公開。');
    } catch (e) {
      // 若紀錄已建立但重新整理相簿失敗，不移除已發布的圖片。
      if (uploaded) {
        try { const saved = await db.getDoc(record); if (!saved.exists()) await storage.deleteObject(storage.ref(sdk.storage, path)); } catch { /* 保留素材供管理員檢查 */ }
      }
      message(`上傳或相簿更新失敗：${e.code || e.message}。請重新整理確認結果後再試。`);
    } finally { $('#upload-fields').disabled = false; }
  };
  await load();
}
start().catch(e => { message(`雲端連線失敗：${e.code || e.message}`); $('#gallery-status').textContent = '相簿暫時無法載入，請稍後重試。'; });
