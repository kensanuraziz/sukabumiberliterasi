const fs = require('fs');
let content = fs.readFileSync('d:/sukabumi berliterasi/sukabumi berliterasi/apps/web/src/App.jsx', 'utf8');

// 1. Add states to App component
const statesCode = `  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('tokolitera_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState('info');`;

content = content.replace(
  '  const [darkMode, setDarkMode] = useState(false);',
  '  const [darkMode, setDarkMode] = useState(false);\n' + statesCode
);

// 2. Replace Header
const oldHeaderRegex = /<header className="flex justify-between items-center w-full px-5 py-4 sticky top-0 z-30[\s\S]*?<\/header>/;
const newHeader = `<header className="flex justify-between items-center w-full px-5 py-4 sticky top-0 z-30 bg-white/45 dark:bg-[#051411]/45 backdrop-blur-md border-b border-teal-500/10 dark:border-teal-500/20 mt-0 md:mt-2 shadow-sm">
              <div className="flex-1 min-w-0 flex items-center">
                {currentUser ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                      {currentUser.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-[#eafaf6] truncate text-sm leading-tight">Halo, {currentUser.fullName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-teal-200/50 truncate leading-none mt-0.5">{currentUser.email}</p>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full transition-colors border-0 cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    <span className="text-xs font-bold">Masuk / Daftar</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {currentUser && (
                  <>
                    <button
                      onClick={() => {
                        setProfileTab('info');
                        setShowProfileModal(true);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-teal-950/45 dark:hover:bg-teal-950/65 text-slate-600 dark:text-teal-200/80 rounded-full border-0 cursor-pointer flex items-center justify-center transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem('tokolitera_user');
                        setCurrentUser(null);
                        window.dispatchEvent(new Event('tokolitera_logout'));
                      }}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full border-0 cursor-pointer flex items-center justify-center transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                    </button>
                  </>
                )}
                <button 
                  onClick={toggleDarkMode}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-teal-950/45 dark:hover:bg-teal-950/65 rounded-full transition-all text-primary dark:text-primary border-0 cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {darkMode ? 'light_mode' : 'dark_mode'}
                  </span>
                </button>
              </div>
            </header>`;
content = content.replace(oldHeaderRegex, newHeader);

// 3. Replace SupportSection usage
const oldSupportRegex = /\{\s*activePage === 'support' && \([\s\S]*?<SupportSection[\s\S]*?\/>\s*\)\s*\}/;
const newSupport = `<div className={activePage === 'support' ? 'block' : 'hidden'}>
                <SupportSection 
                  products={products} 
                  loading={loadingProducts} 
                  shippingServices={shippingServices}
                  isHidden={activePage !== 'support'}
                  currentUser={currentUser}
                  setCurrentUser={setCurrentUser}
                  showAuthModal={showAuthModal}
                  setShowAuthModal={setShowAuthModal}
                  authMode={authMode}
                  setAuthMode={setAuthMode}
                  showProfileModal={showProfileModal}
                  setShowProfileModal={setShowProfileModal}
                  profileTab={profileTab}
                  setProfileTab={setProfileTab}
                />
              </div>`;
content = content.replace(oldSupportRegex, newSupport);

fs.writeFileSync('d:/sukabumi berliterasi/sukabumi berliterasi/apps/web/src/App.jsx', content, 'utf8');
console.log('App.jsx modified');
