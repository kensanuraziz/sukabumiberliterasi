import React, { useState, useMemo } from 'react';
import { useGoogleSheets } from '../hooks/useGoogleSheets';

const SHEET_ID = '1ZGye_DCw8d1vvg1YHJJG08Vcz8fUYSZT8uZ7VRpVnlE';

// Parse rows into structured challenge objects
function parseChallenges(data) {
  if (!data || data.length < 2) return [];
  // Row 0 = headers: No, Link Gambar Pamflet, Nama Challenge, Deskripsi Challenge, Persyaratan, Berlaku Sampai Tanggal, Ketentuan Pemenang, Hadiah Pemenang
  return data.slice(1).map((row) => {
    const nama = (row[2] || '').toString().trim();
    if (!nama) return null; // skip empty rows
    return {
      no: row[0] || '',
      gambar: (row[1] || '').toString().trim(),
      nama,
      deskripsi: (row[3] || '').toString().trim(),
      persyaratan: (row[4] || '').toString().trim(),
      berlakuSampai: (row[5] || '').toString().trim(),
      ketentuanPemenang: (row[6] || '').toString().trim(),
      hadiah: (row[7] || '').toString().trim(),
    };
  }).filter(Boolean);
}

// Calculate days remaining
function getDaysRemaining(dateStr) {
  if (!dateStr) return null;
  try {
    // Try various date formats
    const parts = dateStr.split(/[-/]/);
    let date;
    if (parts.length === 3) {
      // dd/mm/yyyy or dd-mm-yyyy
      if (parts[2].length === 4) {
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      } else {
        date = new Date(dateStr);
      }
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return null;
  }
}

function ChallengeCard({ challenge, index }) {
  const [expanded, setExpanded] = useState(false);
  const daysLeft = getDaysRemaining(challenge.berlakuSampai);
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  const gradients = [
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-blue-600',
    'from-lime-500 to-green-600',
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <div
      className={`group relative rounded-[1.5rem] overflow-hidden transition-all duration-500 ${
        isExpired ? 'opacity-60 grayscale' : ''
      }`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Card */}
      <div className="glass-panel rounded-[1.5rem] overflow-hidden">
        {/* Header gradient strip */}
        <div className={`bg-gradient-to-r ${gradient} p-4 pb-3 relative`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-50"></div>
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                  #{challenge.no}
                </span>
                {daysLeft !== null && !isExpired && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isUrgent 
                      ? 'bg-red-500/30 border-red-300/40 text-red-100' 
                      : 'bg-white/15 border-white/20 text-white/90'
                  }`}>
                    {isUrgent ? `⏳ ${daysLeft} hari lagi!` : `${daysLeft} hari tersisa`}
                  </span>
                )}
                {isExpired && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-900/40 border border-gray-500/30 text-gray-200">
                    Berakhir
                  </span>
                )}
              </div>
              <h3 className="text-white font-black text-sm leading-tight truncate">{challenge.nama}</h3>
            </div>
            <div className="w-10 h-10 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
              <span className="material-symbols-outlined text-xl text-white font-fill">military_tech</span>
            </div>
          </div>
        </div>

        {/* Pamflet image if present */}
        {challenge.gambar && (
          <div className="px-3 pt-3">
            <img
              src={challenge.gambar}
              alt={`Pamflet ${challenge.nama}`}
              className="w-full rounded-xl object-cover max-h-48 border border-teal-500/10"
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}

        {/* Body */}
        <div className="p-4 pt-3 space-y-2.5">
          {/* Description */}
          {challenge.deskripsi && (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
              {challenge.deskripsi}
            </p>
          )}

          {/* Quick info pills */}
          <div className="flex flex-wrap gap-1.5">
            {challenge.berlakuSampai && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                <span className="material-symbols-outlined text-xs">schedule</span>
                {challenge.berlakuSampai}
              </span>
            )}
            {challenge.hadiah && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-700/30">
                <span className="material-symbols-outlined text-xs">emoji_events</span>
                {challenge.hadiah.length > 40 ? challenge.hadiah.substring(0, 40) + '…' : challenge.hadiah}
              </span>
            )}
          </div>

          {/* Expandable details */}
          {(challenge.persyaratan || challenge.ketentuanPemenang || challenge.hadiah) && (
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors bg-transparent border-0 cursor-pointer p-0"
              >
                <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
                {expanded ? 'Sembunyikan Detail' : 'Lihat Detail'}
              </button>

              <div className={`overflow-hidden transition-all duration-400 ease-in-out ${expanded ? 'max-h-[500px] mt-2.5 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="space-y-2.5 border-t border-slate-200/60 dark:border-slate-700/40 pt-2.5">
                  {challenge.persyaratan && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">checklist</span>
                        Persyaratan
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {challenge.persyaratan}
                      </p>
                    </div>
                  )}
                  {challenge.ketentuanPemenang && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        Ketentuan Pemenang
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {challenge.ketentuanPemenang}
                      </p>
                    </div>
                  )}
                  {challenge.hadiah && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">redeem</span>
                        Hadiah
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-semibold">
                        {challenge.hadiah}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChallengeScreen() {
  const { data, loading, error, refetch } = useGoogleSheets(SHEET_ID);
  const challenges = useMemo(() => parseChallenges(data), [data]);

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="material-symbols-outlined text-lg text-white font-fill">military_tech</span>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-white leading-tight">Challenge Literasi</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Ikuti tantangan & raih hadiah!</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors border-0 cursor-pointer"
          title="Muat ulang data"
        >
          <span className="material-symbols-outlined text-lg text-slate-500 dark:text-slate-400">refresh</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel rounded-[1.5rem] overflow-hidden">
              <div className="shimmer bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 h-20 rounded-t-[1.5rem]"></div>
              <div className="p-4 space-y-2">
                <div className="shimmer h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="shimmer h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="shimmer h-2.5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="glass-panel rounded-[1.5rem] p-6 text-center">
          <div className="w-14 h-14 mx-auto bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-3xl text-red-500">cloud_off</span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Gagal Memuat Data</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{error}</p>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Coba Lagi
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && challenges.length === 0 && (
        <div className="glass-panel rounded-[1.5rem] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-orange-500/5"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-3xl flex items-center justify-center mb-4 border border-amber-200/50 dark:border-amber-700/30">
              <span className="material-symbols-outlined text-4xl text-amber-500">emoji_events</span>
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-2">Belum Ada Challenge</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              Challenge Literasi sedang disiapkan. Nantikan tantangan seru dengan hadiah menarik dari Sukabumi Berliterasi!
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
              <span className="inline-block w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
              <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
            </div>
          </div>
        </div>
      )}

      {/* Challenge cards */}
      {!loading && !error && challenges.length > 0 && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex-shrink-0 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-amber-500">flag</span>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">{challenges.length} Challenge</span>
            </div>
            {challenges.filter(c => getDaysRemaining(c.berlakuSampai) !== null && getDaysRemaining(c.berlakuSampai) >= 0).length > 0 && (
              <div className="flex-shrink-0 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  {challenges.filter(c => getDaysRemaining(c.berlakuSampai) !== null && getDaysRemaining(c.berlakuSampai) >= 0).length} Aktif
                </span>
              </div>
            )}
          </div>

          {/* Cards */}
          {challenges.map((challenge, i) => (
            <ChallengeCard key={challenge.no || i} challenge={challenge} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
