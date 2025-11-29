import React, { useState, useEffect } from 'react';
import { GeneratedImage, GenerationStep, MarketingCardData, XiaohongshuContent } from './types';
import { generateCardImage, generateMarketingCopy, fetchTrendingTopics, fetchViralStrategies } from './services/geminiService';
import { PosterCard } from './components/PosterCard';
import { LoadingScreen } from './components/LoadingScreen';
import { Zap, LayoutGrid, ChevronRight, Sparkles, TrendingUp, ArrowUpRight, Target, Download, Loader2, Copy, Check, RefreshCw, Search } from 'lucide-react';
import { toPng } from 'html-to-image';

// Initial Static Pools (Fallbacks)
const INITIAL_TOPIC_POOL = [
    "🤖 AI视频元年", "🎬 短剧出海热潮", "📉 降本增效", "🌸 繁花王家卫美学",
    "📖 情感叙事营销", "🎨 多巴胺配色", "🏙️ 赛博朋克视觉", "🧘 松弛感生活",
    "🎥 Sora震撼发布", "🦄 AIGC独角兽", "📱 竖屏美学", "🕹️ 像素风复古",
    "🌿 环保可持续", "🐉 国潮新风尚", "🎭 虚拟人带货", "🐕 萌宠经济",
    "💤 助眠ASMR", "🏕️ City Walk", "💰 银发经济", "🧠 脑机接口"
];

const INITIAL_STRATEGY_POOL = [
    { title: "复刻《繁花》光影", desc: "用自然语言搜索王家卫式抽帧与色彩，生成致敬海报。" },
    { title: "3分钟拆解爆款", desc: "利用视频理解能力，快速提炼反转结构，生成拉片分镜。" },
    { title: "Y2K千禧年素材", desc: "精准定位复古DV画质与低保真镜头，打造复古营销物料。" },
    { title: "情绪价值封面", desc: "搜索'日落'、'海边背影'、'胶片颗粒'，营造高氛围感封面。" }
];

// Copy Button Component
const CopyButton: React.FC<{ text: string, label?: string }> = ({ text, label }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors text-xs font-bold"
            title="复制"
        >
            {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
            {label && <span>{label}</span>}
        </button>
    );
};

