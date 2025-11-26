# 🍽️ NutriScan AI - 智能食物營養識別分析

一個基於 AI 的食物營養分析 PWA (Progressive Web App)，使用 Google Gemini Vision API 識別食物並估算營養成分。

![NutriScan AI](https://img.shields.io/badge/React-18.3-blue) ![Vite](https://img.shields.io/badge/Vite-6.0-purple) ![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5--flash-orange)

## ✨ 功能特點

- 📸 **圖像識別**：上傳或拍攝食物照片進行分析
- 🤖 **AI 驅動**：使用 Google Gemini 2.5 Flash 模型進行智能識別
- 📊 **營養分析**：自動估算以下營養成分：
  - 🔥 熱量 (Calories)
  - 💪 蛋白質 (Protein)
  - 🍞 碳水化合物 (Carbohydrates)
  - 🥑 脂肪 (Fat)
  - 🌾 纖維 (Fiber)
  - 🍬 糖分 (Sugar)
- 🎨 **現代化 UI**：採用深色模式、玻璃擬態設計和流暢動畫
- 📱 **PWA 支持**：可安裝到手機主屏幕，支持離線使用
- 🌐 **響應式設計**：完美適配移動設備和桌面端

## 🚀 快速開始

### 前置要求

- Node.js 16+ 
- npm 或 yarn
- Google AI Studio API Key ([獲取 API Key](https://makersuite.google.com/app/apikey))

### 安裝步驟

1. **克隆項目**
```bash
git clone https://github.com/yongsinfok/calloriesTracker.git
cd calloriesTracker
```

2. **安裝依賴**
```bash
npm install
```

3. **配置環境變量**

在項目根目錄創建 `.env` 文件，並添加您的 Google Gemini API Key：

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

4. **啟動開發服務器**
```bash
npm run dev
```

5. **打開瀏覽器**

訪問 `http://localhost:5173` 即可使用應用。

## 📦 構建部署

### 生產環境構建

```bash
npm run build
```

構建完成後，`dist` 文件夾包含可部署的靜態文件。

### 預覽構建結果

```bash
npm run preview
```

### 部署到 Vercel

1. 安裝 Vercel CLI：
```bash
npm install -g vercel
```

2. 部署：
```bash
vercel
```

3. 在 Vercel 項目設置中添加環境變量 `VITE_GEMINI_API_KEY`。

## 🛠️ 技術棧

- **前端框架**: React 18.3
- **構建工具**: Vite 6.0
- **AI 模型**: Google Gemini 2.5 Flash
- **UI 圖標**: Lucide React
- **PWA**: vite-plugin-pwa
- **樣式**: Vanilla CSS (Glassmorphism + Dark Mode)

## 📱 使用方法

1. **上傳照片**：點擊上傳區域選擇食物照片（或在移動設備上直接拍照）
2. **開始分析**：點擊「開始分析」按鈕
3. **查看結果**：AI 會識別食物名稱並顯示詳細的營養成分

## ⚠️ 注意事項

- 本應用使用前端直接調用 Google Gemini API，API Key 會暴露在客戶端代碼中
- 建議僅用於個人項目或演示用途
- 生產環境建議通過後端服務器轉發 API 請求以保護 API Key
- 營養數據為 AI 估算值，僅供參考

## 📄 項目結構

```
calloriesTracker/
├── src/
│   ├── App.jsx          # 主應用組件
│   ├── index.css        # 全局樣式
│   └── main.jsx         # 應用入口
├── public/              # 靜態資源
├── .env                 # 環境變量（需自行創建）
├── vite.config.js       # Vite 配置
└── package.json         # 項目依賴
```

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📝 License

MIT License

## 👨‍💻 作者

Created by [yongsinfok](https://github.com/yongsinfok)

---

⭐ 如果這個項目對您有幫助，請給個 Star！
