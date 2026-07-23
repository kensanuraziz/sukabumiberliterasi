import React from 'react';

export default function Navigation({ activePage, setActivePage }) {
  const menuItems = [
    { id: 'komunitas', label: 'Komunitas', icon: 'groups' },
    { id: 'event', label: 'Event', icon: 'event' },
    { id: 'home', label: 'Warta', icon: 'home', isCenter: true },
    { id: 'challenge', label: 'Challenge', icon: 'military_tech' },
    { id: 'support', label: 'Tokolitera', icon: 'storefront' }
  ];

  return (
    <nav className="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/45 dark:bg-[#051411]/45 backdrop-blur-xl border-t border-teal-500/10 dark:border-teal-500/20 shadow-lg">
      {menuItems.map(item => {
        const isActive = activePage === item.id;
        if (item.isCenter) {
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center justify-center p-2 transition-transform hover:scale-110 rounded-full w-12 h-12 -mt-6 bg-primary text-white shadow-lg ${
                isActive ? 'active-dot relative' : ''
              }`}
            >
              <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            </button>
          );
        }
        return (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`flex flex-col items-center justify-center p-2 transition-transform hover:scale-110 ${
              isActive ? 'text-primary dark:text-inverse-primary font-bold relative active-dot' : 'text-slate-500 dark:text-teal-200/50 opacity-80 hover:opacity-100'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="text-[9px] uppercase font-extrabold tracking-wider mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