const App: React.FC = () => {
  const [step, setStep] = useState<GenerationStep>(GenerationStep.IDLE);
  const [cards, setCards] = useState<MarketingCardData[]>([]);
  const [xhsData, setXhsData] = useState<XiaohongshuContent | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [inspiration, setInspiration] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Live Data State
  const [topics, setTopics] = useState<string[]>(INITIAL_TOPIC_POOL);
  const [strategies, setStrategies] = useState<{title: string, desc: string}[]>(INITIAL_STRATEGY_POOL);
  
  // Loading states for refresh
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);

  const getCardImage = (id: number) => images.find(img => img.cardId === id)?.imageUrl;

  const handleGenerate = async () => {
    setStep(GenerationStep.GENERATING_COPY);
    setLoadingMsg('正在分析趋势并撰写文案...');
    setCards([]);
    setImages([]);
    setXhsData(null);

    try {
      const response = await generateMarketingCopy(inspiration);
      setXhsData(response.xiaohongshu);
      setCards(response.cards as MarketingCardData[]);
      
      setStep(GenerationStep.GENERATING_IMAGES);
      setLoadingMsg('正在渲染未来感视觉...');
      processImageQueue(response.cards as MarketingCardData[]);

    } catch (error) {
      console.error(error);
      setStep(GenerationStep.ERROR);
      alert("生成内容失败。请检查API密钥或重试。");
    }
  };

  const processImageQueue = async (cardList: MarketingCardData[]) => {
    for (const card of cardList) {
        try {
            const imageUrl = await generateCardImage(card.visualPrompt);
            setImages(prev => [...prev, { cardId: card.id, imageUrl }]);
        } catch (e) {
            console.error(`Failed image for card ${card.id}`, e);
        }
    }
    setStep(GenerationStep.COMPLETE);
  };

  const regenerateSingleImage = async (cardId: number, prompt: string) => {
    const tempImages = images.filter(img => img.cardId !== cardId);
    setImages(tempImages);

    try {
        const newUrl = await generateCardImage(prompt);
        setImages(prev => [...prev, { cardId, imageUrl: newUrl }]);
    } catch (e) {
        console.error(e);
    }
  };

  const handleTopicClick = (topic: string) => {
    setInspiration(topic);
  };

  const handleStrategyClick = (strategyTitle: string) => {
      setInspiration(`基于思路：${strategyTitle}。生成相关营销海报。`);
  };

  const handleDownloadAll = async () => {
      setIsDownloading(true);
      const cardIds = cards.map(c => c.id);
      
      try {
        await document.fonts.ready;
        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (const id of cardIds) {
            const element = document.getElementById(`poster-card-${id}`);
            if (element) {
                try {
                    // Small delay between downloads to prevent browser throttling
                    if (id > 1) await wait(300);
                    
                    const options = { 
                        cacheBust: true, 
                        pixelRatio: 2, 
                        useCORS: true, 
                        backgroundColor: '#ffffff',
                        filter: (node: HTMLElement) => !node.classList?.contains('download-btn-exclude')
                    };

                    // Double capture technique for reliable font rendering
                    await toPng(element, options); // Warmup
                    await wait(100);
                    const dataUrl = await toPng(element, options); // Actual

                    const link = document.createElement('a');
                    link.download = `闪灵AI-营销海报-${id}.png`;
                    link.href = dataUrl;
                    link.click();
                } catch (err) {
                    console.error(`Could not download card ${id}`, err);
                }
            }
        }
      } catch (error) {
          console.error("Batch download failed", error);
      } finally {
        setIsDownloading(false);
      }
  };

  // Helper to get formatted hashtags (ensure single hash)
  const getFormattedTags = (tags: string[]) => tags.map(t => `#${t.replace(/^#/, '')}`).join(' ');

  // Refresh Handlers
  const refreshTopics = async () => {
    setIsLoadingTopics(true);
    const newTopics = await fetchTrendingTopics();
    if (newTopics && newTopics.length > 0) {
        setTopics(newTopics);
    }
    setIsLoadingTopics(false);
  };

  const refreshStrategies = async () => {
    setIsLoadingStrategies(true);
    const newStrategies = await fetchViralStrategies();
    if (newStrategies && newStrategies.length > 0) {
        setStrategies(newStrategies);
    }
    setIsLoadingStrategies(false);
  };

  if (step === GenerationStep.IDLE) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-blue-100 to-white blur-3xl opacity-60 z-0"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[#002FA7]/10 to-transparent blur-3xl z-0"></div>

        <div className="relative z-10 container mx-auto px-6 py-12 flex flex-col items-center text-center">
            <div className="mb-6 p-6 rounded-[2rem] bg-white shadow-2xl border border-gray-100 inline-block rotate-3 hover:rotate-0 transition-transform duration-500">
                <Zap className="w-16 h-16 text-[#002FA7] mx-auto fill-current" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-3 tracking-tighter text-[#1D1D1F]">
                闪灵 AI
            </h1>
            <p className="text-xl md:text-2xl font-light text-[#002FA7] tracking-widest mb-8 uppercase">
                Marketing Generator
            </p>

            <div className="w-full max-w-2xl mb-8 relative group text-left">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-200 to-[#002FA7]/30 rounded-3xl opacity-30 group-hover:opacity-60 transition duration-500 blur-sm"></div>
                <div className="relative bg-white rounded-3xl p-1 shadow-xl">
                    <div className="flex items-center space-x-2 px-4 py-3 border-b border-gray-100">
                        <Sparkles className="w-4 h-4 text-[#002FA7]" />
                        <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">灵感输入 / Prompt</span>
                    </div>
                    <textarea
                        value={inspiration}
                        onChange={(e) => setInspiration(e.target.value)}
                        placeholder="输入您的想法：例如 '更具故事性'，'结合繁花热点'，或 '强调视频搜索效率'..."
                        className="w-full p-4 text-gray-700 placeholder-gray-300 bg-transparent border-none outline-none resize-none h-28 text-lg rounded-b-2xl"
                    />
                </div>
            </div>

            <button 
                onClick={handleGenerate}
                className="group relative px-10 py-5 bg-[#002FA7] text-white font-bold text-lg rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl hover:shadow-blue-900/30 z-20 mb-12"
            >
                <span className="relative z-10 flex items-center">
                    生成今日物料 <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
            </button>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Hot Topics Section */}
                <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 opacity-80">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[#002FA7]" />
                            <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">热点灵感推荐</span>
                        </div>
                        <button 
                            onClick={refreshTopics}
                            disabled={isLoadingTopics}
                            className="p-1.5 rounded-full hover:bg-white/60 text-gray-400 hover:text-[#002FA7] transition-all disabled:opacity-50"
                            title="全网搜索最新热点"
                        >
                            {isLoadingTopics ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 content-start">
                        {isLoadingTopics ? (
                            <div className="w-full py-8 text-center text-xs text-gray-400">正在搜索小红书热点...</div>
                        ) : (
                            topics.slice(0, 15).map((topic, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleTopicClick(topic)}
                                    className="group flex items-center bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md hover:border-blue-100 hover:text-[#002FA7] active:scale-95 transition-all duration-200"
                                >
                                    <span className="text-sm font-medium text-gray-600 group-hover:text-[#002FA7]">{topic}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Viral Strategies Section */}
                <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-sm h-full">
                    <div className="flex items-center justify-between mb-4 opacity-80">
                         <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-[#002FA7]" />
                            <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">爆款思路参考</span>
                        </div>
                         <button 
                            onClick={refreshStrategies}
                            disabled={isLoadingStrategies}
                            className="p-1.5 rounded-full hover:bg-white/60 text-gray-400 hover:text-[#002FA7] transition-all disabled:opacity-50"
                            title="全网搜索爆款玩法"
                        >
                             {isLoadingStrategies ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                    <div className="space-y-3">
                        {isLoadingStrategies ? (
                            <div className="w-full py-8 text-center text-xs text-gray-400">正在分析爆款视频玩法...</div>
                        ) : (
                            strategies.map((strat, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleStrategyClick(strat.title)}
                                    className="w-full text-left group bg-white border border-gray-100 p-3 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 flex items-start gap-3 active:scale-95"
                                >
                                    <div className="mt-1 min-w-[1.5rem] h-6 w-6 bg-blue-50 text-[#002FA7] rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 group-hover:text-[#002FA7] transition-colors">{strat.title}</h4>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{strat.desc}</p>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (step === GenerationStep.GENERATING_COPY) {
    return <LoadingScreen status={loadingMsg} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] pb-12 font-sans selection:bg-[#002FA7] selection:text-white">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-[#002FA7] rounded-md flex items-center justify-center text-white">
                     <Zap className="w-4 h-4 fill-current" />
                </div>
                <span className="font-bold tracking-tight text-lg">SHINING AI</span>
            </div>
            <button 
                onClick={() => setStep(GenerationStep.IDLE)}
                className="text-xs font-bold text-gray-400 hover:text-[#002FA7] transition-colors uppercase tracking-widest"
            >
                返回首页
            </button>
        </header>

        <main className="container mx-auto px-4 pt-10">
            {/* Xiaohongshu Section */}
            {xhsData && (
                <div className="mb-10 p-6 bg-white rounded-3xl shadow-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-md">小红书</span>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Social Media Copy</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <span className="text-xs font-bold text-gray-400 w-16 mt-1 shrink-0">TITLE</span>
                            <div className="flex-1 font-bold text-lg text-gray-800 flex items-center justify-between">
                                <span>{xhsData.title}</span>
                                <CopyButton text={xhsData.title} label="复制标题" />
                            </div>
                        </div>
                        
                        <div className="flex items-start border-t border-gray-100 pt-4">
                            <span className="text-xs font-bold text-gray-400 w-16 mt-1 shrink-0">CONTENT</span>
                            <div className="flex-1">
                                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-4">
                                    {xhsData.content}
                                </div>
                                <div className="text-blue-600 font-bold text-sm mb-3">
                                    {getFormattedTags(xhsData.tags)}
                                </div>
                                <CopyButton 
                                    text={`${xhsData.content}\n\n${getFormattedTags(xhsData.tags)}`} 
                                    label="一键复制正文+标签" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-end mb-8 px-2 gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight mb-2">今日产出</h2>
                    <div className="flex items-center text-gray-500 font-medium text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {new Date().toLocaleDateString('zh-CN')} • 4 份营销物料
                    </div>
                </div>
                
                <div className="flex gap-4">
                     {step === GenerationStep.GENERATING_IMAGES && (
                        <div className="flex items-center space-x-3 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
                            <div className="relative w-3 h-3">
                                    <span className="absolute inset-0 bg-[#002FA7] rounded-full opacity-20 animate-ping"></span>
                                    <span className="relative block w-3 h-3 bg-[#002FA7] rounded-full"></span>
                            </div>
                            <span className="text-xs font-bold text-[#002FA7]">图像渲染中...</span>
                        </div>
                    )}

                    <button 
                        onClick={handleDownloadAll}
                        disabled={isDownloading || step !== GenerationStep.COMPLETE}
                        className={`flex items-center px-5 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all
                            ${isDownloading || step !== GenerationStep.COMPLETE 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                : 'bg-[#002FA7] text-white hover:bg-blue-800 hover:shadow-xl active:scale-95'
                            }`}
                    >
                        {isDownloading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                下载中...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                一键下载全部
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {cards.map((card) => (
                    <PosterCard 
                        key={card.id} 
                        data={card} 
                        imageUrl={getCardImage(card.id)}
                        isGeneratingImage={!getCardImage(card.id)}
                        onRegenerateImage={() => regenerateSingleImage(card.id, card.visualPrompt)}
                    />
                ))}
            </div>
        </main>
    </div>
  );
};

export default App;