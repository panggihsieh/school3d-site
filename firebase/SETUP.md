# school3d-site 照片後台啟用

管理員為 teacher.hsieh@gmail.com；只有經 Google 驗證的此帳號可寫入。所有照片公開可讀。

1. 在 https://console.firebase.google.com/ 建立名為 school3d-site 的專案；專案 ID 以平台分配為準。
2. 專案設定新增網頁應用程式，將公開 firebaseConfig 填入 dist/firebase-config.js，保留原本 export。不要放服務帳戶金鑰。
3. Authentication 啟用 Google 提供者及支援信箱，授權網域加入 `panggihsieh.github.io`；本機驗證另加入 localhost。
4. 建立 Firestore Standard 預設資料庫（正式版模式）及 Storage bucket。Storage 需要 Blaze 方案，開通前檢查費用並設預算提醒（提醒不是支出上限）。bucket 名稱填入公開設定。
5. 在 Firestore 規則頁貼入 firestore.rules 並發布；Storage 規則頁貼入 storage.rules 並發布。不要使用全開放測試規則。這些規則只開放 photos 集合及對應照片路徑，其餘路徑預設拒絕。
6. 將網站變更部署到 GitHub Pages，進入 photos.html，用管理員 Google 帳號登入。
7. 驗收：訪客可看相簿但無法寫入；其他 Google 帳號看不到上傳介面且直接寫入也被規則拒絕；管理員可上傳、編輯說明、刪除。另以手機與第二個瀏覽器確認照片可讀。

網站目前未填 Firebase 設定，因此不會載入雲端 SDK 或要求登入。尚未以真實 Firebase 專案驗證登入與權限；完成設定後必須執行上述驗收。

相簿獨立於既有瀏覽器本機資料，不會把既有本機照片自動搬上雲端。環景素材檢查 2:1 比例，但比例不能證明是完整球面；目前不提供環景播放器或站點漫遊。上傳上限為每張 20 MB，原始檔保留於 Storage；相簿目前直接顯示原圖，建議一般照片自行縮圖後上傳，避免行動網路流量過大。

官方參考：
- https://firebase.google.com/docs/auth/web/google-signin
- https://firebase.google.com/docs/rules/rules-and-auth
- https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024

