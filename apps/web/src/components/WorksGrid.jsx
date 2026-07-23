import React, { useState } from 'react';
import html2canvas from 'html2canvas';

export default function WorksGrid({ works, loading }) {
  const [search, setSearch] = useState('');
  const [expandedWorks, setExpandedWorks] = useState({});
  const [certWork, setCertWork] = useState(null);
  const [certImage, setCertImage] = useState(null);
  const [generating, setGenerating] = useState(false);

  React.useEffect(() => {
    if (!loading && works && works.length > 1) {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      const titleParam = params.get('title');
      if (pageParam === 'works' && titleParam) {
        const decodedTitle = decodeURIComponent(titleParam);
        const worksRows = works.slice(1);
        const matchedIdx = worksRows.findIndex(r => (r[1] || '').toLowerCase() === decodedTitle.toLowerCase() || r[1] === decodedTitle);
        if (matchedIdx !== -1) {
          setExpandedWorks(prev => ({
            ...prev,
            [matchedIdx]: true
          }));
          setTimeout(() => {
            const element = document.getElementById(`work-card-${matchedIdx}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [works, loading]);

  const handleGenerateCertificate = async (title, author, type) => {
    setCertWork({ title, author, type });
    setGenerating(true);
    setCertImage(null);

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '800px';
    tempDiv.style.height = '565px';
    document.body.appendChild(tempDiv);

    const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    tempDiv.innerHTML = `
      <div style="width: 800px; height: 565px; background: linear-gradient(135deg, #fdfbf7 0%, #f5f9f8 100%); padding: 45px 50px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center; border: 12px double #b45309; border-radius: 20px; position: relative; font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box;">
        <div style="position: absolute; top: 10px; bottom: 10px; left: 10px; right: 10px; border: 1.5px solid #d97706; border-radius: 12px; pointer-events: none;"></div>
        
        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 5px;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.25em; color: #0f766e; text-transform: uppercase;">Sukabumi Berliterasi</div>
          <div style="width: 50px; height: 1.5px; background-color: #d97706;"></div>
        </div>

        <div style="margin-top: 15px;">
          <h1 style="font-size: 30px; font-weight: 800; color: #0f766e; letter-spacing: 0.05em; margin: 0; text-transform: uppercase;">Sertifikat Apresiasi Karya</h1>
          <p style="font-size: 14px; font-style: italic; color: #475569; margin: 8px 0 0 0;">Diberikan dengan hormat kepada:</p>
        </div>

        <div style="margin: 15px 0;">
          <h2 style="font-size: 28px; font-weight: 800; color: #1e293b; border-bottom: 2px solid rgba(217, 119, 6, 0.4); padding-bottom: 8px; display: inline-block; min-width: 450px;">${author}</h2>
        </div>

        <div style="max-width: 620px; margin: 0 auto; line-height: 1.6; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <p style="font-size: 13px; color: #334155; margin: 0;">
            Atas dedikasi, kreativitas, dan kontribusi inspiratifnya dalam melahirkan karya literasi digital yang luar biasa dengan judul:
          </p>
          <h3 style="font-size: 18px; font-weight: 800; color: #0d9488; margin: 8px 0 4px 0; font-style: italic;">
            "${title}"
          </h3>
          <span style="font-size: 10px; font-weight: 800; color: #64748b; background-color: #f1f5f9; padding: 2px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #e2e8f0; display: inline-block;">
            Kategori: ${type}
          </span>
        </div>

        <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 20px; box-sizing: border-box; margin-top: 15px;">
          <div style="text-align: left; font-size: 11px; color: #64748b;">
            <div style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Diterbitkan pada:</div>
            <div style="font-weight: 800; color: #334155; margin-top: 2px;">${formattedDate}</div>
          </div>
          
          <div style="position: relative; width: 70px; height: 60px; display: flex; justify-content: center; align-items: center; margin-bottom: -10px;">
            <div style="position: absolute; width: 14px; height: 40px; background-color: #b45309; transform: rotate(-15deg); bottom: -15px; left: 18px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px;"></div>
            <div style="position: absolute; width: 14px; height: 40px; background-color: #b45309; transform: rotate(15deg); bottom: -15px; right: 18px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px;"></div>
            <div style="width: 55px; height: 55px; border-radius: 50%; background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); border: 3px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.15); display: flex; justify-content: center; align-items: center; z-index: 10; position: relative;">
              <span style="color: #ffffff; font-size: 22px; font-weight: bold; line-height: 1;">★</span>
            </div>
          </div>

          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <div style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Apresiasi Resmi:</div>
            <div style="font-weight: 800; color: #0f766e; margin-top: 2px;">Sukabumi Berliterasi</div>
          </div>
        </div>
      </div>
    `;

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const canvas = await html2canvas(tempDiv, {
        useCORS: true,
        scale: 2,
        backgroundColor: null
      });
      const dataUrl = canvas.toDataURL('image/png');
      setCertImage(dataUrl);
    } catch (err) {
      console.error('Gagal membuat gambar sertifikat:', err);
    } finally {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
      setGenerating(false);
    }
  };

  const handleDownloadCert = () => {
    if (!certImage || !certWork) return;
    const link = document.createElement('a');
    link.download = `Sertifikat_Apresiasi_Karya_${certWork.title.replace(/\s+/g, '_')}.png`;
    link.href = certImage;
    link.click();
  };

  const handleShareCertWA = () => {
    if (!certWork) return;
    const shareUrl = `${window.location.origin}?page=works&title=${encodeURIComponent(certWork.title)}`;
    const shareText = `Halo! Saya baru saja mengapresiasi Karya "${certWork.title}" oleh ${certWork.author} dari Sukabumi Berliterasi! 🌟 Lihat karya selengkapnya di sini:\n👉 ${shareUrl}\n\nLihat karya-karya hebat lainnya di: sukabumiberliterasi.netlify.app`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };
  const worksRows = works.slice(1); // skip headers

  const toggleExpand = (idx) => {
    setExpandedWorks(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleShareWork = (title, author, type, description) => {
    const shareUrl = `${window.location.origin}?page=works&title=${encodeURIComponent(title)}`;
    const text = `*Karya Literasi di Sukabumi Berliterasi*\n\n*Judul:* ${title}\n*Penulis/Pegiat:* ${author}\n*Kategori:* ${type}\n${description ? `\n*Deskripsi:*\n${description}\n` : ''}\nLihat detail karya selengkapnya di sini:\n👉 ${shareUrl}\n\nYuk lihat karya-karya inspiratif lainnya di:\n👉 sukabumiberliterasi.netlify.app`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredWorks = worksRows.map((r, originalIdx) => ({ r, originalIdx })).filter(({ r }) => {
    const title = String(r[1] || '').toLowerCase();
    const author = String(r[3] || '').toLowerCase();
    const type = String(r[2] || '').toLowerCase();
    
    return title.includes(search.toLowerCase()) || 
           author.includes(search.toLowerCase()) ||
           type.includes(search.toLowerCase());
  });

  return (
    <section className="space-y-6">

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-[#eafaf6]">Koleksi Karya</h2>
        <p className="text-slate-600 dark:text-teal-200/80 opacity-70 text-sm">
          Apresiasi kreativitas komunitas Sukabumi
        </p>
        <div className="relative w-full">
          <input
            className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-full px-6 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 w-full text-slate-800 dark:text-[#eafaf6] text-sm"
            placeholder="Cari judul, pembuat, atau jenis karya..."
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="material-symbols-outlined absolute right-4 top-2.5 text-on-surface-variant dark:text-on-surface-variant opacity-50">
            search
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel rounded-3xl p-5 h-32 shimmer"></div>
          ))}
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className="text-center py-12 opacity-60">
          <span className="material-symbols-outlined text-5xl">draw</span>
          <p className="mt-2 text-sm font-semibold">Karya tidak ditemukan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorks.map(({ r, originalIdx }) => {
            const title = r[1] || 'Karya Literasi';
            const type = r[2] || 'Karya';
            const logo = r[3] || '';
            const author = r[4] || 'Pegiat';
            const medsos = r[5] || '';
            const description = r[6] || '';
            const access = r[7] || '';
            
            const isExpanded = !!expandedWorks[originalIdx];

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

            const resolvedLogo = getImageUrl(logo);

            return (
              <div 
                key={originalIdx} 
                id={`work-card-${originalIdx}`}
                className="glass-panel rounded-3xl p-5 hover:bg-white/40 dark:hover:bg-inverse-surface/20 transition-all border-l-4 border-secondary flex flex-col gap-3"
              >
                {/* Top Header Row with Category/Type Tag */}
                <div className="flex justify-between items-center w-full">
                  <span className="bg-teal-500/10 dark:bg-teal-400/10 text-primary dark:text-[#4edea3] text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {type}
                  </span>
                </div>

                {/* Main Content Row: Image + Text Info */}
                <div className="flex items-center gap-3">
                  {resolvedLogo && (
                    <img 
                      src={resolvedLogo} 
                      alt={title} 
                      className="w-12 h-12 rounded-2xl object-cover bg-surface-container shrink-0 border border-teal-500/10 dark:border-teal-500/20"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-[#eafaf6] leading-snug break-words">
                      {title}
                    </h4>
                    <div className="space-y-0.5 text-[10px] text-slate-600 dark:text-teal-200/80 opacity-80">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">person</span>
                        <span>Oleh: <strong>{author}</strong></span>
                      </div>
                      {medsos && (
                        <div className="flex items-center gap-1 text-primary dark:text-[#4edea3]">
                          <span className="material-symbols-outlined text-xs">alternate_email</span>
                          <span className="truncate">{medsos}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Content */}
                {isExpanded && (description || access) && (
                  <div className="space-y-3 animate-in fade-in pt-1">
                    {description && (
                      <p className="text-xs text-slate-700 dark:text-teal-100/90 leading-relaxed whitespace-pre-line">
                        {description}
                      </p>
                    )}
                    {access && (
                      <div className="bg-surface-container/50 dark:bg-inverse-surface/30 p-3 rounded-xl border border-teal-500/5">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1">Akses Produk / Karya:</span>
                        <p className="text-xs text-slate-800 dark:text-[#eafaf6] leading-relaxed whitespace-pre-line font-medium">
                          {access}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Always-visible Action Row */}
                <div className="pt-2 border-t border-dashed border-teal-500/10 flex items-center justify-between gap-2">
                  {description || access ? (
                    <button 
                      onClick={() => toggleExpand(originalIdx)}
                      className="flex items-center gap-1 text-xs font-bold text-primary dark:text-[#4edea3] hover:underline border-0 bg-transparent cursor-pointer"
                    >
                      <span>{isExpanded ? 'Sembunyikan Detail' : 'Lihat Detail & Akses'}</span>
                      <span className="material-symbols-outlined text-sm transition-transform duration-300">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-teal-200/40">Kolaborator Umum</span>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleGenerateCertificate(title, author, type)}
                      className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline border-0 bg-transparent cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm font-fill">verified</span>
                      <span>Sertifikat</span>
                    </button>
                    
                    <button
                      onClick={() => handleShareWork(title, author, type, description)}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-[#4edea3] hover:underline border-0 bg-transparent cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">share</span>
                      <span>Bagikan</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Pratinjau Sertifikat */}
      {certWork && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-teal-500/20 rounded-3xl p-5 max-w-[500px] w-full flex flex-col gap-4 relative animate-in scale-in duration-200">
            
            <button 
              onClick={() => setCertWork(null)}
              className="absolute top-4 right-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-teal-200 rounded-full p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors z-20 flex items-center justify-center border-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
            
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-[#eafaf6]">Sertifikat Apresiasi Karya</h3>
              <p className="text-[10px] text-slate-500 dark:text-teal-200/50">Pratinjau sertifikat apresiasi resmi Sukabumi Berliterasi</p>
            </div>

            <div className="w-full aspect-[800/565] bg-slate-100 dark:bg-zinc-800 rounded-2xl overflow-hidden border border-teal-500/10 flex items-center justify-center relative">
              {generating ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  <span className="text-[10px] text-slate-500 font-semibold">Membuat sertifikat...</span>
                </div>
              ) : certImage ? (
                <img 
                  src={certImage} 
                  alt="Pratinjau Sertifikat" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-[10px] text-rose-500 font-semibold">Gagal membuat sertifikat.</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                onClick={handleDownloadCert}
                disabled={!certImage || generating}
                className="flex items-center justify-center gap-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded-xl text-[11px] font-black transition-all border-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">download</span>
                Unduh Sertifikat
              </button>
              <button
                onClick={handleShareCertWA}
                disabled={generating}
                className="flex items-center justify-center gap-1 bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-50 text-white py-2 rounded-xl text-[11px] font-black transition-all border-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs font-fill">share</span>
                Bagikan ke WA
              </button>
            </div>

            <p className="text-[9px] text-slate-400 dark:text-teal-200/30 text-center leading-normal">
              *Klik "Unduh Sertifikat" untuk menyimpan gambar PNG beresolusi tinggi ke perangkat Anda, lalu Anda dapat membagikannya langsung ke WhatsApp.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
