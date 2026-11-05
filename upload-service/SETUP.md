# 免費上傳服務

Firebase Spark 登入 + Cloudflare Workers Free 驗證 + GitHub 公開照片。不要升級 Firebase Blaze，不使用付費 Storage。

已部署的服務：`https://school3d-upload.teacher-hsieh.workers.dev`。

## 最後需要帳號擁有人設定

1. 在 GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens 新增專用權杖。
2. 名稱 `school3d-photo-upload`，選合理有效期（例如 90 天），Repository access 僅選 `panggihsieh/school3d-site`；Repository permissions 只設定 Contents: Read and write。不要授予全帳號或 Workflow 權限。
3. 在 Cloudflare `school3d-upload` → Settings → Variables and Secrets，新增類型 Secret，名稱 `GITHUB_TOKEN`，值貼上該權杖，部署。不要放在 GitHub、前端、截圖或聊天中。
4. 開啟 `field.html`，以 teacher.hsieh@gmail.com 登入，選樹、確認編號、拍照後上傳。
5. 驗收真實管理員可以寫入、其他帳號被拒絕、重試不重複、GitHub 部署完成後前台照片出現。現地 GPS、Safari 相機與朗讀需要使用者的 iPhone 實測。

程式在 Worker 端以 Google 公開金鑰驗證 Firebase JWT 的簽章、來源專案、期限、已驗證管理員信箱與 Google 登入方式。不信任前端自報帳號。GitHub 只寫固定的 `dist/assets/uploads/<UUID>.jpg` 與 `dist/public-photos.json`，一次 commit，同時上傳衝突不覆寫。每張 JPEG 最多 650000 bytes；相簿上限 1500 張，需另保留儲存空間給網站本身。

前端 GPS 精確位置不會送到 Worker。Canvas 重新編碼移除原圖 EXIF；公開檔只含照片、樹木編號、種類、說明與發布時間。原圖請另行備份。照片使用 IndexedDB 保留草稿，不能當作永久備份。後台沒有自動 AI 辨識；以官方樹木座標列候選並由管理員確認。

建置與測試：`npm ci`、`npm test`、`npm run build`。`worker.bundle.js` 可貼到 Cloudflare Quick Edit；以 `wrangler deploy` 部署時使用 worker.js 與 wrangler.toml。`dist/field-config.js` 只包含公開 Worker URL。

Worker 免費額度超過時應停止服務，請維持 Free 方案。GitHub 公開歷史會保留已發布檔案，即使日後移除也可能仍存在歷史中。
