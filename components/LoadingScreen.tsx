import React from 'react';

interface LoadingScreenProps {
  status: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ status }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F5F5F7]">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-t-4 border-[#002FA7] rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-r-4 border-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        <div className="absolute inset-0 flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#002FA7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        </div>
      </div>
      <h2 className="text-2xl font-black text-[#002FA7] tracking-tighter">
        SHINING AI
      </h2>
      <p className="mt-4 text-gray-500 font-medium text-sm tracking-widest uppercase">
        {status}
      </p>
    </div>
  );
};