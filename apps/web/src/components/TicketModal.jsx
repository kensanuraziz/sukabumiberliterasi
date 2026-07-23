import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';

export default function TicketModal({ event, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const ticketRef = useRef(null);

  if (!event) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) {
      setSubmitted(true);
    }
  };

  const handleDownload = () => {
    if (!ticketRef.current) return;
    
    // Temporarily hide notches borders or adjust styles for clean screenshot
    html2canvas(ticketRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `ticket-berliterasi-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const handleShare = async () => {
    const shareText = `Halo! Saya sudah terdaftar untuk kegiatan "${event.title}". Sampai jumpa di sana!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tiket Sukabumi Berliterasi',
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.log('Sharing canceled:', err);
      }
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Teks pendaftaran disalin ke clipboard!');
      }).catch(err => {
        console.error('Failed to copy share text:', err);
      });
    }
  };

  const waAdminLink = `https://wa.me/6281385586238?text=${encodeURIComponent(
    `Halo Admin, saya telah mendaftar ke kegiatan:\n*${event.title}*\n\nNama: *${name}*\nWhatsApp: *${phone}*\nMohon konfirmasi pendaftaran saya. Terima kasih!`
  )}`;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md glass-panel rounded-[2.5rem] p-8 shadow-2xl transition-all scale-100 opacity-100 text-slate-800 dark:text-[#eafaf6]">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface dark:hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {!submitted ? (
          <div id="reg-form-container">
            <div className="text-center space-y-2 mb-8">
               <h3 className="text-2xl font-bold text-slate-800 dark:text-[#eafaf6]">Daftar Kegiatan</h3>
              <p className="text-slate-600 dark:text-teal-200/80 text-sm">{event.title}</p>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-60">
                  Nama Lengkap
                </label>
                <input
                  className="w-full bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 dark:text-[#eafaf6]"
                  placeholder="Contoh: Budi Sudarsono"
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-60">
                  Nomor WhatsApp
                </label>
                <input
                  className="w-full bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 dark:text-[#eafaf6]"
                  placeholder="08xx xxxx xxxx"
                  required
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <button
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                type="submit"
              >
                Dapatkan Tiket
              </button>
            </form>
          </div>
        ) : (
          <div className="animate-in fade-in">
            <div className="text-center space-y-2 mb-6">
               <h3 className="text-2xl font-bold text-slate-800 dark:text-[#eafaf6]">Pendaftaran Berhasil!</h3>
              <p className="text-slate-600 dark:text-teal-200/80 text-sm">Simpan tiket Anda di bawah ini</p>
            </div>

            {/* Boarding Pass Canvas */}
            <div 
              ref={ticketRef}
              className="bg-gradient-to-br from-primary-container to-primary text-white rounded-3xl overflow-hidden shadow-xl p-0"
              id="ticket-canvas"
            >
              <div className="p-8 pb-4 space-y-4 border-b-2 border-white/20 border-dashed relative">
                <div className="flex justify-between items-start">
                  <span className="font-black text-xl">BERLITERASI</span>
                  <span className="material-symbols-outlined text-3xl">qr_code_2</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-extrabold leading-tight line-clamp-2">
                    {event.title}
                  </h4>
                  <p className="text-sm opacity-80">{name}</p>
                </div>
                
                {/* Notches for boarding pass ticket aesthetic */}
                <div className="absolute -left-3 -bottom-3 w-6 h-6 bg-[#ebfaf6] dark:bg-[#0c2622] rounded-full"></div>
                <div className="absolute -right-3 -bottom-3 w-6 h-6 bg-[#ebfaf6] dark:bg-[#0c2622] rounded-full"></div>
              </div>
              <div className="p-8 pt-4 space-y-4">
                <div className="flex justify-between text-[10px] font-bold opacity-70">
                  <div>DATE / TIME</div>
                  <div>LOCATION</div>
                </div>
                <div className="flex justify-between items-end gap-2">
                  <div className="text-base font-bold">{event.time}</div>
                  <div className="text-sm font-bold text-right line-clamp-1">Sukabumi Hub</div>
                </div>
                <div className="pt-4 text-[10px] opacity-60 leading-tight">
                  *Tunjukkan tiket ini saat kedatangan. Tiket digital ini sah dan diterbitkan oleh Sistem Berliterasi Sukabumi.
                </div>
              </div>
            </div>

            {/* Warning Alert Box */}
            <div className="mt-6 p-4 bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-1.5 text-amber-800 dark:text-amber-800">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>Wajib Konfirmasi WhatsApp!</span>
              </div>
              <p className="leading-relaxed opacity-95">
                Setelah mengunduh/menyimpan tiket, Anda <strong>wajib mengirimkan bukti pendaftaran (tiket) ini</strong> ke nomor WhatsApp <a href={waAdminLink} target="_blank" rel="noopener noreferrer" className="underline font-black hover:text-amber-600 dark:hover:text-amber-600">081385586238</a> untuk konfirmasi kegiatan. Jika tidak, Anda dianggap <strong>tidak mendaftar</strong> (hanya pendataan saja).
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button 
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-3 bg-surface-container dark:bg-surface-container hover:bg-surface-container-high dark:hover:bg-surface-container-high rounded-xl text-sm font-bold text-on-surface dark:text-on-surface transition-all"
              >
                <span className="material-symbols-outlined text-sm">download</span> Simpan
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center justify-center gap-2 py-3 bg-surface-container dark:bg-surface-container hover:bg-surface-container-high dark:hover:bg-surface-container-high rounded-xl text-sm font-bold text-on-surface dark:text-on-surface transition-all"
              >
                <span className="material-symbols-outlined text-sm">share</span> Bagikan
              </button>
            </div>
            
            <a 
              className="block text-center mt-6 text-xs font-bold text-primary dark:text-primary hover:underline" 
              href={waAdminLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Butuh Bantuan? Hubungi Admin via WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
