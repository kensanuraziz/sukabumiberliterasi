import React, { useState } from 'react';
import WorksGrid from './WorksGrid';
import PartnersGrid from './PartnersGrid';
import CommunityBanners from './CommunityBanners';
import PionAIChat from './PionAIChat';
import ChessQuizGame from './ChessQuizGame';

export default function CommunityScreen({ works, loadingWorks, partners, loadingPartners }) {
  const [subTab, setSubTab] = useState('karya'); // 'karya' or 'mitra'
  const [showChess, setShowChess] = useState(false);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-500">
      
      {/* Community Action Banners — ALWAYS visible at top (now "Ruang Kolaborasi") */}
      <CommunityBanners />

      {/* Galeri Karya — Kreativitas Komunitas (Pion AI + Catur Cerdas Cermat) */}
      <div className="space-y-2.5">
        {/* Section label — matching Ruang Kolaborasi style */}
        <div className="flex items-center gap-2 px-1">
          <span className="material-symbols-outlined text-primary text-lg bg-primary/10 p-1 rounded-lg">palette</span>
          <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Galeri Karya</h3>
        </div>

        {/* Grid of interactive features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Pion AI Card */}
          <div className="rounded-2xl overflow-hidden border border-violet-200/60 dark:border-violet-700/30 bg-violet-50 dark:bg-violet-900/15">
            <PionAIChat />
          </div>

          {/* Catur Cerdas Cermat Card */}
          <div className="rounded-2xl overflow-hidden border border-cyan-200/60 dark:border-cyan-700/30 bg-cyan-50 dark:bg-cyan-900/15">
            <div className="p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="material-symbols-outlined text-xl text-white font-fill">sports_esports</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight truncate">Catur Cerdas Cermat</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-1">Game edukatif interaktif literasi Sukabumi</p>
              </div>
              <button
                onClick={() => setShowChess(!showChess)}
                className="flex-shrink-0 px-2.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold rounded-lg shadow-sm border-0 cursor-pointer"
              >
                {showChess ? 'Tutup ✕' : 'Mainkan →'}
              </button>
            </div>
            {showChess && (
              <div className="border-t border-dashed border-cyan-500/20 p-3.5 animate-in slide-in-from-top duration-300">
                <ChessQuizGame />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Segmented Control Switcher */}
      <div className="flex bg-slate-100/80 dark:bg-black/30 p-1.5 rounded-2xl border border-teal-500/10 shadow-inner">
        <button
          onClick={() => setSubTab('karya')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all border-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'karya'
              ? 'bg-primary text-white shadow-md'
              : 'text-slate-600 dark:text-teal-200/60 hover:text-primary dark:hover:text-[#4edea3] bg-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">palette</span>
          Koleksi Karya
        </button>
        <button
          onClick={() => setSubTab('mitra')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all border-0 cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'mitra'
              ? 'bg-primary text-white shadow-md'
              : 'text-slate-600 dark:text-teal-200/60 hover:text-primary dark:hover:text-[#4edea3] bg-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">handshake</span>
          Instansi/komunitas/TBM
        </button>
      </div>

      {/* Conditionally Render Sections */}
      {subTab === 'karya' ? (
        <div className="relative animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="material-symbols-outlined text-primary text-xl bg-primary/10 p-1.5 rounded-lg">palette</span>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-[#eafaf6] leading-none">Galeri Karya</h2>
              <p className="text-[9px] text-slate-500 dark:text-teal-200/50 uppercase tracking-widest mt-0.5 font-bold">Kreativitas Komunitas</p>
            </div>
          </div>
          <WorksGrid works={works} loading={loadingWorks} isEmbedded={true} />
        </div>
      ) : (
        <div className="relative animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-[#eafaf6] leading-none">Instansi/komunitas/TBM</h2>
              <p className="text-[9px] text-slate-500 dark:text-teal-200/50 uppercase tracking-widest mt-0.5 font-bold">Didukung Oleh</p>
            </div>
          </div>
          <PartnersGrid partners={partners} loading={loadingPartners} isEmbedded={true} />
        </div>
      )}

    </div>
  );
}
