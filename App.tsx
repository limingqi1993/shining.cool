import React, { useState, useMemo } from 'react';
import { GeneratedImage, GenerationStep, MarketingCardData } from './types';
import { generateCardImage, generateMarketingCopy } from './services/geminiService';
import { PosterCard } from './components/PosterCard';
import { LoadingScreen } from './components/LoadingScreen';
import { Zap, LayoutGrid, ChevronRight, Sparkles, TrendingUp, ArrowUpRight, Target } from 'lucide-react';

// Large pool of topics for random selection
const TOPIC_POOL = [
    "🤖 AI视频元年", "🎬 短剧出海热潮", "📉 降本增效", "🌸 繁花王家卫美学",
    "📖 情感叙事营销", "🎨 多巴胺配色", "🏙️ 赛博朋克视觉", "🧘 松弛感生活",
    "🎥 Sora震撼发布", "🦄 AIGC独角兽", "📱 竖屏美学", "🕹️ 像素风复古",
    "🌿 环保可持续", "🐉 国潮新风尚", "🎭 虚拟人带货", "🐕 萌宠经济",
    "💤 助眠ASMR", "🏕️ City Walk", "💰 银发经济", "🧠 脑机接口",
    "🌌 元宇宙余温", "📸 胶片感复兴", "🎵 听觉营销", "🤖 具身智能",
    "👠 老钱风/静奢", "🍭 Y2K千禧风", "🧊 清冷感", "🔥 情绪价值", 
    "📦 开箱测评", "👀 黄金前三秒", "🔄 私域流量", "⚡ 病毒式传播",
    "🌈 极繁主义", "🕶️ 极简主义", "🎞️ 胶片质感", "🚀 生成式搜索",
    "💡 创意不仅是想法", "🎯 精准获客", "📈 转化率飙升", "🌟 打造个人IP",
    "🔮 赛博禅意", "🎋 新中式美学", "🎮 游戏化营销", "🤖 虚拟偶像",
    "📢 种草经济", "🧩 拼贴艺术", "🌊 酸性设计", "🤳 UGC共创",
    "🕰️ 怀旧营销", "🚀 第二曲线", "🧬 数字孪生", "🧿 裸眼3D"
];

// Strategies tailored for Shining AI features
const STRATEGY_POOL = [
    { title: "复刻《繁花》光影美学", desc: "用自然语言搜索王家卫式抽帧与色彩，一键生成致敬海报。" },
    { title: "3分钟拆解爆款短剧", desc: "利用视频理解能力，快速提炼反转结构，生成拉片分镜。" },
    { title: "寻找Y2K千禧年素材", desc: "精准定位复古DV画质与低保真镜头，打造复古营销物料。" },
    { title: "5分钟搞定比稿Moodboard", desc: "直接搜索抽象概念（如'五彩斑斓的黑'），AI自动排版输出。" },
    { title: "匹配网易云式深夜文案", desc: "搜索'孤独'、'城市夜景'、'破碎感'，为走心文案配好图。" },
    { title: "Sora风格科幻分镜搭建", desc: "在AI故事板中输入提示词，从零构建超现实主义视觉方案。" },
    { title: "甲方'要大气'的具象化", desc: "搜索航拍、广角、史诗感镜头，用画面定义'大气'。" },
    { title: "高转化率的黄金前三秒", desc: "分析高点击率视频开头，生成吸引眼球的封面创意。" },
    { title: "美妆种草视频去重", desc: "搜索'涂口红'、'试色'特定帧，规避同质化素材，找寻新颖运镜。" },
    { title: "科技发布会Keynote配图", desc: "搜索'极简几何'、'光束'、'粒子'，快速生成高大上PPT背景。" },
    { title: "美食探店Vlog脚本", desc: "用故事板功能，先排版'特写'、'全景'、'反应'镜头，再填入素材。" },
    { title: "情感博主治愈系封面", desc: "搜索'日落'、'海边背影'、'胶片颗粒'，营造高氛围感封面。" }
];

