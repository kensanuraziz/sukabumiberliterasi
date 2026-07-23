import React, { useState, useEffect, useRef } from 'react';
import Navigation from './components/Navigation';
import NewsGrid from './components/NewsGrid';
import AgendaList from './components/AgendaList';
import WorksGrid from './components/WorksGrid';
import PartnersGrid from './components/PartnersGrid';
import CommunityScreen from './components/CommunityScreen';
import ChallengeScreen from './components/ChallengeScreen';
import SupportSection from './components/SupportSection';
import TicketModal from './components/TicketModal';
import { useBlogger } from './hooks/useBlogger';
import { useGoogleSheets } from './hooks/useGoogleSheets';

export default function App() {
  const [activePage, setActivePage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    if (pageParam && ['home', 'komunitas', 'event', 'challenge', 'support'].includes(pageParam)) {
      return pageParam;
    }
    return 'event';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [showSplash, setShowSplash] = useState(true);
  const [userCoords, setUserCoords] = useState(null); // { latitude, longitude }
  const [isIslamicExpanded, setIsIslamicExpanded] = useState(false);
  const mainScrollRef = useRef(null);

  // Scroll to top of the content area when page changes
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    // Sync page to URL for persistence on refresh (#3)
    const url = new URL(window.location);
    url.searchParams.set('page', activePage);
    window.history.replaceState({}, '', url);
  }, [activePage]);

  // Google Sheets IDs
  const SHEET_AGENDA = '1KggpPNdk09m7GxrIrKLWjtQhcEkvFPR6r2JFP7I4DX8';
  const SHEET_WORKS = '1fD4HaV4-ZFTMRDLhsXVKQzxNFYl7PG0AkilQjAQvx6s';
  const SHEET_PARTNERS = '11ueCaQJYp4U4gpArmipBdaZ1PfA-DZeC_hqA4t3rptQ';
  const SHEET_PRODUCTS = '1GVjNbE1ugqGxuIB9EWMCP8oTgEK8Vi8S56Owpk_45tc';
  const SHEET_SHIPPING = '1Qm8jp0fXGGMy0-WOXrwEZXqiUBtZvdH1-7Jv5umXd2s';

  // Custom Hooks data fetching
  const { news, loading: loadingNews } = useBlogger();
  const { data: agenda, loading: loadingAgenda } = useGoogleSheets(SHEET_AGENDA);
  const { data: works, loading: loadingWorks } = useGoogleSheets(SHEET_WORKS);
  const { data: partners, loading: loadingPartners } = useGoogleSheets(SHEET_PARTNERS);
  const { data: products, loading: loadingProducts } = useGoogleSheets(SHEET_PRODUCTS);
  const { data: shippingServices, loading: loadingShipping } = useGoogleSheets(SHEET_SHIPPING);

  // Sync Dark/Light class on html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Simulate Splash screen loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#daf2ec] to-[#f0faf7] dark:from-[#030908] dark:to-[#091210] flex items-center justify-center p-0 md:p-6 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative ambient glowing blurred lights in background on desktop */}
      <div className="hidden md:block absolute top-1/4 left-1/3 w-80 h-80 bg-teal-400/20 dark:bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse"></div>
      <div className="hidden md:block absolute bottom-1/4 right-1/3 w-80 h-80 bg-emerald-400/20 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse"></div>
      
      {/* simulated portrait phone shell */}
      <div className="relative w-full max-w-[440px] h-[100dvh] md:h-[840px] bg-gradient-to-b from-[#ffffff] via-[#ebfaf6] to-[#ccf2e8] dark:bg-gradient-to-b dark:from-[#051411] dark:via-[#0b2621] dark:to-[#12362e] text-slate-800 dark:text-[#eafaf6] shadow-2xl rounded-none md:rounded-[3rem] border-0 md:border-[10px] md:border-slate-900/95 dark:md:border-zinc-800/95 overflow-hidden flex flex-col bg-dots">
        {/* camera notch simulation on desktop */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-900 dark:bg-zinc-800 rounded-b-2xl z-[90]"></div>
        
        {showSplash ? (
          /* Splash Screen */
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#ffffff] via-[#ebfaf6] to-[#ccf2e8] dark:from-[#051411] dark:to-[#12362e] transition-opacity duration-700">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              <div className="relative bg-primary text-white w-full h-full rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="material-symbols-outlined text-4xl font-fill">auto_stories</span>
              </div>
            </div>
            <h1 className="text-2xl font-black text-primary dark:text-[#4edea3] mb-1">Berliterasi</h1>
            <p className="text-slate-600 dark:text-teal-200/80 text-[11px] opacity-80">
              Jendela Ilmu Digital untuk Warga Sukabumi
            </p>
          </div>
        ) : (
          /* App Container Layout */
          <>
            {/* Topbar Header - hidden on support page (tokolitera has its own header) */}
            {activePage !== 'support' && (
            <header className="flex justify-between items-center w-full px-5 py-3 sticky top-0 z-30 bg-white/45 dark:bg-[#051411]/45 backdrop-blur-md border-b border-teal-500/10 dark:border-teal-500/20 mt-0 md:mt-2">
              {/* Left Section - Islamic feature toggle */}
              <div className="w-16 flex justify-start">
                {activePage === 'home' && (
                  <button 
                    onClick={() => setIsIslamicExpanded(!isIslamicExpanded)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-teal-950/65 rounded-full transition-all text-primary dark:text-primary border-0 bg-transparent cursor-pointer flex items-center justify-center"
                    title="Jadwal Sholat, Kiblat & Ayat"
                  >
                    <span className={`material-symbols-outlined text-xl ${isIslamicExpanded ? 'font-fill text-emerald-500' : ''}`}>
                      mosque
                    </span>
                  </button>
                )}
              </div>

              {/* Center Section - Logo or Text */}
              <div className="flex-1 flex justify-center items-center gap-2">
                {activePage === 'home' ? (
                  <>
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">LIVE</span>
                    </div>
                    <h1 className="text-base font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 font-sans drop-shadow-sm">
                      Litera <span className="text-emerald-500 font-extrabold underline decoration-emerald-400/40 underline-offset-4">News</span>
                    </h1>
                  </>
                ) : (
                  <h1 className="text-sm font-black text-primary dark:text-primary tracking-wide text-center">
                    Sukabumi Berliterasi
                  </h1>
                )}
              </div>

              {/* Right Section - Theme Toggle */}
              <div className="w-16 flex justify-end">
                <button 
                  onClick={toggleDarkMode}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-teal-950/65 rounded-full transition-all text-primary dark:text-primary border-0 bg-transparent cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xl">
                    {darkMode ? 'light_mode' : 'dark_mode'}
                  </span>
                </button>
              </div>
            </header>
            )}
 
            {/* Scrollable Main Area Content */}
            <div ref={mainScrollRef} className="flex-1 overflow-y-auto pb-32 pt-2 px-4 scroll-smooth">
              {activePage === 'home' && (
                <NewsGrid 
                  news={news} 
                  loading={loadingNews} 
                  userCoords={userCoords} 
                  setUserCoords={setUserCoords} 
                  isIslamicExpanded={isIslamicExpanded}
                  setIsIslamicExpanded={setIsIslamicExpanded}
                />
              )}
              {activePage === 'event' && (
                <AgendaList agenda={agenda} loading={loadingAgenda} onRegister={setSelectedEvent} userCoords={userCoords} setUserCoords={setUserCoords} />
              )}
              {activePage === 'komunitas' && (
                <CommunityScreen works={works} loadingWorks={loadingWorks} partners={partners} loadingPartners={loadingPartners} />
              )}
              {activePage === 'challenge' && (
                <ChallengeScreen />
              )}
              <div className={activePage === 'support' ? 'block' : 'hidden'}>
                <SupportSection 
                  products={products} 
                  loading={loadingProducts} 
                  shippingServices={shippingServices}
                  isHidden={activePage !== 'support'}
                  darkMode={darkMode}
                  toggleDarkMode={toggleDarkMode}
                />
              </div>
            </div>

            {/* Bottom Tab Bar navigation controls */}
            <Navigation 
              activePage={activePage} 
              setActivePage={setActivePage} 
            />
          </>
        )}

        {/* Modal Overlay Pendaftaran & Tiket */}
        {selectedEvent && (
          <TicketModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)} 
          />
        )}
      </div>
    </div>
  );
}
