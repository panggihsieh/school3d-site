# 大南國小 3D 生態導覽

`dist/tour.html` 提供獨立 3D 模型、公開 360° 環景切換、站點選擇、全螢幕及支援裝置的 WebXR 沉浸式 VR。iPhone 使用觸控環視。沒有環景時顯示待補，不將普通照片冒充環景。`field.html` 可為 P01–P18 上傳六個方向／細節照片或完整球面環景，補拍清單顯示已發布數量；單株卡片自動顯示 GitHub 已發布照片與公開說明。環景縮至最長邊 4096、最多 2.6 MB，普通照片最多 650 KB；請另留原圖。所有上傳仍須完成 Worker 的 GITHUB_TOKEN Secret 設定才能寫入。

`dist/field.html` 提供管理員樹木現場採集：Firebase Google 登入、GPS 候選樹木、北向上座標示意圖、TTS 接近提醒、確認編號、壓縮拍照、IndexedDB 本機草稿、備份匯出及 Cloudflare Worker 上傳 GitHub。公開照片清單為 `dist/public-photos.json`。Worker 已部署，仍需帳號擁有人設定 GitHub 專用 Secret 才能真正寫入，見 [upload-service/SETUP.md](upload-service/SETUP.md)。Firestore 仍維持預設拒絕存取；此上傳流程不使用 Firestore 或 Storage。

新增 `dist/photos.html` 公開相簿與 Google 登入照片後台，管理員為 teacher.hsieh@gmail.com。首頁側邊欄提供 Firebase 啟用入口；尚需建立 Firebase 專案、填入公開設定並發布服務規則才能使用。完整設定見 [firebase/SETUP.md](firebase/SETUP.md)。下方原有瀏覽器資料編輯功能仍獨立運作。

完整 3D 導覽：https://panggihsieh.github.io/school3d-site/

植物吸碳／維護排碳計算：https://panggihsieh.github.io/school3d-site/tree/

計算網站是獨立前端，位於此發布庫的 `dist/tree/`。維護活動排碳採使用者提供的活動量與係數，不預填係數，不將平台累積儲碳當作一年吸碳。計算資料可匯出 JSON，不會自動同步到 3D 網站。

純前端網站，包含校園空間、植物碳資訊、鳥類觀察與生態景點。此公開儲存庫只包含可發布的網站檔案與部署設定，不包含私人開發儲存庫的歷史、原始文件或執行資料。

網站使用相對路徑，支援 GitHub Pages 子路徑。修改 `dist/` 並推送到 `main` 後，由 GitHub Actions 部署。

植物資料來源：[教育部校園樹木資訊平臺－大南國小](https://edutreemap.moe.edu.tw/trees/#/Map?campusCode=104721)，2026-10-28 快照，127 株、46 種。3D 對位與樹冠造型為示意，平台估算儲碳不是每年吸碳量。

編輯資料只存在各自的瀏覽器，可用 JSON 匯出／匯入；沒有跨裝置同步或登入後台。現地勿使用鳥音引誘鳥類。

Third-party software: Three.js 0.180.0 (MIT), see `dist/vendor/THREE-LICENSE.txt`。原創模型僅供示意；教育部資料與 Google Earth 等外部來源的權利不在原創資產授權範圍內。

## 樹木 3D 與實拍

校園場景依各株樹種、胸徑及樹高建立六類樹形示意；植物資料卡可開啟可旋轉的單株 3D 預覽。樹冠寬度、枝葉與樹形分類是呈現用的近似造型，不是實拍或掃描重建。缺少尺寸時會標註模型使用的暫定值。

可為每株加入 JPG、PNG 或 WebP 實拍照片（每張最多 2 MB），隨瀏覽器導覽資料儲存及 JSON 匯出／匯入；總量受瀏覽器儲存空間限制。照片不會自動轉為 3D，也不會自動上傳伺服器。真實單株外觀仍需上傳對應照片或另提供多視角掃描素材。拍攝規格見 PHOTO-CHECKLIST.md。

## 植物互動與碳任務

選取「植物碳資訊」中的單株，可進行文字提問、語音提問與回答朗讀。回答來自本株資料的固定主題，未連接生成式 AI；缺少資料會說明待補。語音辨識支援依瀏覽器而異，可能需要連網並由瀏覽器供應商處理語音；只在按鈕操作後要求麥克風。無辨識支援時可繼續文字問答。切換植物時會停止聆聽與朗讀。

「植物碳任務與遊戲」包含現場胸圍換算胸徑、具來源係數的維護活動排碳計算，以及三題隨機知識闖關。完成三類任務可獲得本次勳章並下載 JSON 紀錄。任務僅保留於目前卡片，切換植物前須下載，不會覆寫教育部平台數據。遊戲算術係數明確標為教學假設，不代表現行排放係數。

## 季節鳥類情境動畫

「鳥類觀察」提供「梅山大南鳥類・聽聲學習」入口，另開使用者指定的 AI 鳥鳴小偵探題庫（保留 bank 參數）。字卡、照片、鳥鳴、朗讀與挑戰在原學習網站使用，尚未同步題庫、登入或學習紀錄至本網站；未複製該站照片與音檔。

依 Asia/Taipei 的月份選擇季節，約每 10–24 秒隨機出現一隻示意鳥，可暫停、手動查看或切換季節。點鳥可查看介紹。遵循減少動態設定、頁面隱藏時不持續產生動畫，不播放鳥鳴。這是情境教學，不是校園實際出現紀錄或鳥種辨識。

季節情境使用家燕與紅尾伯勞；季節只決定教學抽樣，不表示鳥種在其他月份不存在。參考農業部鳥類資料：
- 家燕：https://kmweb.moa.gov.tw/theme_data.php?id=50&theme=bird_illustration
- 紅尾伯勞：https://kmweb.moa.gov.tw/theme_data.php?id=142&theme=bird_illustration

驗證：`node --test tests/learning.test.mjs`，既有 GitHub Actions 檢查原入口模組語法；新增互動模組與任務測試在本機執行。

## 管理員隱藏入口

左上角「大南・生態校園」標誌連點 5 次（每次間隔不超過 3 秒），彈出教師拍照／GPS 採集後台 QR Code；也可點視窗內連結在目前裝置開啟。鍵盤可聚焦標誌連按 Enter。首頁不常駐顯示管理後台連結與 QR Code。

後台僅接受已驗證的 teacher.hsieh@gmail.com Google 帳號，其他帳號隱藏工作區並自動登出。隱藏入口只是操作入口，實際上傳仍由 Worker 驗證 Firebase JWT、指定管理員信箱及 Google 登入方式；直接知道後台網址也不會取得上傳權限。雲端上傳授權設定仍依 upload-service/SETUP.md 完成。
