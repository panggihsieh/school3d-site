export function seasonForMonth(month){
 if(!Number.isInteger(month)||month<1||month>12)throw Error('月份需為 1–12。');
 return month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
}
export function circumferenceToDbh(cm){
 if(!Number.isFinite(cm)||cm<=0||cm>2000)throw Error('請輸入 0 至 2000 cm 之間的正數胸圍。');
 return cm/Math.PI;
}
export function plantAnswer(p,question){
 const q=String(question).trim();if(!q)return '請先輸入或說出你的問題。';
 const name=p.species||p.name,number=(value,unit)=>value===null||value===undefined?'目前沒有資料':`${value} ${unit}`;
 if(/維護|排放|碳排|排碳/.test(q))return `${name}的年度維護排碳：${number(p.emissions,'kg CO₂e／年')}。澆水、修剪或運輸等活動可用活動量乘以有來源的排放係數估算；下方任務可以練習。`;
 if(/每年|一年|年度|年吸碳/.test(q))return `${name}的年度吸碳量：${number(p.uptake,'kg CO₂／年')}。平台的累積儲碳量不能當作每年吸碳量；年度比較還需要同年度的方法與來源。`;
 if(/胸圍|胸徑|直徑|多粗/.test(q))return `${name}的登錄胸徑是${number(p.dbh,'公分')}。若量到的是胸圍，胸徑等於胸圍除以圓周率。現場值與平台舊資料可能不同。`;
 if(/多高|樹高|高度/.test(q))return `${name}的登錄樹高是${number(p.height,'公尺')}，不是即時測量結果。`;
 if(/儲碳|碳量|吸碳/.test(q))return `${name}的平台估算儲碳是${number(p.sourceStockCO2e,'kg CO₂e')}。這是儲存量，不能直接解讀為一年的吸碳量。`;
 if(/葉|花|果|科名|學名|原生/.test(q))return `${name}。科名：${p.family||'待補'}；學名：${p.scientificName||'待補'}；葉形：${p.leafShape||'待補'}；花色：${p.flowerColor||'待補'}；果實：${p.fruit||'待補'}；來源分類：${p.origin||'待補'}。`;
 if(/介紹|是什麼|名字|樹種|你好/.test(q))return `這是${p.name}。樹高${number(p.height,'公尺')}，胸徑${number(p.dbh,'公分')}。你可以問我葉形、樹高、胸徑、儲碳與維護排碳，也可以完成下方的任務。`;
 return '目前以這株植物的資料回答固定主題，尚未連接生成式 AI。你可以問「介紹這棵樹」、「葉子長什麼樣」、「樹有多高」、「胸徑多少」、「每年吸碳多少」或「維護如何排碳」。';
}
export const carbonQuestions=[
 {id:'stock',question:'平台登錄儲碳 100 kg CO₂e，可以直接當作每年吸碳 100 kg 嗎？',options:['不行，儲存量與年度吸碳不同','可以，單位裡都有碳','除以樹齡就一定正確'],correct:0,explanation:'儲存量與年度流量不同；年度吸碳需要對應年度、方法與來源。'},
 {id:'maintenance',question:'教學假設：澆水用電 4 kWh，係數 0.5 kg CO₂e/kWh，維護排碳是多少？',options:['0.125 kg CO₂e','2 kg CO₂e','8 kg CO₂e'],correct:1,explanation:'4 × 0.5 = 2 kg CO₂e。這組係數僅供算術遊戲，不是現行官方係數。'},
 {id:'missing',question:'一棵樹沒有年度吸碳紀錄，應如何處理？',options:['填 0，就能完成全校比較','把平台儲碳直接搬過來','標示待補，補上年度方法與來源'],correct:2,explanation:'缺少資料不代表零，也不能用儲存量代替年度吸碳。'},
 {id:'diameter',question:'教學假設：樹幹胸圍約 31.4 cm，胸徑約為多少？',options:['10 cm','31.4 cm','98.6 cm'],correct:0,explanation:'胸徑 = 胸圍 ÷ π，約為 10 cm。'},
 {id:'comparison',question:'比較植物吸碳與維護排碳時，哪個做法正確？',options:['只要有兩個數字就相減','確認同年度、範圍與方法來源','把所有樹的缺值都補成零'],correct:1,explanation:'比較前需要確認資料完整、年度一致，且計算範圍與來源清楚。'}
];
