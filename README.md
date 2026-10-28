# 大南國小 3D 生態導覽

完整 3D 導覽：https://panggihsieh.github.io/school3d-site/

植物吸碳／維護排碳計算：https://panggihsieh.github.io/school3d-site/tree/

計算網站是獨立前端，位於此發布庫的 `dist/tree/`。維護活動排碳採使用者提供的活動量與係數，不預填係數，不將平台累積儲碳當作一年吸碳。計算資料可匯出 JSON，不會自動同步到 3D 網站。

純前端網站，包含校園空間、植物碳資訊、鳥類觀察與生態景點。此公開儲存庫只包含可發布的網站檔案與部署設定，不包含私人開發儲存庫的歷史、原始文件或執行資料。

網站使用相對路徑，支援 GitHub Pages 子路徑。修改 `dist/` 並推送到 `main` 後，由 GitHub Actions 部署。

植物資料來源：[教育部校園樹木資訊平臺－大南國小](https://edutreemap.moe.edu.tw/trees/#/Map?campusCode=104721)，2026-10-28 快照，127 株、46 種。3D 對位與樹冠造型為示意，平台估算儲碳不是每年吸碳量。

編輯資料只存在各自的瀏覽器，可用 JSON 匯出／匯入；沒有跨裝置同步或登入後台。現地勿使用鳥音引誘鳥類。

Third-party software: Three.js 0.180.0 (MIT), see `dist/vendor/THREE-LICENSE.txt`。原創模型僅供示意；教育部資料與 Google Earth 等外部來源的權利不在原創資產授權範圍內。
