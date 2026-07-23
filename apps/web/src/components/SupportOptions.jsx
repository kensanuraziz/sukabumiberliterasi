import React from 'react';

export default function SupportOptions() {
  return (
    <div className="space-y-4">
      <div className="glass-panel p-6 rounded-[2rem] space-y-6">
        {/* Option 1: Gabung Grup WhatsApp */}
        <div className="flex gap-4 items-start">
          <span className="material-symbols-outlined text-white bg-primary p-3 rounded-2xl h-fit shrink-0">
            group
          </span>
          <div>
            <h4 className="font-bold text-base text-slate-800 dark:text-[#eafaf6]">Gabung Grup WhatsApp</h4>
            <p className="text-xs opacity-75 text-slate-600 dark:text-teal-200/80 leading-relaxed">
              Mari berkolaborasi dan berbagi inspirasi bersama Sukabumi Berliterasi.
            </p>
            <a 
              className="text-primary dark:text-inverse-primary font-bold text-xs mt-2 inline-block hover:underline" 
              href="https://chat.whatsapp.com/DEwxA6kyCGy55sKeQMwfBP?s=cl&p=a&ilr=2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gabung Grup WA →
            </a>
          </div>
        </div>

        {/* Option 2: Donasi Buku */}
        <div className="flex gap-4 items-start border-t border-white/10 pt-6">
          <span className="material-symbols-outlined text-white bg-primary p-3 rounded-2xl h-fit shrink-0">
            menu_book
          </span>
          <div>
            <h4 className="font-bold text-base text-slate-800 dark:text-[#eafaf6]">Donasi Buku</h4>
            <p className="text-xs opacity-75 text-slate-600 dark:text-teal-200/80 leading-relaxed">
              Salurkan buku layak baca Anda ke alamat sekretariat kami.
            </p>
            <a 
              className="text-primary dark:text-inverse-primary font-bold text-xs mt-2 inline-block hover:underline" 
              href="https://wa.me/6281385586238?text=Halo%20Admin%2C%20saya%20ingin%20donasi%20buku%20layak%20baca."
              target="_blank"
              rel="noopener noreferrer"
            >
              Hubungi Admin →
            </a>
          </div>
        </div>

        {/* Option 3: Gabung Relawan */}
        <div className="flex gap-4 items-start border-t border-white/10 pt-6">
          <span className="material-symbols-outlined text-white bg-primary p-3 rounded-2xl h-fit shrink-0">
            volunteer_activism
          </span>
          <div>
            <h4 className="font-bold text-base text-slate-800 dark:text-[#eafaf6]">Gabung Relawan</h4>
            <p className="text-xs opacity-75 text-slate-600 dark:text-teal-200/80 leading-relaxed">
              Jadilah bagian dari motor penggerak literasi digital untuk warga Sukabumi.
            </p>
            <a 
              className="text-primary dark:text-inverse-primary font-bold text-xs mt-2 inline-block hover:underline" 
              href="https://wa.me/6281385586238?text=Halo%20Admin%2C%20saya%20tertarik%20bergabung%20menjadi%20relawan%20kegiatan%20literasi."
              target="_blank"
              rel="noopener noreferrer"
            >
              Daftar Relawan →
            </a>
          </div>
        </div>

        {/* Option 4: Konsultasi Literasi */}
        <div className="flex gap-4 items-start border-t border-white/10 pt-6">
          <span className="material-symbols-outlined text-white bg-primary p-3 rounded-2xl h-fit shrink-0">
            contact_support
          </span>
          <div>
            <h4 className="font-bold text-base text-slate-800 dark:text-[#eafaf6]">Konsultasi Literasi</h4>
            <p className="text-xs opacity-75 text-slate-600 dark:text-teal-200/80 leading-relaxed">
              Ajukan pertanyaan atau ajakan diskusi program literasi.
            </p>
            <a 
              className="text-primary dark:text-inverse-primary font-bold text-xs mt-2 inline-block hover:underline" 
              href="https://forms.gle/xseCm4TkNTm6Er366" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Buka Formulir →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
