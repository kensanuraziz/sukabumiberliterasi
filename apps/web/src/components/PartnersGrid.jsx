import React, { useState } from 'react';
import html2canvas from 'html2canvas';

export default function PartnersGrid({ partners, loading }) {
  const partnersRows = partners.slice(1); // skip headers
  const [openPartners, setOpenPartners] = useState({});
  const [certPartner, setCertPartner] = useState(null);
  const [certImage, setCertImage] = useState(null);
  const [generating, setGenerating] = useState(false);

  React.useEffect(() => {
    if (!loading && partners && partners.length > 1) {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      const titleParam = params.get('title');
      if (pageParam === 'partners' && titleParam) {
        const decodedTitle = decodeURIComponent(titleParam);
        const partnersRows = partners.slice(1);
        const matchedIdx = partnersRows.findIndex(r => (r[1] || '').toLowerCase() === decodedTitle.toLowerCase() || r[1] === decodedTitle);
        if (matchedIdx !== -1) {
          setOpenPartners(prev => ({
            ...prev,
            [matchedIdx]: true
          }));
          setTimeout(() => {
            const element = document.getElementById(`partner-card-${matchedIdx}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [partners, loading]);

  const handleGenerateCertificate = async (name) => {
    setCertPartner({ name });
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
          <h1 style="font-size: 26px; font-weight: 800; color: #0f766e; letter-spacing: 0.05em; margin: 0; text-transform: uppercase;">Sertifikat Apresiasi Mitra Kolaborasi</h1>
          <p style="font-size: 14px; font-style: italic; color: #475569; margin: 8px 0 0 0;">Diberikan dengan hormat kepada:</p>
        </div>

        <div style="margin: 15px 0;">
          <h2 style="font-size: 28px; font-weight: 800; color: #1e293b; border-bottom: 2px solid rgba(217, 119, 6, 0.4); padding-bottom: 8px; display: inline-block; min-width: 450px;">${name}</h2>
        </div>

        <div style="max-width: 620px; margin: 0 auto; line-height: 1.6; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <p style="font-size: 14px; color: #334155; margin: 0;">
            Atas kolaborasi, dedikasi, dan kontribusi aktifnya bersama Sukabumi Berliterasi dalam membangun ekosistem literasi yang inklusif dan berkelanjutan di Sukabumi.
          </p>
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
    if (!certImage || !certPartner) return;
    const link = document.createElement('a');
    link.download = `Sertifikat_Apresiasi_Mitra_${certPartner.name.replace(/\s+/g, '_')}.png`;
    link.href = certImage;
    link.click();
  };

  const handleShareCertWA = () => {
    if (!certPartner) return;
    const shareUrl = `${window.location.origin}?page=partners&title=${encodeURIComponent(certPartner.name)}`;
    const shareText = `Halo! Kami mengapresiasi kolaborasi bersama Mitra "${certPartner.name}" di Sukabumi Berliterasi! 🤝 Informasi kolaborasi lengkap dapat dilihat di:\n👉 ${shareUrl}\n\nMari berkolaborasi di: sukabumiberliterasi.netlify.app`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const togglePartner = (idx) => {
    setOpenPartners(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleSharePartner = (name, address, medsos, contribution) => {
    const shareUrl = `${window.location.origin}?page=partners&title=${encodeURIComponent(name)}`;
    const text = `*Mitra Kolaborasi Sukabumi Berliterasi*\n\n*Nama Instansi/Komunitas:* ${name}\n${address ? `*Alamat:* ${address}\n` : ''}${medsos ? `*Sosial Media:* ${medsos}\n` : ''}${contribution && contribution !== 'belum diisi' ? `*Bentuk Kolaborasi:* ${contribution}\n` : ''}\nLihat detail mitra kolaborasi di sini:\n👉 ${shareUrl}\n\nMari berkolaborasi membangun literasi bersama di:\n👉 sukabumiberliterasi.netlify.app`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-[#eafaf6]">Mitra Kolaborasi</h2>
        <p className="text-slate-600 dark:text-teal-200/80 text-sm">
          Apresiasi kepada lembaga, komunitas, dan instansi pendukung literasi.
        </p>
      </div>



      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="glass-panel p-5 h-28 shimmer rounded-3xl"></div>
          ))}
        </div>
      ) : partnersRows.length === 0 ? (
        <div className="text-center opacity-60 py-12">
          <span className="material-symbols-outlined text-5xl">handshake</span>
          <p className="mt-2 text-sm font-semibold">Belum ada mitra kolaborasi terdaftar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {partnersRows.map((r, i) => {
            const name = r[1] || 'Mitra Kolaborasi';
            const address = r[2] || '';
            const medsos = r[3] || '';
            const logo = r[4] || '';
            const contribution = r[5] || '';
            const isOpen = !!openPartners[i];

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
                key={i} 
                id={`partner-card-${i}`}
                className="glass-panel rounded-3xl p-5 hover:bg-white/40 dark:hover:bg-inverse-surface/20 transition-all border-l-4 border-primary flex flex-col gap-3"
              >
                {/* Header Instansi */}
                <div className="w-full flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {resolvedLogo && (
                      <img 
                        src={resolvedLogo} 
                        alt={name} 
                        className="w-12 h-12 rounded-xl object-cover bg-surface-container shrink-0 border border-teal-500/10 dark:border-teal-500/20"
                        loading="lazy"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-base text-slate-800 dark:text-[#eafaf6] hover:text-primary dark:hover:text-inverse-primary transition-colors leading-snug">
                         {name}
                       </h4>
                       {address && (
                         <p className="text-xs text-slate-600 dark:text-teal-200/80 opacity-75 mt-1 flex items-start gap-1">
                           <span className="material-symbols-outlined text-sm mt-0.5">location_on</span>
                           <span>{address}</span>
                         </p>
                       )}
                       {medsos && (
                         <p className="text-xs text-primary dark:text-primary font-semibold mt-1 flex items-center gap-1">
                           <span className="material-symbols-outlined text-sm">alternate_email</span>
                           <span>{medsos}</span>
                         </p>
                       )}
                    </div>
                  </div>
                </div>
                
                {/* Collapsible Contribution details */}
                {isOpen && contribution && contribution !== 'belum diisi' && (
                  <div className="bg-surface-container/50 dark:bg-inverse-surface/30 p-3 rounded-xl animate-in fade-in">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant opacity-60 mb-1">
                      Bentuk Kolaborasi / Kontribusi:
                    </div>
                    <p className="text-xs text-slate-800 dark:text-[#eafaf6] leading-relaxed whitespace-pre-line">
                      {contribution}
                    </p>
                  </div>
                )}

                {/* Always-visible Action Row */}
                <div className="pt-2 border-t border-dashed border-teal-500/10 flex items-center justify-between gap-2">
                  {contribution && contribution !== 'belum diisi' ? (
                    <button 
                      onClick={() => togglePartner(i)}
                      className="flex items-center gap-1 text-xs font-bold text-primary dark:text-[#4edea3] hover:underline border-0 bg-transparent cursor-pointer"
                    >
                      <span>{isOpen ? 'Sembunyikan Kolaborasi' : 'Lihat Bentuk Kolaborasi'}</span>
                      <span className="material-symbols-outlined text-sm transition-transform duration-300">
                        {isOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-teal-200/40">Kolaborator Umum</span>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleGenerateCertificate(name)}
                      className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline border-0 bg-transparent cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm font-fill">verified</span>
                      <span>Sertifikat</span>
                    </button>
                    
                    <button
                      onClick={() => handleSharePartner(name, address, medsos, contribution)}
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
      {certPartner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-teal-500/20 rounded-3xl p-5 max-w-[500px] w-full flex flex-col gap-4 relative animate-in scale-in duration-200">
            
            <button 
              onClick={() => setCertPartner(null)}
              className="absolute top-4 right-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-teal-200 rounded-full p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors z-20 flex items-center justify-center border-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
            
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-[#eafaf6]">Sertifikat Apresiasi Mitra</h3>
              <p className="text-[10px] text-slate-500 dark:text-teal-200/50">Pratinjau sertifikat apresiasi mitra kolaborasi resmi Sukabumi Berliterasi</p>
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