// Helper to get random items
const getRandomItems = <T,>(array: T[], count: number): T[] => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const App: React.FC = () => {
  const [step, setStep] = useState<GenerationStep>(GenerationStep.IDLE);
  const [cards, setCards] = useState<MarketingCardData[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [, setActiveCardIndex] = useState<number>(0);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [inspiration, setInspiration] = useState<string>('');

  // Get random content on every refresh/mount
  const randomTopics = useMemo(() => getRandomItems(TOPIC_POOL, 15), []);
  const randomStrategies = useMemo(() => getRandomItems(STRATEGY_POOL, 4), []);

  // Helper to find image for a card
  const getCardImage = (id: number) => images.find(img => img.cardId === id)?.imageUrl;

  const handleGenerate = async () => {
    setStep(GenerationStep.GENERATING_COPY);
    setLoadingMsg('正在分析趋势并撰写文案...');
    setCards([]);
    setImages([]);
    setActiveCardIndex(0);

    try {
      // 1. Generate Copy
      const generatedCards = await generateMarketingCopy(inspiration);
      setCards(generatedCards);
      
      // 2. Start Generating Images (Parallel-ish)
      setStep(GenerationStep.GENERATING_IMAGES);
      setLoadingMsg('正在渲染未来感视觉...');

      // We process image generation one by one to avoid rate limits or overwhelming the user
      // Also allows the user to see text immediately
      processImageQueue(generatedCards);

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
    // Optimistic UI update or loading state logic could go here
    // For now, we just overwrite the image
    const tempImages = images.filter(img => img.cardId !== cardId);
    setImages(tempImages); // Remove old image to show loading state in component

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

  // Intro Screen
  if (step === GenerationStep.IDLE) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col relative overflow-hidden font-sans">
        {/* Abstract Background - Minimalist */}
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-blue-100 to-white blur-3xl opacity-60 z-0"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[#002FA7]/10 to-transparent blur-3xl z-0"></div>

        <div className="relative z-10 container mx-auto px-6 py-12 flex flex-col items-center text-center">
            <div className="mb-6 p-6 rounded-[2rem] bg-white shadow-2xl border border-gray-100 inline-block rotate-3 hover:rotate-0 transition-transform duration-500">
                <Zap className="w-16 h-16 text-[#002FA7] mx-auto" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-3 tracking-tighter text-[#1D1D1F]">
                闪灵 AI
            </h1>
            <p className="text-xl md:text-2xl font-light text-[#002FA7] tracking-widest mb-8 uppercase">
                Marketing Generator
            </p>

            {/* Inspiration Input Window */}
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

            {/* Grid for Inspiration Sections */}
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. Trending Topics */}
                <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-sm h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-4 opacity-80">
                        <TrendingUp className="w-4 h-4 text-[#002FA7]" />
                        <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">热点灵感推荐</span>
                    </div>
                    <div className="flex flex-wrap gap-2 content-start">
                        {randomTopics.map((topic, index) => (
                            <button
                                key={index}
                                onClick={() => handleTopicClick(topic)}
                                className="group flex items-center bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md hover:border-blue-100 hover:text-[#002FA7] active:scale-95 transition-all duration-200"
                            >
                                <span className="text-sm font-medium text-gray-600 group-hover:text-[#002FA7]">{topic}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Explosive Strategies */}
                <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-sm h-full">
                    <div className="flex items-center gap-2 mb-4 opacity-80">
                        <Target className="w-4 h-4 text-[#002FA7]" />
                        <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">爆款思路参考</span>
                    </div>
                    <div className="space-y-3">
                        {randomStrategies.map((strat, index) => (
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
                        ))}
                    </div>
                </div>

            </div>

            {/* Footer Icons */}
            <div className="mt-16 flex gap-12 opacity-60">
                <div className="flex flex-col items-center group cursor-default">
                    <div className="p-3 bg-white rounded-2xl shadow-md mb-3 group-hover:-translate-y-1 transition-transform">
                        <LayoutGrid className="w-6 h-6 text-[#002FA7]" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 tracking-wider">SMART LAYOUT</span>
                </div>
                <div className="flex flex-col items-center group cursor-default">
                     <div className="p-3 bg-white rounded-2xl shadow-md mb-3 group-hover:-translate-y-1 transition-transform">
                        <Zap className="w-6 h-6 text-[#002FA7]" />
                     </div>
                    <span className="text-xs font-bold text-gray-400 tracking-wider">AI COPYWRITING</span>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (step === GenerationStep.GENERATING_COPY) {
    return <LoadingScreen status={loadingMsg} />;
  }

  // Results View
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] pb-12 font-sans selection:bg-[#002FA7] selection:text-white">
        {/* App Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-[#002FA7] rounded-md flex items-center justify-center text-white">
                     <Zap className="w-4 h-4" />
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
            <div className="flex justify-between items-end mb-10 px-2">
                <div>
                    <h2 className="text-4xl font-black tracking-tight mb-2">今日产出</h2>
                    <div className="flex items-center text-gray-500 font-medium text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {new Date().toLocaleDateString('zh-CN')} • 4 份营销物料
                    </div>
                </div>
                {step === GenerationStep.GENERATING_IMAGES && (
                   <div className="flex items-center space-x-3 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
                       <div className="relative w-3 h-3">
                            <span className="absolute inset-0 bg-[#002FA7] rounded-full opacity-20 animate-ping"></span>
                            <span className="relative block w-3 h-3 bg-[#002FA7] rounded-full"></span>
                       </div>
                       <span className="text-xs font-bold text-[#002FA7]">图像渲染中...</span>
                   </div>
                )}
            </div>

            {/* Grid Layout */}
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