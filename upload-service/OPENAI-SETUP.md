# 教師 Sol 問答啟用

已實作 GPT-6.1 Sol 文字／照片串流問答，搭配瀏覽器語音辨識與朗讀。連續語音是逐輪問答，不是原生 Realtime 音訊／影片直播。瀏覽器語音辨識可能需要連網，麥克風僅在老師操作後啟動。

## 由帳號擁有人設定

1. 在 OpenAI API 專案建立具 Responses API 與 gpt-6.1-sol 使用權的 API Key，確認 API 額度並設定專案預算警示。不要將 Key 貼到聊天或前端。
2. 在 Cloudflare 的既有 `school3d-upload` Worker → Settings → Variables and Secrets，新增 **Secret** `OPENAI_API_KEY`。
3. 將本專案新版 `worker.bundle.js` 部署到同一 Worker；或在登入 Cloudflare 的終端於 upload-service/ 執行 `npx wrangler deploy`。保留既有 GITHUB_TOKEN 等 Secret、網域與設定，不建立替代 Worker。
4. 以 teacher.hsieh@gmail.com 登入 field.html，確認看到「教師 AI 對話 · GPT-6.1 Sol」。先測文字，再測附圖，最後在支援語音辨識的瀏覽器測麥克風與連續語音。

此環境的 Wrangler 未登入，無法代替帳號擁有人部署 Worker 或設定 Secret。GitHub Pages 發布前端並不會更新 Cloudflare Worker。

## 行為與資料

- `/ai/chat` 在呼叫 OpenAI 前驗證 Firebase 簽章、已驗證管理員信箱與 Google 登入方式，僅接受原網站 Origin。
- 金鑰只存在 Worker Secret。模型固定 gpt-6.1-sol，不能由前端改模型或工具。
- 每次最多 2000 字問題、12 則近期文字訊息、一張約 650 KB 壓縮 JPEG；輸出最多 1600 tokens。這些是單次限制，不是每日費用硬上限。
- 不轉送目前 GPS；會轉送選取植物的白名單資料、問題、近期對話及主動附加的照片。照片只在本次 AI 請求使用，不自動公開到 GitHub；後續訊息只保留文字歷史，不保留前次照片。
- Responses 設定 store:false。此設定不代表所有供應商資料保留均停用，仍應依帳號資料政策處理。
- 對話僅存在目前頁面記憶體；切換植物或登出會清除，背景或離開頁面會停止語音與請求。照片分析僅供候選辨識，教師須確認。
- 未設定 Key 回傳 503 說明；未部署新版 Worker 可能回傳 404。錯誤不自動重試，以免反覆產生費用。

## 測試

`npm ci`、`npm test`、`npm run build`。測試使用模擬 OpenAI 回應，不產生付費呼叫；正式金鑰、真實串流與實機麥克風仍需啟用後驗收。
