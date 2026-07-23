import React, { useState, useEffect } from 'react';







const FALLBACK_PAMFLETS = [
  {
    id: '1En-_a4IjOt-oJQliNoIufqkE49jFMP3u',
    name: 'Desain tanpa judul (2)',
    thumbnailLink: '/desain-tanpa-judul-2.png',
    webContentLink: '/desain-tanpa-judul-2.png'
  }
];

function PamfletGallery({ agenda }) {
  const [pamflets, setPamflets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    async function fetchPamflets() {
      // 1. Dapatkan pamflet langsung dari Google Sheet Agenda jika ada
      const sheetPamflets = [];
      if (agenda && agenda.length > 1) {
        agenda.slice(1).forEach((r, i) => {
          const name = r[1] || '';
          const rawUrl = r[7] || '';
          if (rawUrl && String(rawUrl).trim().length > 5) {
            const urlStr = String(rawUrl).trim();
            let id = '';
            const match = urlStr.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || urlStr.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              id = match[1];
            }
            const thumb = id ? `https://lh3.googleusercontent.com/d/${id}=w600` : urlStr;
            const full = id ? `https://lh3.googleusercontent.com/d/${id}=w1000` : urlStr;
            sheetPamflets.push({
              id: id || `sheet-p-${i}`,
              name: name || 'Pamflet Event',
              thumbnailLink: thumb,
              webContentLink: full
            });
          }
        });
      }

      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
      const folderId = import.meta.env.VITE_GDRIVE_FOLDER_ID || '1hJI_2TS3JqKCpc2uaWi2V5YmSlHI8J7YsoTOuYNIAM6JJf6Pwwu5Ph-u5g62e5HE2Op7UgjF';
      
      if (!apiKey) {
        setPamflets(sheetPamflets.length > 0 ? sheetPamflets : FALLBACK_PAMFLETS);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'+and+trashed=false&fields=files(id,name,thumbnailLink,webContentLink)&key=${apiKey}`
        );
        if (!res.ok) throw new Error('API key invalid or folder not public');
        const data = await res.json();
        
        if (data.files && data.files.length > 0) {
          const mapped = data.files.map(f => {
            let thumb = f.thumbnailLink || `https://lh3.googleusercontent.com/d/${f.id}`;
            let full = f.webContentLink || `https://lh3.googleusercontent.com/d/${f.id}`;
            if (thumb.includes('=')) {
              thumb = thumb.split('=')[0] + '=w600';
              full = thumb.split('=')[0] + '=w1000';
            }
            return {
              id: f.id,
              name: f.name.replace(/\.[^/.]+$/, ""),
              thumbnailLink: thumb,
              webContentLink: full
            };
          });
          setPamflets([...sheetPamflets, ...mapped]);
        } else {
          setPamflets(sheetPamflets.length > 0 ? sheetPamflets : FALLBACK_PAMFLETS);
        }
      } catch (err) {
        console.warn('Drive listing failed, using sheet pamflets:', err);
        setPamflets(sheetPamflets.length > 0 ? sheetPamflets : FALLBACK_PAMFLETS);
      } finally {
        setLoading(false);
      }
    }

    fetchPamflets();
  }, [agenda]);

  const handleShare = async (pamflet) => {
    try {
      if (navigator.share && navigator.canShare) {
        const response = await fetch(pamflet.webContentLink);
        const blob = await response.blob();
        const ext = blob.type.split('/')[1] || 'png';
        const file = new File([blob], `pamflet.${ext}`, { type: blob.type });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: pamflet.name,
            text: `Yuk ikuti kegiatan literasi seru ini! Info kegiatan lainnya di: sukabumiberliterasi.netlify.app`
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Gagal membagikan pamflet secara native, menggunakan fallback:', err);
    }

    const shareText = `Yuk ikuti kegiatan literasi seru ini! Lihat pamflet acaranya di sini: ${pamflet.webContentLink}\n\nAkses info kegiatan lainnya di sukabumiberliterasi.netlify.app`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="glass-panel p-4 rounded-3xl bg-teal-50/20 dark:bg-teal-950/10 border border-teal-500/10 dark:border-teal-500/20 space-y-4">
      <div className="flex items-center gap-1.5 text-primary dark:text-[#4edea3]">
        <span className="material-symbols-outlined text-base">gallery_thumbnail</span>
        <span className="text-[10px] font-extrabold uppercase tracking-wider">Galeri Pamflet Event</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-teal-500/5 dark:bg-teal-950/20 shimmer"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {pamflets.map(f => (
            <div key={f.id} className="group relative flex flex-col bg-white/40 dark:bg-black/25 rounded-2xl overflow-hidden border border-teal-500/10 hover:border-teal-500/30 transition-all duration-350">
              <div 
                className="aspect-[3/4] overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-800"
                onClick={() => setLightboxImage(f)}
              >
                <img 
                  src={f.thumbnailLink} 
                  alt={f.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                  loading="lazy"
                />
              </div>
              <div className="p-2 flex flex-col justify-between flex-grow gap-2">
                <span className="text-[10px] font-bold text-slate-800 dark:text-[#eafaf6] line-clamp-1">{f.name}</span>
                <button
                  onClick={() => handleShare(f)}
                  className="flex items-center justify-center gap-1 bg-[#25D366] text-white py-1 rounded-xl text-[9px] font-extrabold hover:bg-[#128C7E] transition-all"
                >
                  <span className="material-symbols-outlined text-[10px] font-fill">share</span>
                  Share WA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxImage && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-[110] flex flex-col items-center justify-center p-4 animate-in fade-in">
          {/* Backdrop Click to Close */}
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setLightboxImage(null)}
          ></div>
          
          <div className="relative max-w-[320px] w-full bg-white dark:bg-zinc-900 rounded-3xl p-4 flex flex-col gap-3 items-center border border-teal-500/20 shadow-2xl z-10">
            {/* Close Button Inside Card */}
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-teal-200 rounded-full p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors z-20 flex items-center justify-center border-0"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
            
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mt-5 border border-teal-500/10">
              <img 
                src={lightboxImage.webContentLink} 
                alt={lightboxImage.name} 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="w-full text-center space-y-2">
              <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-[#eafaf6] line-clamp-1 px-4">{lightboxImage.name}</h3>
              <button
                onClick={() => handleShare(lightboxImage)}
                className="flex items-center justify-center gap-1 bg-[#25D366] hover:bg-[#128C7E] text-white py-2 w-full rounded-xl text-[11px] font-black transition-all"
              >
                <span className="material-symbols-outlined text-xs font-fill">share</span>
                Bagikan ke WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgendaList({ agenda, loading, onRegister, userCoords, setUserCoords }) {
  const rows = agenda.slice(1); // skip headers
  
  // Track open/collapsed state of themes by index/ID
  const [openThemes, setOpenThemes] = useState({});

  // Parse rows into hierarchy: Themes containing Sub-activities
  const groups = [];
  let currentGroup = null;

  rows.forEach((r, idx) => {
    const no = String(r[0] || '').trim();
    const name = String(r[1] || '').trim();
    
    if (!no && !name) return; // skip empty rows

    // Check if it's a theme row (e.g., A., B., C., etc.)
    const isTheme = /^[A-Z]\.?$/i.test(no) || (no && !no.endsWith('.'));
    
    if (isTheme) {
      currentGroup = {
        id: no || `group-${idx}`,
        themeNo: no,
        themeName: name,
        items: []
      };
      groups.push(currentGroup);
    } else if (no) {
      // Sub-activity row (e.g., 1., 2., 3.)
      const item = {
        no: no,
        name: name,
        date: r[2] || 'Segera Diumumkan',
        location: r[3] || 'Pojok Baca Sukabumi',
        pic: r[4] || '',
        facilities: r[5] || '',
        requirements: r[6] || '',
        pamflet: r[7] || ''
      };
      
      if (currentGroup) {
        currentGroup.items.push(item);
      } else {
        currentGroup = {
          id: 'kegiatan-umum',
          themeNo: '',
          themeName: 'Kegiatan Umum',
          items: [item]
        };
        groups.push(currentGroup);
      }
    }
  });

  const toggleTheme = (id) => {
    setOpenThemes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <section className="space-y-5">
      <PamfletGallery agenda={agenda} />
<div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-[#eafaf6]">Agenda Kegiatan</h2>
        <p className="text-xs text-slate-600 dark:text-teal-200/80 opacity-80 leading-relaxed">
          Ikuti kegiatan literasi secara gratis untuk menambah ilmu dan relasi!
        </p>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="glass-panel p-6 rounded-3xl h-16 shimmer"></div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 opacity-60">
          <span className="material-symbols-outlined text-5xl">calendar_today</span>
          <p className="mt-2 text-sm font-semibold">Belum ada agenda kegiatan saat ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isOpen = !!openThemes[group.id];
            return (
              <div key={group.id} className="space-y-3">
                {/* Theme Header Accordion Button */}
                <button
                  onClick={() => toggleTheme(group.id)}
                  className="w-full flex items-center justify-between p-4 bg-surface-container/60 dark:bg-inverse-surface/40 hover:bg-surface-container dark:hover:bg-inverse-surface/60 rounded-2xl transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-lg">
                      {group.themeNo || '★'}
                    </span>
                    <h3 className="font-extrabold text-sm text-primary dark:text-inverse-primary">
                      {group.themeName}
                    </h3>
                  </div>
                  <span className="material-symbols-outlined text-primary transition-transform duration-300">
                    {isOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Collapsible Sub-activities List */}
                {isOpen && (
                  <div className="space-y-3 pl-2 animate-in fade-in">
                    {group.items.length === 0 ? (
                      <p className="text-xs text-on-surface-variant opacity-60 italic p-2">
                        Belum ada sub-kegiatan terdaftar.
                      </p>
                    ) : (
                      group.items.map((item, itemIdx) => {
                        const getImageUrl = (src) => {
                          if (!src) return '';
                          const url = String(src).trim();
                          if (url.includes('drive.google.com')) {
                            let id = '';
                            if (url.includes('/file/d/')) {
                              const parts = url.split('/file/d/');
                              if (parts[1]) {
                                id = parts[1].split('/')[0].split('?')[0];
                              }
                            } else if (url.includes('id=')) {
                              const match = url.match(/[?&]id=([^&]+)/);
                              if (match && match[1]) {
                                id = match[1];
                              }
                            }
                            if (id) return `https://lh3.googleusercontent.com/d/${id}`;
                          }
                          if (url.toLowerCase().startsWith('http://') || url.toLowerCase().startsWith('https://') || url.toLowerCase().startsWith('data:')) {
                            return url;
                          }
                          return url.startsWith('/') ? url : `/${url}`;
                        };

                        const resolvedFlyer = getImageUrl(item.pamflet);

                        return (
                          <div 
                            key={itemIdx}
                            className="glass-panel p-5 rounded-2xl border-l-4 border-primary hover:border-l-8 transition-all flex flex-col gap-3"
                          >
                            {resolvedFlyer && (
                              <div className="w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-teal-500/10 dark:border-teal-500/20">
                                <img 
                                  src={resolvedFlyer} 
                                  alt={`Flyer ${item.name}`} 
                                  className="w-full max-h-48 object-contain mx-auto"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <div className="space-y-2">
                              <h4 className="font-bold text-sm text-slate-800 dark:text-[#eafaf6]">
                                {item.no} {item.name}
                              </h4>
                              
                              <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-600 dark:text-teal-200/80 opacity-85">
                                <span className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-xs">schedule</span>
                                  {item.date}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-xs">location_on</span>
                                  {item.location}
                                </span>
                                {item.pic && (
                                  <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs">person</span>
                                    PIC: {item.pic}
                                  </span>
                                )}
                              </div>

                              {item.facilities && (
                                <div className="pt-1.5 border-t border-dashed border-teal-500/10">
                                  <span className="text-[10px] font-bold text-teal-600 dark:text-[#4edea3] uppercase tracking-wider block mb-0.5">Fasilitas:</span>
                                  <p className="text-xs text-slate-700 dark:text-teal-100/90 leading-normal">{item.facilities}</p>
                                </div>
                              )}

                              {item.requirements && (
                                <div className="pt-1.5 border-t border-dashed border-teal-500/10">
                                  <span className="text-[10px] font-bold text-[#b58500] dark:text-[#ffd666] uppercase tracking-wider block mb-0.5">Syarat Pendaftaran:</span>
                                  <p className="text-xs text-slate-700 dark:text-teal-100/90 leading-normal">{item.requirements}</p>
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => onRegister({ title: `${group.themeName} - ${item.name}`, time: item.date })}
                              className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-primary-hover transition-all w-full text-center mt-1"
                            >
                              Daftar Kelas
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      </section>
  );
}
