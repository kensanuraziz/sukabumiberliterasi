import React, { useState } from 'react';

// Quick-action banners for community support
// Banner image ideal size: 800 x 200 px (ratio 4:1) — landscape, compact
// If using Google Drive image links, paste the shareable link below.
// The component auto-converts drive.google.com links to direct image URLs.
const getDirectImageUrl = (url) => {
  if (!url) return '';
  const u = String(url).trim();
  if (u.includes('drive.google.com')) {
    let id = '';
    if (u.includes('/file/d/')) {
      const parts = u.split('/file/d/');
      if (parts[1]) id = parts[1].split('/')[0].split('?')[0];
    } else if (u.includes('id=')) {
      const parts = u.split('id=');
      if (parts[1]) id = parts[1].split('&')[0];
    }
    return id ? `https://lh3.googleusercontent.com/d/${id}=w800` : u;
  }
  return u;
};

const ACTIONS = [
  {
    id: 'whatsapp',
    icon: 'group',
    title: 'Gabung Grup WhatsApp',
    desc: 'Berkolaborasi & berbagi inspirasi literasi',
    href: 'https://chat.whatsapp.com/DEwxA6kyCGy55sKeQMwfBP?s=cl&p=a&ilr=2',
    cta: 'Gabung Sekarang',
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-900/15',
    borderColor: 'border-emerald-200/60 dark:border-emerald-700/30',
    iconBg: 'bg-emerald-500',
    banner: '', // <-- paste Google Drive link here for custom banner
  },
  {
    id: 'donasi',
    icon: 'menu_book',
    title: 'Donasi Buku',
    desc: 'Salurkan buku layak baca untuk komunitas',
    href: 'https://wa.me/6281385586238?text=Halo%20Admin%2C%20saya%20ingin%20donasi%20buku%20layak%20baca.',
    cta: 'Hubungi Admin',
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50 dark:bg-amber-900/15',
    borderColor: 'border-amber-200/60 dark:border-amber-700/30',
    iconBg: 'bg-amber-500',
    banner: '',
  },
  {
    id: 'relawan',
    icon: 'volunteer_activism',
    title: 'Gabung Relawan',
    desc: 'Jadi motor penggerak literasi digital Sukabumi',
    href: 'https://wa.me/6281385586238?text=Halo%20Admin%2C%20saya%20tertarik%20bergabung%20menjadi%20relawan%20kegiatan%20literasi.',
    cta: 'Daftar Relawan',
    gradient: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50 dark:bg-violet-900/15',
    borderColor: 'border-violet-200/60 dark:border-violet-700/30',
    iconBg: 'bg-violet-500',
    banner: '',
  },
  {
    id: 'konsultasi',
    icon: 'contact_support',
    title: 'Konsultasi Literasi',
    desc: 'Diskusi & ajukan pertanyaan seputar program literasi',
    href: 'https://forms.gle/xseCm4TkNTm6Er366',
    cta: 'Buka Formulir',
    gradient: 'from-cyan-500 to-blue-600',
    bgLight: 'bg-cyan-50 dark:bg-cyan-900/15',
    borderColor: 'border-cyan-200/60 dark:border-cyan-700/30',
    iconBg: 'bg-cyan-500',
    banner: '',
  },
];

export default function CommunityBanners() {
  return (
    <div className="space-y-2.5">
      {/* Section label */}
      <div className="flex items-center gap-2 px-1">
        <span className="material-symbols-outlined text-primary text-lg bg-primary/10 p-1 rounded-lg">hub</span>
        <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Ruang Kolaborasi</h3>
      </div>

      {/* Grid container for larger banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {ACTIONS.map((action) => {
          const bannerUrl = getDirectImageUrl(action.banner);
          return (
            <a
              key={action.id}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group w-full rounded-2xl overflow-hidden border ${action.borderColor} ${action.bgLight} transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] no-underline block`}
              style={{ textDecoration: 'none' }}
            >
              {/* Banner image if set */}
              {bannerUrl ? (
                <div className="relative">
                  <img
                    src={bannerUrl}
                    alt={action.title}
                    className="w-full h-28 object-cover"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  {/* Overlay with title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 ${action.iconBg} rounded-lg flex items-center justify-center shadow`}>
                        <span className="material-symbols-outlined text-sm text-white font-fill">{action.icon}</span>
                      </div>
                      <span className="text-white font-bold text-xs drop-shadow">{action.title}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* No banner — compact card layout styled beautifully */
                <div className="p-3.5 flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <span className="material-symbols-outlined text-xl text-white font-fill">{action.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight truncate">{action.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-1">{action.desc}</p>
                  </div>
                  <div className={`flex-shrink-0 px-2.5 py-1.5 bg-gradient-to-r ${action.gradient} text-white text-[10px] font-bold rounded-lg shadow-sm`}>
                    {action.cta} →
                  </div>
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
