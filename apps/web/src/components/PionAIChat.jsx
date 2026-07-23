import React, { useState, useEffect, useRef } from 'react';

export const PionMascot = ({ size = 40, className = "" }) => (
  <div 
    style={{ width: size, height: size }} 
    className={`bg-white/95 dark:bg-[#0b2420]/90 p-1 rounded-full flex items-center justify-center shrink-0 border border-teal-500/20 shadow-sm ${className}`}
  >
    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="85" rx="35" ry="10" fill="black" fillOpacity="0.1" />
      <path d="M20 80C20 75 35 70 50 70C65 70 80 75 80 80C80 85 65 88 50 88C35 88 20 85 20 80Z" fill="#14b8a6" />
      <path d="M35 55C35 70 42 70 50 70C58 70 65 70 65 55C65 45 35 45 35 55Z" fill="#0d9488" />
      <circle cx="50" cy="35" r="22" fill="#14b8a6" />
      <circle cx="43" cy="33" r="3" fill="#0f172a" />
      <circle cx="57" cy="33" r="3" fill="#0f172a" />
      <circle cx="44.2" cy="31.8" r="1" fill="white" />
      <circle cx="58.2" cy="31.8" r="1" fill="white" />
      <path d="M46 41C48 43 52 43 54 41" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="38" cy="37" r="1.8" fill="#f43f5e" fillOpacity="0.6" />
      <circle cx="62" cy="37" r="1.8" fill="#f43f5e" fillOpacity="0.6" />
    </svg>
  </div>
);

export default function PionAIChat() {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: 'Halo! Saya Pion AI. Teman melangkah bijak, teman mengasah akal. Ada yang ingin kamu diskusikan seputar tips kehidupan, literasi, atau motivasi hari ini?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      // 1. Coba panggil serverless function Netlify
      let res = null;
      try {
        res = await fetch('/.netlify/functions/pion-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: userText })
        });
      } catch (err) {
        console.warn("Netlify function tidak tersedia, mencoba fallback client-side...", err);
      }
      
      if (res && res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply || 'Pion AI tidak memberikan jawaban.' }]);
        setLoading(false);
        return;
      }

      // 2. Fallback: Panggil API Gemini langsung dari client jika ada API Key di .env lokal
      const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (clientApiKey) {
        const systemInstruction = "Pion AI: Teman Melangkah Bijak, Teman Mengasah Akal. AI harus fokus menjawab pertanyaan seputar tips langkah-langkah kehidupan yang baik, motivasi belajar, skil Literasi dan strategi kehidupan pemahaman agama ringan. Jawablah secara santun, bijak, inspiratif, dan ringkas.";
        
        const clientRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: userText }] }
            ],
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          })
        });

        if (clientRes.ok) {
          const clientData = await clientRes.json();
          const reply = clientData.candidates?.[0]?.content?.parts?.[0]?.text || 'Pion AI tidak memberikan jawaban.';
          setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
          setLoading(false);
          return;
        } else {
          const errText = await clientRes.text();
          console.error("Direct Gemini API error:", clientRes.status, errText);
        }
      }

      // Jika keduanya gagal
      setMessages(prev => [...prev, { role: 'assistant', text: 'Maaf, Pion AI tidak dapat merespon saat ini. Hubungi admin atau pastikan GEMINI_API_KEY Anda telah dikonfigurasi di .env atau Netlify.' }]);
    } catch (err) {
      console.error("General chat error:", err);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Maaf, terjadi kesalahan koneksi.' }]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Pesan berhasil disalin!');
  };

  return (
    <div className="glass-panel p-4 rounded-[2rem] border border-teal-500/20 bg-teal-50/10 dark:bg-[#081e1a]/25 flex flex-col h-[380px] w-full max-w-md mx-auto">
      {/* Chatbox Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-teal-500/10 shrink-0">
        <PionMascot size={32} />
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-[#eafaf6]">Pion AI</h3>
          <p className="text-[10px] text-teal-600 dark:text-[#4edea3] font-medium leading-none">Teman Melangkah Bijak, Teman Mengasah Akal</p>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            {msg.role === 'assistant' && <PionMascot size={24} className="shrink-0 mt-0.5" />}
            <div className="space-y-1">
              <div 
                className={`p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-sm' 
                    : 'bg-white/60 dark:bg-black/30 text-slate-800 dark:text-[#eafaf6] border border-teal-500/5 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
              {/* Message actions for assistant */}
              {msg.role === 'assistant' && (
                <div className="flex gap-2 pl-1 opacity-70">
                  <button 
                    onClick={() => copyToClipboard(msg.text)}
                    className="text-[9px] font-bold text-primary dark:text-[#4edea3] hover:underline flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[10px]">content_copy</span>
                    Salin
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex gap-2 items-center text-slate-600 dark:text-teal-200/80 mr-auto max-w-[85%]">
            <PionMascot size={24} className="shrink-0 animate-bounce" />
            <div className="bg-white/40 dark:bg-black/25 p-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="pt-2 border-t border-teal-500/10 flex gap-2 shrink-0">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan motivasi, belajar, atau tips kehidupan..."
          className="flex-1 bg-white/70 dark:bg-black/40 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-[#eafaf6]"
          disabled={loading}
        />
        <button 
          type="submit"
          className="bg-primary hover:bg-primary-hover text-white p-2 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 transition-all"
          disabled={!input.trim() || loading}
        >
          <span className="material-symbols-outlined text-sm">send</span>
        </button>
      </form>
    </div>
  );
}
