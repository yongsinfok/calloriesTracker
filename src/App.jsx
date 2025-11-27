import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Utensils, Flame, Droplets, Wheat, Candy, Activity, ScanLine, AlertCircle, Settings, X, Key, History, Trash2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

function App() {
    const [image, setImage] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '');
    const [multiAnalysis, setMultiAnalysis] = useState(() => localStorage.getItem('multi_analysis') === 'true');
    const [analysisHistory, setAnalysisHistory] = useState(() => {
        const saved = localStorage.getItem('analysis_history');
        return saved ? JSON.parse(saved) : [];
    });
    const [portionAdjustment, setPortionAdjustment] = useState(100);
    const [referenceObject, setReferenceObject] = useState('none');
    const [showHistory, setShowHistory] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('gemini_api_key', apiKey);
        }
    }, [apiKey]);

    useEffect(() => {
        localStorage.setItem('multi_analysis', multiAnalysis);
    }, [multiAnalysis]);

    useEffect(() => {
        localStorage.setItem('analysis_history', JSON.stringify(analysisHistory));
    }, [analysisHistory]);

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
        setPortionAdjustment(100);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    temperature: 0,
                    topK: 1,
                    topP: 1,
                }
            });

            const base64Data = image.split(',')[1];
            const mimeType = image.split(';')[0].split(':')[1];

            const referenceInfo = {
                'none': '',
                'coin': '\n\nREFERENCE OBJECT: There is a coin in the image for size reference. A standard coin is approximately 24mm in diameter. Use this to accurately estimate the portion size.',
                'phone': '\n\nREFERENCE OBJECT: There is a smartphone in the image for size reference. A standard smartphone is approximately 15cm tall. Use this to accurately estimate the portion size.',
                'hand': '\n\nREFERENCE OBJECT: A human hand is visible in the image for size reference. An average adult hand is approximately 18-20cm long. Use this to accurately estimate the portion size.',
                'chopsticks': '\n\nREFERENCE OBJECT: Chopsticks are visible in the image for size reference. Standard chopsticks are approximately 23-25cm long. Use this to accurately estimate the portion size.'
            };

            const prompt = `You are a professional nutritionist and food analyst. Analyze this food image with precision and consistency.

TASK:
1. Identify the specific food items in the image
2. Estimate the portion size (in grams or standard serving units)
3. Calculate nutritional values based on standard food databases (USDA, nutrition tables)

ESTIMATION GUIDELINES:
- Use visual cues to estimate portion size (compare to standard plate size ~26cm diameter, utensils, or common objects)
- For mixed dishes, identify and estimate each component separately, then sum the totals
- Base calculations on standard nutritional databases (e.g., USDA FoodData Central)
- Be conservative and realistic in estimates - avoid overestimating or underestimating
- Consider cooking methods (fried foods have more fat/calories than steamed)${referenceInfo[referenceObject]}

PORTION SIZE REFERENCE:
- 1 cup cooked rice ≈ 200g ≈ 200 calories
- 1 medium chicken breast ≈ 150g ≈ 165 calories
- 1 tablespoon oil ≈ 14g ≈ 120 calories
- 1 medium apple ≈ 180g ≈ 95 calories

OUTPUT FORMAT:
Return ONLY a valid JSON object with NO markdown formatting, NO backticks, NO code blocks.
The JSON must have these exact keys:

{
  "foodName": "specific food name in Chinese (e.g., 紅燒牛肉麵, 炒飯, 水果沙拉)",
  "portionSize": "estimated portion (e.g., 1碗約300g, 1份約250g)",
  "calories": <number: total calories in kcal>,
  "protein": <number: grams, 1 decimal place>,
  "carbs": <number: grams, 1 decimal place>,
  "fat": <number: grams, 1 decimal place>,
  "fiber": <number: grams, 1 decimal place>,
  "sugar": <number: grams, 1 decimal place>,
  "confidence": <number: 0-100, your confidence level in this estimate>
}

IMPORTANT:
- All numeric values must be numbers, not strings
- Round to 1 decimal place for macronutrients
- If the image is NOT food, return: {"error": "Not food detected"}
- Be consistent: the same food in the same portion should yield the same results

Analyze the image now and return the JSON:`;

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            };

            const analysisCount = multiAnalysis ? 3 : 1;
            const results = [];

            for (let i = 0; i < analysisCount; i++) {
                const result = await model.generateContent([prompt, imagePart]);
                const response = await result.response;
                const text = response.text();
                const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const data = JSON.parse(cleanText);

                if (!data.error) {
                    results.push(data);
                }
            }

            if (results.length === 0) {
                setError("無法識別為食物，請試著上傳更清晰的食物照片。");
                return;
            }

            const avgResult = {
                foodName: results[0].foodName,
                portionSize: results[0].portionSize,
                calories: Math.round(results.reduce((sum, r) => sum + r.calories, 0) / results.length),
                protein: parseFloat((results.reduce((sum, r) => sum + r.protein, 0) / results.length).toFixed(1)),
                carbs: parseFloat((results.reduce((sum, r) => sum + r.carbs, 0) / results.length).toFixed(1)),
                fat: parseFloat((results.reduce((sum, r) => sum + r.fat, 0) / results.length).toFixed(1)),
                fiber: parseFloat((results.reduce((sum, r) => sum + r.fiber, 0) / results.length).toFixed(1)),
                sugar: parseFloat((results.reduce((sum, r) => sum + r.sugar, 0) / results.length).toFixed(1)),
                confidence: Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length),
                analysisCount: results.length,
                timestamp: new Date().toISOString(),
                imageData: image
            };

            setResult(avgResult);
            setAnalysisHistory(prev => [avgResult, ...prev].slice(0, 20));

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

    const loadHistoryItem = (item) => {
        setImage(item.imageData);
        setResult(item);
        setPortionAdjustment(100);
        setShowHistory(false);
    };

    const clearHistory = () => {
        if (confirm('確定要清除所有歷史記錄嗎?')) {
            setAnalysisHistory([]);
        }
    };

    return (
        <div className="container">
            <header className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="title">NutriScan AI</h1>
                    <p className="subtitle">智能食物營養識別分析</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setShowHistory(true)}
                        className="glass-card"
                        style={{ padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}
                    >
                        <History size={20} color="var(--text-secondary)" />
                        {analysisHistory.length > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: 'var(--accent-primary)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                            }}>
                                {analysisHistory.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="glass-card"
                        style={{ padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Settings size={20} color="var(--text-secondary)" />
                    </button>
                </div>
            </header>

            {showHistory && (
                <div className="animate-fade-in" style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '600px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button
                            onClick={() => setShowHistory(false)}
                            style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}
                        >
                            <X size={24} color="var(--text-secondary)" />
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <History size={24} color="var(--accent-primary)" />
                                分析歷史
                            </h2>
                            {analysisHistory.length > 0 && (
                                <button
                                    onClick={clearHistory}
                                    style={{
                                        padding: '8px 12px',
                                        background: 'rgba(248, 113, 113, 0.2)',
                                        border: '1px solid rgba(248, 113, 113, 0.3)',
                                        borderRadius: '8px',
                                        color: '#f87171',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <Trash2 size={16} />
                                    清除全部
                                </button>
                            )}
                        </div>

                        {analysisHistory.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                                還沒有分析記錄
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {analysisHistory.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => loadHistoryItem(item)}
                                        className="glass-card"
                                        style={{
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            ':hover': { transform: 'translateY(-2px)' }
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <img
                                                src={item.imageData}
                                                alt={item.foodName}
                                                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{item.foodName}</h3>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                    {new Date(item.timestamp).toLocaleString('zh-TW')}
                                                </p>
                                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                                                    <span style={{ color: '#fbbf24' }}>🔥 {item.calories} kcal</span>
                                                    <span style={{ color: '#4ade80' }}>P: {item.protein}g</span>
                                                    <span style={{ color: '#f87171' }}>C: {item.carbs}g</span>
                                                    <span style={{ color: '#fbbf24' }}>F: {item.fat}g</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                            設置
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

                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={multiAnalysis}
                                    onChange={(e) => setMultiAnalysis(e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <div>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>多次分析模式</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        自動分析 3 次並取平均值，提升準確性（消耗更多 API 配額）
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                參考物體（可選）
                            </label>
                            <select
                                value={referenceObject}
                                onChange={(e) => setReferenceObject(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="none">無參考物體</option>
                                <option value="coin">硬幣 (24mm)</option>
                                <option value="phone">手機 (15cm)</option>
                                <option value="hand">手掌 (18-20cm)</option>
                                <option value="chopsticks">筷子 (23-25cm)</option>
                            </select>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                如果照片中包含參考物體，選擇它可以提升份量估算的準確性
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
                                    <p style={{ marginTop: '1rem', fontWeight: 600 }}>
                                        正在分析圖像{multiAnalysis && ' (3次取平均)'}...
                                    </p>
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
                                {result.portionSize && (
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        份量: {result.portionSize}
                                    </p>
                                )}
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>AI 估算營養成分</p>
                                {result.confidence && (
                                    <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '12px', background: result.confidence >= 80 ? 'rgba(74, 222, 128, 0.2)' : result.confidence >= 60 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(248, 113, 113, 0.2)' }}>
                                        <span style={{ fontSize: '0.75rem', color: result.confidence >= 80 ? '#4ade80' : result.confidence >= 60 ? '#fbbf24' : '#f87171', fontWeight: '600' }}>
                                            置信度: {result.confidence}%
                                        </span>
                                    </div>
                                )}
                                {result.analysisCount > 1 && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        ✓ 已分析 {result.analysisCount} 次並取平均值
                                    </p>
                                )}
                            </div>

                            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>調整份量</label>
                                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{portionAdjustment}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="25"
                                    max="200"
                                    step="5"
                                    value={portionAdjustment}
                                    onChange={(e) => setPortionAdjustment(Number(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    <span>25%</span>
                                    <span>100%</span>
                                    <span>200%</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                                <div style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '8px', borderRadius: '50%' }}>
                                    <Flame size={24} color="#fbbf24" />
                                </div>
                                <div>
                                    <p className="stat-label">總熱量</p>
                                    <p className="stat-value" style={{ color: '#fbbf24' }}>{Math.round(result.calories * portionAdjustment / 100)} kcal</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid-2">
                            <NutrientCard
                                icon={<Activity size={20} color="#4ade80" />}
                                label="蛋白質"
                                value={`${(result.protein * portionAdjustment / 100).toFixed(1)}g`}
                                color="rgba(74, 222, 128, 0.1)"
                            />
                            <NutrientCard
                                icon={<Wheat size={20} color="#f87171" />}
                                label="碳水化合物"
                                value={`${(result.carbs * portionAdjustment / 100).toFixed(1)}g`}
                                color="rgba(248, 113, 113, 0.1)"
                            />
                            <NutrientCard
                                icon={<Droplets size={20} color="#fbbf24" />}
                                label="脂肪"
                                value={`${(result.fat * portionAdjustment / 100).toFixed(1)}g`}
                                color="rgba(251, 191, 36, 0.1)"
                            />
                            <NutrientCard
                                icon={<ScanLine size={20} color="#38bdf8" />}
                                label="纖維"
                                value={`${(result.fiber * portionAdjustment / 100).toFixed(1)}g`}
                                color="rgba(56, 189, 248, 0.1)"
                            />
                            <NutrientCard
                                icon={<Candy size={20} color="#e879f9" />}
                                label="糖分"
                                value={`${(result.sugar * portionAdjustment / 100).toFixed(1)}g`}
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
