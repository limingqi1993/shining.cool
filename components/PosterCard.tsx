import React, { useRef, useState } from 'react';
import { MarketingCardData } from '../types';
import { Sparkles, Loader2, Zap, Download, RefreshCw, PenTool, Hash, Layout } from 'lucide-react';
import { toPng } from 'html-to-image';

interface PosterCardProps {
  data: MarketingCardData;
  imageUrl?: string;
  isGeneratingImage: boolean;
  onRegenerateImage: () => void;
}

export const PosterCard: React.FC<PosterCardProps> = ({ data, imageUrl, isGeneratingImage, onRegenerateImage }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadSingle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cardRef.current || downloading || !imageUrl) return;

    setDownloading(true);
    try {
        // Wait for fonts to be ready
        await document.fonts.ready;
        
        // Configuration for high-quality capture
        const options = {
            cacheBust: true, 
            pixelRatio: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            filter: (node: HTMLElement) => !node.classList?.contains('download-btn-exclude')
        };

        // Hack: First capture to warm up fonts/images in the cloned node
        await toPng(cardRef.current, options);
        
        // Small delay to ensure rendering matches
        await new Promise(r => setTimeout(r, 200));

        // Actual capture
        const dataUrl = await toPng(cardRef.current, options);
        
        const link = document.createElement('a');
        link.download = `闪灵AI-海报-${data.id}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error("Failed to download card", err);
    } finally {
        setDownloading(false);
    }
  };

  const handleRegenerateClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRegenerateImage();
  };

  const renderBackground = () => (
    <div className="absolute inset-0 z-0">
        {imageUrl ? (
            <img src={imageUrl} alt={data.visualPrompt} className="w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                {isGeneratingImage ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-[#002FA7] animate-spin mb-2" />
                        <span className="text-xs text-[#002FA7] font-medium tracking-widest">AI RENDER...</span>
                    </div>
                ) : (
                    <span className="text-gray-300 text-xs tracking-widest">WAITING...</span>
                )}
            </div>
        )}
    </div>
  );

  // --- STYLE RENDERERS ---

  // 1. Minimal Tech Style (Original)
  const renderMinimal = () => (
    <>
        {renderBackground()}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#002FA7]/90 h-full"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#002FA7] via-transparent to-transparent opacity-60 mix-blend-multiply"></div>
        <div className="relative z-10 flex flex-col justify-between h-full p-8 text-white">
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <Zap className="w-2.5 h-2.5 text-[#002FA7] fill-current" />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase">Shining AI</span>
                </div>
                <span className="text-4xl font-black text-white/50">{data.id.toString().padStart(2, '0')}</span>
            </div>
            <div className="mt-auto mb-12">
                <div className="flex flex-wrap gap-2 mb-5">
                    {data.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#002FA7] bg-white rounded-sm shadow-sm">
                            #{tag.replace(/^#/, '')}
                        </span>
                    ))}
                </div>
                <h1 className="text-3xl font-black mb-3 leading-none tracking-tight">{data.title}</h1>
                <h2 className="text-base font-bold text-white/90 mb-6 border-l-2 border-white pl-3">{data.subtitle}</h2>
                <div className="text-xs text-white/90 leading-relaxed font-light">
                    {data.isPromoCard ? (
                        <div className="bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                            {data.body.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                        </div>
                    ) : (data.body)}
                </div>
            </div>
        </div>
    </>
  );

  // 2. Handwritten Note Style
  const renderHandwritten = () => (
    <div className="relative w-full h-full bg-[#fdfbf7] text-gray-800 flex flex-col p-6">
        {/* Lined Paper Pattern */}
        <div className="absolute inset-0" style={{ 
            backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)', 
            backgroundSize: '100% 2rem', 
            marginTop: '4rem' 
        }}></div>
        
        {/* Tape Effect */}
        <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-24 h-8 bg-yellow-200/80 rotate-2 shadow-sm z-20"></div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center mb-6">
             <div className="flex items-center gap-1 text-gray-400">
                <PenTool className="w-4 h-4" />
                <span className="text-xs font-handwriting">Draft {new Date().toLocaleDateString()}</span>
             </div>
             <span className="text-2xl font-handwriting text-[#002FA7] underline decoration-wavy">#{data.id}</span>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 font-handwriting">
             {imageUrl && (
                <div className="w-full h-40 mb-4 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm rotate-1">
                     <img src={imageUrl} className="w-full h-full object-cover" crossOrigin="anonymous"/>
                </div>
             )}
             
             <h1 className="text-3xl text-gray-900 mb-2 leading-tight">{data.title}</h1>
             <p className="text-lg text-[#002FA7] mb-4">{data.subtitle}</p>
             
             <div className="text-xl leading-loose text-gray-700">
                {data.isPromoCard ? (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 rotate-[-1deg] shadow-sm">
                         {data.body.split('\n').map((line, i) => <div key={i}>• {line}</div>)}
                    </div>
                ) : (data.body)}
             </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-auto flex justify-end">
            <span className="text-sm font-handwriting text-gray-400">From: Shining AI Inspiration</span>
        </div>
    </div>
  );

  // 3. Comic / Pop Art Style
  const renderComic = () => (
    <div className="relative w-full h-full bg-yellow-400 p-3 flex flex-col border-4 border-black">
        {/* Halftone Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
        
        {/* Image Frame */}
        <div className="relative h-1/2 border-4 border-black bg-white mb-4 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
             {renderBackground()}
             <div className="absolute top-2 left-2 bg-white border-2 border-black px-2 py-1 font-comic font-bold text-xs">
                EPISODE {data.id}
             </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative z-10">
             <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
                {/* Speech Bubble Triangle */}
                <div className="absolute -top-4 left-8 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-black"></div>
                <div className="absolute -top-[11px] left-[34px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-white"></div>

                <h1 className="font-comic text-3xl mb-2 text-black uppercase leading-none">{data.title}</h1>
                <p className="font-comic text-sm text-[#002FA7] mb-3 font-bold">{data.subtitle}</p>
                <div className="font-bold text-sm leading-snug">
                     {data.body}
                </div>
             </div>
        </div>
        
        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-2 relative z-10">
            {data.tags.slice(0,3).map((tag, i) => (
                <span key={i} className="bg-black text-white px-2 py-1 font-comic text-xs border-2 border-white -rotate-2">
                    {tag}
                </span>
            ))}
        </div>
    </div>
  );

  // 4. Magazine Cover Style
  const renderMagazine = () => (
    <>
        {renderBackground()}
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative z-10 flex flex-col h-full p-6 text-white">
            {/* Masthead */}
            <div className="border-b-4 border-white pb-2 mb-auto">
                <h1 className="font-magazine text-6xl tracking-tighter leading-none text-center">SHINING</h1>
                <div className="flex justify-between text-[10px] font-bold tracking-widest mt-1 uppercase">
                    <span>Vol. {data.id}</span>
                    <span>AI CREATIVE ISSUE</span>
                    <span>2025</span>
                </div>
            </div>

            {/* Main Headline */}
            <div className="mb-8 text-center">
                 <h2 className="font-magazine text-4xl mb-2 uppercase leading-none shadow-black drop-shadow-lg">{data.title}</h2>
                 <p className="font-serif italic text-lg bg-[#002FA7] inline-block px-2">{data.subtitle}</p>
            </div>

            {/* Body Blocks */}
            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div className="col-span-2 bg-white/10 backdrop-blur-md p-3 border-l-2 border-[#002FA7]">
                    <p className="leading-relaxed drop-shadow-md">
                        {data.body.length > 80 ? data.body.substring(0, 80) + '...' : data.body}
                    </p>
                </div>
                {/* Promo Box specific to Magazine */}
                {data.isPromoCard && (
                    <div className="col-span-2 flex items-center justify-between bg-white text-black p-2 font-bold">
                        <span>VISIT NOW</span>
                        <span className="text-[#002FA7]">WWW.SHINING.COOL</span>
                    </div>
                )}
            </div>
            
            {/* Barcode-ish look */}
            <div className="mt-4 flex justify-between items-end">
                <div className="flex flex-col gap-[2px]">
                     {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-[2px] bg-white w-12 opacity-80"></div>
                     ))}
                </div>
                <Hash className="w-6 h-6 text-white/50" />
            </div>
        </div>
    </>
  );

  const renderLayout = () => {
    switch (data.layoutStyle) {
        case 'handwritten': return renderHandwritten();
        case 'comic': return renderComic();
        case 'magazine': return renderMagazine();
        case 'minimal':
        default: return renderMinimal();
    }
  };

  return (
    <div className="group relative w-full aspect-[3/4] shadow-xl transition-all hover:shadow-2xl hover:scale-[1.01] bg-white select-none overflow-hidden rounded-sm">
      <div 
        id={`poster-card-${data.id}`}
        ref={cardRef} 
        className="relative w-full h-full bg-white flex flex-col overflow-hidden"
      >
        {renderLayout()}
        
        {/* Buttons (Excluded from capture) */}
        <button
            onClick={handleRegenerateClick}
            className="download-btn-exclude absolute top-3 right-3 z-50 p-2 bg-black/10 backdrop-blur-sm text-white rounded-full hover:bg-[#002FA7] hover:text-white transition-all opacity-0 group-hover:opacity-100 duration-300 border border-white/20"
            title="重新生成背景"
        >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingImage ? 'animate-spin' : ''}`} />
        </button>

        {imageUrl && (
            <button
                onClick={handleDownloadSingle}
                className="download-btn-exclude absolute bottom-3 right-3 z-50 p-2.5 bg-white text-[#002FA7] rounded-full shadow-xl hover:scale-110 active:scale-90 transition-all opacity-0 group-hover:opacity-100 duration-300"
                title="保存海报"
            >
                {downloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Download className="w-4 h-4" />
                )}
            </button>
        )}
      </div>
    </div>
  );
};