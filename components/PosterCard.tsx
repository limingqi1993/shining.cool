import React, { useRef, useState, useEffect } from 'react';
import { MarketingCardData } from '../types';
import { Sparkles, Loader2, Download, RefreshCw } from 'lucide-react';
import { toPng } from 'html-to-image';

interface PosterCardProps {
  data: MarketingCardData;
  imageUrl?: string;
  isGeneratingImage: boolean;
  onRegenerateImage: () => void;
}

export const PosterCard: React.FC<PosterCardProps> = ({ data, imageUrl, isGeneratingImage, onRegenerateImage }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);

  // Generate the full image for native saving (Long Press / Right Click)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (imageUrl && cardRef.current && !isGeneratingImage) {
      // Delay to ensure DOM render is complete (fonts, etc)
      timeoutId = setTimeout(async () => {
        try {
          const dataUrl = await toPng(cardRef.current!, { 
             cacheBust: true, 
             pixelRatio: 3, // High quality for saving
             backgroundColor: '#ffffff'
          });
          setFinalImageUrl(dataUrl);
        } catch (err) {
          console.error('Failed to generate preview image', err);
        }
      }, 1000);
    } else {
        setFinalImageUrl(null);
    }

    return () => clearTimeout(timeoutId);
  }, [imageUrl, data, isGeneratingImage]);

  return (
    <div className="group relative w-full aspect-[9/16] rounded-3xl overflow-hidden shadow-xl transition-all hover:shadow-2xl hover:scale-[1.01] bg-white select-none">
      
      {/* 1. Capture Area (The visual content) */}
      <div ref={cardRef} className="relative w-full h-full bg-white flex flex-col">
        
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
            {imageUrl ? (
            <img 
                src={imageUrl} 
                alt={data.visualPrompt} 
                className="w-full h-full object-cover"
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
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <span className="text-[#002FA7] text-[10px] font-black">S</span>
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase">Shining AI</span>
                </div>
                <div className="px-2 py-1 opacity-50">
                     <span className="text-4xl font-black text-white font-sans tracking-tighter">{data.id.toString().padStart(2, '0')}</span>
                </div>
            </div>

            {/* Main Text */}
            <div className="mt-auto mb-16">
                 {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {data.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#002FA7] bg-white rounded-sm shadow-sm">
                            #{tag}
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
                        <div className="space-y-1 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
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
      </div>

      {/* 2. Native Save Overlay (Invisible Image) */}
      {/* This image sits on top of the content (z-40) to intercept Long Press / Right Click */}
      {finalImageUrl && (
        <img 
            src={finalImageUrl} 
            className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-context-menu"
            alt="Long press to save"
            style={{ touchAction: 'auto' }}
        />
      )}

      {/* 3. Interaction Hint Layer (z-50) */}
      {/* Pointer events none so it doesn't block the image interaction, except for buttons */}
      <div className="absolute inset-0 z-50 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex flex-col justify-between p-4">
         
         {/* Regenerate Button (Top Right) */}
         <div className="flex justify-end">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onRegenerateImage();
                }}
                className="pointer-events-auto p-3 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-lg hover:bg-white hover:text-[#002FA7] transition-all transform hover:rotate-180 duration-500"
                title="重新生成背景"
            >
                <RefreshCw className="w-5 h-5" />
            </button>
         </div>

         {/* Center Hint */}
         {finalImageUrl && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <Download className="w-4 h-4" />
                    <span>长按或右键保存</span>
                </div>
             </div>
         )}
      </div>

    </div>
  );
};