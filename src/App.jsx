import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Loader2, Utensils, Flame, Droplets, Wheat, Candy, Activity, ScanLine, AlertCircle, Settings, X, Key } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

function App() {
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    }
  }, [apiKey]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current.click();
  };

  const analyzeImage = async () => {
    if (!image) return;
    if (!apiKey) {
      setShowSettings(true);
      setError("請先設置您的 Gemini API Key 才能開始使用");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Prepare image for API
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const prompt = `Analyze this image of food. Identify the food and estimate its nutritional content. 
      Return ONLY a valid JSON object with no markdown formatting or backticks. 
      The JSON object must have these keys:
      - "calories": number (estimated total calories)
      - "protein": number (grams)
      - "carbs": number (grams)
      - "fat": number (grams)
      - "fiber": number (grams)
      - "sugar": number (grams)
      - "foodName": string (short name of the food identified)
      
      If the image is not food, return {"error": "Not food detected"}`;

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Clean up the response text in case it contains markdown code blocks
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanText);

      if (data.error) {
        setError("無法識別為食物，請試著上傳更清晰的食物照片。");
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(`分析失敗: ${err.message || err.toString()}. 請檢查您的 API Key 是否正確。`);
      if (err.message.includes('API key')) {
        setShowSettings(true);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="container">
      <header className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="title">NutriScan AI</h1>
          <p className="subtitle">智能食物營養識別分析</p>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="glass-card"
          style={{ padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Settings size={20} color="var(--text-secondary)" />
        </button>
      </header>

      {showSettings && (
        <div className="animate-fade-in" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button 
              onClick={() => setShowSettings(false)}
              style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={24} color="var(--text-secondary)" />
            </button>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key size={24} color="var(--accent-primary)" />
              API 設置
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API Key"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                您的 Key 僅存儲在本地瀏覽器中，不會發送到我們的服務器。
                <br />
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                  獲取免費 API Key
                </a>
              </p>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%' }}
              onClick={() => setShowSettings(false)}
            >
              保存並繼續
            </button>
          </div>
        </div>
      )}

      <main className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="glass-card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          {image ? (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
              <img src={image} alt="Food preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
              {analyzing && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: 'white'
                }}>
                  <ScanLine className="animate-pulse" size={48} color="#38bdf8" />
                  <p style={{ marginTop: '1rem', fontWeight: 600 }}>正在分析圖像...</p>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={triggerUpload}
              style={{
                border: '2px dashed var(--glass-border)',
                borderRadius: '12px',
                padding: '3rem 1rem',
                cursor: 'pointer',
                marginBottom: '1rem',
                transition: 'border-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              <Utensils size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>點擊上傳或拍攝食物照片</p>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden-input"
          />

          <div className="grid-2">
            <button className="btn-secondary" onClick={triggerUpload}>
              <Upload size={20} />
              {image ? '重新上傳' : '上傳照片'}
            </button>
            <button
              className="btn-primary"
              onClick={analyzeImage}
              disabled={!image || analyzing}
              style={{ opacity: (!image || analyzing) ? 0.5 : 1 }}
            >
              {analyzing ? <Loader2 className="animate-spin" size={20} /> : <Activity size={20} />}
              {analyzing ? '分析中' : '開始分析'}
            </button>
          </div>
        </div>

        {error && (
          <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem', background: 'rgba(248, 113, 113, 0.1)', borderColor: 'rgba(248, 113, 113, 0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle color="#f87171" size={24} />
            <p style={{ color: '#f87171' }}>{error}</p>
          </div>
        )}

        {result && (
          <div className="animate-fade-in">
            <div className="glass-card" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(129, 140, 248, 0.1))' }}>
              <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{result.foodName}</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>AI 估算營養成分</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '8px', borderRadius: '50%' }}>
                  <Flame size={24} color="#fbbf24" />
                </div>
                <div>
                  <p className="stat-label">總熱量</p>
                  <p className="stat-value" style={{ color: '#fbbf24' }}>{result.calories} kcal</p>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <NutrientCard
                icon={<Activity size={20} color="#4ade80" />}
                label="蛋白質"
                value={`${result.protein}g`}
                color="rgba(74, 222, 128, 0.1)"
              />
              <NutrientCard
                icon={<Wheat size={20} color="#f87171" />}
                label="碳水化合物"
                value={`${result.carbs}g`}
                color="rgba(248, 113, 113, 0.1)"
              />
              <NutrientCard
                icon={<Droplets size={20} color="#fbbf24" />}
                label="脂肪"
                value={`${result.fat}g`}
                color="rgba(251, 191, 36, 0.1)"
              />
              <NutrientCard
                icon={<ScanLine size={20} color="#38bdf8" />}
                label="纖維"
                value={`${result.fiber}g`}
                color="rgba(56, 189, 248, 0.1)"
              />
              <NutrientCard
                icon={<Candy size={20} color="#e879f9" />}
                label="糖分"
                value={`${result.sugar}g`}
                color="rgba(232, 121, 249, 0.1)"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NutrientCard({ icon, label, value, color }) {
  return (
    <div className="glass-card" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', background: color ? color : 'var(--glass-bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        <span className="stat-label">{label}</span>
      </div>
      <p className="stat-value" style={{ fontSize: '1.25rem' }}>{value}</p>
    </div>
  );
}

export default App;
