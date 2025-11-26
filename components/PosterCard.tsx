import React, { useRef, useState } from 'react';
import { MarketingCardData } from '../types';
import { Sparkles, Loader2, Zap, Download, RefreshCw } from 'lucide-react';
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
    e.stopPropagation(); // Prevent any parent clicks
    if (!cardRef.current || downloading || !imageUrl) return;

    setDownloading(true);
    try {
        // Use a small delay to ensure rendering context is stable
        await new Promise(r => setTimeout(r, 100));

        const dataUrl = await toPng(cardRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            filter: (node) => {
                // IMPORTANT: Exclude elements with this class from the screenshot
                return !node.classList?.contains('download-btn-exclude');
            }
        });

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

  return (
    <div className="group relative w-full aspect-[3/4] shadow-xl transition-all hover:shadow-2xl hover:scale-[1.01] bg-white select-none">
      
      {/* Capture Area - No Rounded Corners */}
      <div 
        id={`poster-card-${data.id}`}
        ref={cardRef} 
        className="relative w-full h-full bg-white flex flex-col overflow-hidden"
      >
        
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
            {imageUrl ? (
            <img 
                src={imageUrl} 
                alt={data.visualPrompt} 
                className="w-full h-full object-cover"
                crossOrigin="anonymous" 
            />
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
            {/* Design Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#002FA7]/90 h-full"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#002FA7] via-transparent to-transparent opacity-60 mix-blend-multiply"></div>
        </div>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8 text-white">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                    {/* Logo */}
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <Zap className="w-2.5 h-2.5 text-[#002FA7] fill-current" />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase">Shining AI</span>
                </div>
                <div className="px-2 py-1 opacity-50">
                     <span className="text-4xl font-black text-white font-sans tracking-tighter">{data.id.toString().padStart(2, '0')}</span>
                </div>
            </div>

            {/* Main Text */}
            <div className="mt-auto mb-16">
                 {/* Tags - Ensure single hash */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {data.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#002FA7] bg-white rounded-sm shadow-sm">
                            #{tag.replace(/^#/, '')}
                        </span>
                    ))}
                </div>

                <h1 className="text-3xl font-black mb-3 leading-none tracking-tight">
                    {data.title}
                </h1>
                <h2 className="text-base font-bold text-white/90 mb-6 tracking-wide border-l-2 border-white pl-3">
                    {data.subtitle}
                </h2>
                
                <div className="text-xs text-white/90 leading-relaxed font-light">
                    {data.isPromoCard ? (
                        <div className="space-y-1 bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                           {data.body.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                        </div>
                    ) : (
                        data.body
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end border-t border-white/30 pt-4">
                <div>
                     <p className="text-[8px] opacity-80 uppercase tracking-widest mb-1">Generated by</p>
                     <p className="text-[10px] font-bold">闪灵 AI (Shining AI)</p>
                     <p className="text-[8px] font-medium opacity-90 tracking-wide mt-0.5">www.shining.cool</p>
                </div>
                <div className="bg-white/90 text-[#002FA7] p-1.5 rounded-lg shadow-lg">
                    <Sparkles className="w-3 h-3" />
                </div>
            </div>
        </div>

        {/* REGENERATE BUTTON - Excluded from snapshot */}
        <button
            onClick={handleRegenerateClick}
            className="download-btn-exclude absolute top-4 right-4 z-50 p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-[#002FA7] transition-all opacity-0 group-hover:opacity-100 duration-300 border border-white/30"
            title="重新生成背景"
        >
            <RefreshCw className={`w-4 h-4 ${isGeneratingImage ? 'animate-spin' : ''}`} />
        </button>

        {/* INDIVIDUAL DOWNLOAD BUTTON - Excluded from snapshot */}
        {imageUrl && (
            <button
                onClick={handleDownloadSingle}
                className="download-btn-exclude absolute bottom-4 right-4 z-50 p-3 bg-white text-[#002FA7] rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all opacity-0 group-hover:opacity-100 duration-300"
                title="保存海报"
            >
                {downloading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Download className="w-5 h-5" />
                )}
            </button>
        )}

      </div>
    </div>
  );
};