import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

const slugify = (text) => {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

function PrayerTimes() {
  const [timings, setTimings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    async function fetchPrayerTimes() {
      try {
        let res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Sukabumi&country=Indonesia&method=11');
        if (!res.ok) {
          res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Sukabumi&country=Indonesia');
        }
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.timings) {
            setTimings(json.data.timings);
            return;
          }
        }
        throw new Error('API failed');
      } catch (err) {
        console.warn('API error, falling back to local calculation:', err);
        // Fallback to local estimated timings
        setTimings(getEstimatedPrayerTimes(new Date()));
      } finally {
        setLoading(false);
      }
    }

    function getEstimatedPrayerTimes(dateObj) {
      const dayOfYear = Math.floor((dateObj - new Date(dateObj.getFullYear(), 0, 0)) / 86400000);
      const angle = (2 * Math.PI * (dayOfYear - 80)) / 365;
      
      const dzuhurBase = 717 + 10 * Math.sin(angle); 
      const imsakBase = 267 + 12 * Math.sin(angle);  
      const syurukBase = 352 + 10 * Math.sin(angle); 
      
      const formatTime = (minutes) => {
        const h = String(Math.floor(minutes / 60)).padStart(2, '0');
        const m = String(Math.floor(minutes % 60)).padStart(2, '0');
        return `${h}:${m}`;
      };

      return {
        Imsak: formatTime(imsakBase),
        Fajr: formatTime(imsakBase + 10), 
        Sunrise: formatTime(syurukBase),
        Dhuhr: formatTime(dzuhurBase),
        Asr: formatTime(dzuhurBase + 202 + 5 * Math.sin(angle)), 
        Maghrib: formatTime(dzuhurBase + 355 - 4 * Math.sin(angle)), 
        Isha: formatTime(dzuhurBase + 424 - 4 * Math.sin(angle)) 
      };
    }
    fetchPrayerTimes();
  }, []);

  useEffect(() => {
    if (!timings) return;

    const interval = setInterval(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const date = now.getDate();

      const schedule = [
        { name: 'Imsak', time: timings.Imsak },
        { name: 'Subuh', time: timings.Fajr },
        { name: 'Syuruk', time: timings.Sunrise },
        { name: 'Dzuhur', time: timings.Dhuhr },
        { name: 'Ashar', time: timings.Asr },
        { name: 'Maghrib', time: timings.Maghrib },
        { name: 'Isya', time: timings.Isha }
      ];

      const parsedSchedule = schedule.map(item => {
        const [hour, min] = item.time.split(':').map(Number);
        return { name: item.name, date: new Date(year, month, date, hour, min, 0) };
      });

      let next = parsedSchedule.find(item => item.date > now);
      if (!next) {
        const [hour, min] = timings.Imsak.split(':').map(Number);
        const tomorrowImsak = new Date(year, month, date + 1, hour, min, 0);
        next = { name: 'Imsak (Besok)', date: tomorrowImsak };
      }

      setNextPrayer(next.name);

      const diff = next.date - now;
      if (diff > 0) {
        const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        setCountdown(`${hours}:${minutes}:${seconds}`);
      } else {
        setCountdown('00:00:00');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timings]);

  if (loading) {
    return (
      <div className="glass-panel p-4 rounded-3xl h-20 shimmer flex items-center justify-center text-xs opacity-75">
        Memuat Jadwal Shalat...
      </div>
    );
  }

  if (!timings) return null;

  const displayList = [
    { label: 'Imsak', time: timings.Imsak },
    { label: 'Subuh', time: timings.Fajr },
    { label: 'Syuruk', time: timings.Sunrise },
    { label: 'Dzuhur', time: timings.Dhuhr },
    { label: 'Ashar', time: timings.Asr },
    { label: 'Maghrib', time: timings.Maghrib },
    { label: 'Isya', time: timings.Isha }
  ];

  return (
    <div className="glass-panel p-4 rounded-3xl bg-gradient-to-br from-teal-50/30 to-emerald-50/10 dark:from-teal-950/20 dark:to-zinc-950/20 border border-teal-500/15 dark:border-teal-500/30 space-y-4 shadow-xl shadow-teal-500/5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-primary dark:text-[#4edea3]">
          <span className="material-symbols-outlined text-base animate-pulse">mosque</span>
          <span className="text-[10px] font-black uppercase tracking-wider">Jadwal Shalat Sukabumi</span>
        </div>
        {nextPrayer && countdown && (
          <div className="text-[9px] font-extrabold bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/10">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
            </span>
            <span>{nextPrayer}: <strong className="font-mono">{countdown}</strong></span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center">
        {displayList.map((p, idx) => {
          const isUpcoming = nextPrayer && (nextPrayer.toLowerCase().includes(p.label.toLowerCase()) || (p.label === 'Imsak' && nextPrayer === 'Imsak (Besok)'));
          return (
            <div 
              key={idx} 
              className={`p-2 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] ${
                isUpcoming 
                  ? 'bg-gradient-to-br from-primary to-teal-600 text-white shadow-lg shadow-teal-500/20 scale-[1.02] border border-teal-400/30' 
                  : 'bg-white/50 dark:bg-black/35 text-slate-700 dark:text-teal-100/90 border border-teal-500/5 hover:border-teal-500/15'
              }`}
            >
              <div className={`text-[8px] font-extrabold uppercase tracking-wider ${isUpcoming ? 'text-teal-100' : 'text-slate-400 dark:text-teal-200/50'}`}>{p.label}</div>
              <div className="text-xs font-black mt-1 tracking-tight">{p.time}</div>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] italic text-slate-500 dark:text-teal-200/70 text-center font-medium opacity-90 border-t border-dashed border-teal-500/10 pt-3">
        "Tenangkan pikiran, luruskan niat, dan jangan lupa shalat."
      </p>
    </div>
  );
}

function OneDayOneAyat() {
  const [ayat, setAyat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAyat() {
      const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      const verseNumber = (dayOfYear % 6236) + 1;

      try {
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${verseNumber}/editions/quran-uthmani,id.indonesian`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length >= 2) {
            setAyat({
              text: json.data[0].text,
              translation: json.data[1].text,
              ref: `QS. ${json.data[0].surah.englishName}: ${json.data[0].numberInSurah}`
            });
            return;
          }
        }
        throw new Error('API request failed');
      } catch (err) {
        console.warn('Alquran API error, using fallback:', err);
        const fallbacks = [
          { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "Sesungguhnya sesudah kesulitan itu ada kemudahan.", ref: "QS. Al-Insyirah: 6" },
          { text: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", translation: "Jadikanlah sabar dan shalat sebagai penolongmu.", ref: "QS. Al-Baqarah: 45" },
          { text: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", translation: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.", ref: "QS. Al-Baqarah: 286" },
          { text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", translation: "Sungguh, Allah beserta orang-orang yang sabar.", ref: "QS. Al-Baqarah: 153" },
          { text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "Karena sesungguhnya sesudah kesulitan itu ada kemudahan.", ref: "QS. Al-Insyirah: 5" }
        ];
        const selectedFallback = fallbacks[dayOfYear % fallbacks.length];
        setAyat(selectedFallback);
      } finally {
        setLoading(false);
      }
    }
    fetchAyat();
  }, []);

  const copyAyat = () => {
    if (!ayat) return;
    const textToCopy = `${ayat.text}\n\n"${ayat.translation}"\n(${ayat.ref})`;
    navigator.clipboard.writeText(textToCopy);
    alert('Ayat berhasil disalin!');
  };

  const shareAyat = () => {
    if (!ayat) return;
    const shareText = `*One Day One Ayat* 📖\n\n${ayat.text}\n\n_"${ayat.translation}"_\n\n(${ayat.ref})\n\nSukabumi Berliterasi`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="glass-panel p-4 rounded-3xl h-20 shimmer flex items-center justify-center text-xs opacity-75">
        Memuat Ayat Hari Ini...
      </div>
    );
  }

  if (!ayat) return null;

  return (
    <div className="glass-panel p-4 rounded-3xl bg-gradient-to-br from-teal-50/30 to-emerald-50/10 dark:from-teal-950/20 dark:to-zinc-950/20 border border-teal-500/15 dark:border-teal-500/30 space-y-4 shadow-xl shadow-teal-500/5 animate-in fade-in duration-300">
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-1.5 text-primary dark:text-[#4edea3]">
          <span className="material-symbols-outlined text-base">auto_stories</span>
          <span className="text-[10px] font-black uppercase tracking-wider">One Day One Ayat</span>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={copyAyat}
            className="text-[9px] font-black text-slate-600 dark:text-teal-300 hover:text-primary dark:hover:text-[#4edea3] transition-all bg-transparent border-0 cursor-pointer flex items-center gap-0.5"
            title="Salin Ayat"
          >
            <span className="material-symbols-outlined text-xs">content_copy</span>
            Salin
          </button>
          <button 
            onClick={shareAyat}
            className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:underline transition-all bg-transparent border-0 cursor-pointer flex items-center gap-0.5"
            title="Bagikan ke WhatsApp"
          >
            <span className="material-symbols-outlined text-xs">share</span>
            Bagikan
          </button>
        </div>
      </div>
      <div className="space-y-3 py-1 text-center bg-white/35 dark:bg-black/15 p-4 rounded-2xl border border-teal-500/5">
        <p className="text-lg font-medium text-slate-800 dark:text-[#eafaf6] leading-loose text-right pr-2 font-arabic tracking-wide">
          {ayat.text}
        </p>
        <div className="border-t border-dashed border-teal-500/10 my-2"></div>
        <p className="text-[11px] text-slate-600 dark:text-teal-200/80 leading-relaxed italic">
          "{ayat.translation}"
        </p>
        <p className="text-[9px] font-black text-primary dark:text-[#4edea3] tracking-widest uppercase mt-2">
          — {ayat.ref}
        </p>
      </div>
    </div>
  );
}

function QiblaCompass({ userCoords, setUserCoords }) {
  const [qiblaAngle, setQiblaAngle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [compassHeading, setCompassHeading] = useState(0);
  const [hasSensor, setHasSensor] = useState(false);
  const [sensorActive, setSensorActive] = useState(false);

  const calculateQibla = (lat, lon) => {
    const phiU = (lat * Math.PI) / 180;
    const phiK = (21.4225 * Math.PI) / 180;
    const lambdaDiff = ((39.8262 - lon) * Math.PI) / 180;

    const y = Math.sin(lambdaDiff);
    const x = Math.cos(phiU) * Math.tan(phiK) - Math.sin(phiU) * Math.cos(lambdaDiff);

    let qiblaRad = Math.atan2(y, x);
    let qiblaDeg = (qiblaRad * 180) / Math.PI;
    return (qiblaDeg + 360) % 360;
  };

  const handleLocationSuccess = (position) => {
    const { latitude, longitude } = position.coords;
    setUserCoords({ latitude, longitude });
    const angle = calculateQibla(latitude, longitude);
    setQiblaAngle(angle);
    setLoading(false);
    setErrorMsg('');
    initSensor();
  };

  const handleLocationError = (error) => {
    setLoading(false);
    let msg = 'Gagal mengakses GPS. Silakan masukkan koordinat secara manual.';
    if (error.code === error.PERMISSION_DENIED) {
      msg = 'Izin akses lokasi ditolak. Silakan masukkan koordinat secara manual.';
    }
    setErrorMsg(msg);
  };

  const requestGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolokasi tidak didukung oleh browser Anda. Masukkan secara manual.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setErrorMsg('Koordinat tidak valid. Latitude harus antara -90 s/d 90, Longitude -180 s/d 180.');
      return;
    }
    setUserCoords({ latitude: lat, longitude: lon });
    const angle = calculateQibla(lat, lon);
    setQiblaAngle(angle);
    setErrorMsg('');
    initSensor();
  };

  const handleOrientation = (e) => {
    let heading = null;
    if (e.webkitCompassHeading !== undefined) {
      heading = e.webkitCompassHeading;
    } else if (e.absolute && e.alpha !== null) {
      heading = 360 - e.alpha;
    } else if (e.alpha !== null) {
      heading = 360 - e.alpha;
    }
    if (heading !== null) {
      setCompassHeading(heading);
      setHasSensor(true);
    }
  };

  const initSensor = () => {
    if (typeof window === 'undefined') return;
    
    const requestPermissionAndRegister = () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(state => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, true);
              setSensorActive(true);
            } else {
              setErrorMsg('Izin akses sensor orientasi ditolak. Kompas real-time tidak aktif.');
            }
          })
          .catch(err => {
            console.error(err);
          });
      } else {
        if ('ondeviceorientationabsolute' in window) {
          window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        } else {
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
        setSensorActive(true);
      }
    };
    
    requestPermissionAndRegister();
  };

  useEffect(() => {
    if (userCoords) {
      const angle = calculateQibla(userCoords.latitude, userCoords.longitude);
      setQiblaAngle(angle);
    }
  }, [userCoords]);

  return (
    <div className="glass-panel p-4 rounded-3xl bg-gradient-to-br from-teal-50/30 to-emerald-50/10 dark:from-teal-950/20 dark:to-zinc-950/20 border border-teal-500/15 dark:border-teal-500/30 space-y-4 shadow-xl shadow-teal-500/5 animate-in fade-in duration-300">
      <div className="flex items-center gap-1.5 text-primary dark:text-[#4edea3]">
        <span className="material-symbols-outlined text-base">explore</span>
        <span className="text-[10px] font-black uppercase tracking-wider">Penunjuk Arah Kiblat</span>
      </div>

      {!qiblaAngle ? (
        <div className="flex flex-col items-center gap-4 py-3">
          <p className="text-xs text-center text-slate-600 dark:text-teal-200/80 leading-relaxed max-w-xs">
            Izinkan akses lokasi GPS Anda untuk mengetahui sudut derajat dan arah kiblat yang tepat dari posisi Anda.
          </p>
          <button
            onClick={requestGPS}
            disabled={loading}
            className="bg-gradient-to-r from-primary to-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:from-primary-hover hover:to-teal-700 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-teal-500/15 border-0 cursor-pointer"
          >
            {loading ? (
              <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <span className="material-symbols-outlined text-xs">my_location</span>
            )}
            Cari Arah Kiblat
          </button>

          {errorMsg && (
            <div className="w-full text-center space-y-3 mt-1 bg-rose-500/5 dark:bg-rose-500/5 p-3 rounded-2xl border border-rose-500/10">
              <p className="text-[10px] font-extrabold text-rose-500 dark:text-rose-400">{errorMsg}</p>
              <form onSubmit={handleManualSubmit} className="flex gap-2 justify-center max-w-xs mx-auto">
                <input
                  type="number"
                  step="any"
                  placeholder="Lat (e.g. -6.92)"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-[#eafaf6] text-xs px-2.5 py-2 rounded-xl w-1/3 border border-teal-500/15 focus:border-teal-500 outline-none"
                  required
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Lon (e.g. 106.9)"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-[#eafaf6] text-xs px-2.5 py-2 rounded-xl w-1/3 border border-teal-500/15 focus:border-teal-500 outline-none"
                  required
                />
                <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-black px-4 py-2 rounded-xl border-0 cursor-pointer transition-all">
                  Set
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="text-center bg-white/40 dark:bg-black/25 px-4 py-2 rounded-2xl border border-teal-500/5">
            <p className="text-[10px] text-slate-500 dark:text-teal-200/50">
              Lokasi Anda: <strong className="text-slate-800 dark:text-teal-100 font-bold">{userCoords.latitude.toFixed(4)}, {userCoords.longitude.toFixed(4)}</strong>
            </p>
            <p className="text-xs font-black text-primary dark:text-[#4edea3] mt-0.5 tracking-wide">
              Arah Kiblat: {qiblaAngle.toFixed(1)}° dari Utara
            </p>
          </div>

          <div className="relative w-40 h-40 flex items-center justify-center bg-gradient-to-br from-white/60 to-white/10 dark:from-black/40 dark:to-zinc-950/40 rounded-full border border-teal-500/20 shadow-lg shadow-teal-500/5">
            <div
              className="absolute w-36 h-36 rounded-full flex items-center justify-center border border-teal-500/10"
              style={{
                transform: `rotate(${-compassHeading}deg)`,
                transition: hasSensor ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
              }}
            >
              <span className="absolute top-1.5 text-[10px] font-black text-rose-500">U</span>
              <span className="absolute right-1.5 text-[9px] font-extrabold text-slate-500 dark:text-teal-200/60">T</span>
              <span className="absolute bottom-1.5 text-[9px] font-extrabold text-slate-500 dark:text-teal-200/60">S</span>
              <span className="absolute left-1.5 text-[9px] font-extrabold text-slate-500 dark:text-teal-200/60">B</span>

              <div className="absolute inset-3 border border-dashed border-teal-500/15 rounded-full"></div>

              <div
                className="absolute w-full h-full"
                style={{ transform: `rotate(${qiblaAngle}deg)` }}
              >
                <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="material-symbols-outlined text-[#4edea3] text-lg font-fill animate-bounce">mosque</span>
                  <span className="text-[7px] font-black text-[#4edea3] uppercase tracking-widest mt-[-3px]">KIBLAT</span>
                </div>
              </div>
            </div>

            <div className="absolute w-5 h-5 rounded-full bg-primary/20 dark:bg-[#4edea3]/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary dark:bg-[#4edea3]"></div>
            </div>
            
            <div className="absolute top-[-4px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-rose-500 animate-pulse"></div>
          </div>

          <div className="text-center space-y-2">
            {!sensorActive && (
              <button
                onClick={initSensor}
                className="text-[9px] font-black bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-[#4edea3] px-3 py-1.5 rounded-xl transition-all border-0 cursor-pointer"
              >
                Aktifkan Kompas Real-time (Smartphone)
              </button>
            )}
            <p className="text-[9px] text-slate-500 dark:text-teal-200/50 max-w-xs leading-normal">
              {hasSensor
                ? "Kompas aktif secara real-time. Putar perangkat Anda hingga ikon Masjid (Kiblat) sejajar dengan penunjuk atas."
                : "Sensor magnetik tidak terdeteksi. Gunakan sudut derajat kiblat di atas untuk menyelaraskan secara manual dengan kompas fisik."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

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
      const parts = url.split('id=');
      if (parts[1]) {
        id = parts[1].split('&')[0];
      }
    }
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w600` : url;
  }
  return url;
};

const footerModalContent = {
  tentang_kami: {
    title: "Tentang Kami",
    icon: "info",
    body: "Sukabumi Berliterasi adalah gerakan literasi berbasis digital dan komunitas yang didirikan untuk memperluas akses membaca, mendongkrak kreativitas lokal, serta mendokumentasikan warta literasi di wilayah Sukabumi dan sekitarnya. Kami menghadirkan inovasi digital seperti E-Koran, toko merchandise lokal (Tokolitera), dan Warta Literasi (Litera News) untuk mewujudkan masyarakat Sukabumi yang unggul dan berdaya saing melalui literasi."
  },
  redaksi: {
    title: "Redaksi Litera News",
    icon: "groups",
    body: "Dewan Pembina: Pegiat Literasi Sukabumi\nPemimpin Redaksi: Admin Sukabumi Berliterasi\nEditor & Kontributor: Seluruh Komunitas Literasi Sukabumi, relawan pustaka, penulis lokal, dan jurnalis warga Sukabumi."
  },
  kontak_kami: {
    title: "Kontak Kami",
    icon: "contact_support",
    body: "Hubungi redaksi Litera News dan admin Sukabumi Berliterasi untuk kemitraan, iklan, atau kolaborasi:\n\n• WhatsApp: +62 831-6314-0043\n• Email: info.sukabumiberliterasi@gmail.com\n• Instagram: @sukabumiberliterasi\n• Alamat: Sukabumi, Jawa Barat, Indonesia."
  },
  yuk_menulis: {
    title: "Yuk Menulis!",
    icon: "edit_note",
    body: "Kamu punya warta menarik, esai, cerpen, opini, atau puisi? Kirimkan tulisan terbaikmu ke redaksi Litera News melalui email atau WhatsApp kami! Karya yang lolos kurasi akan diterbitkan langsung di website dan aplikasi Sukabumi Berliterasi agar dibaca oleh ribuan pegiat literasi lainnya."
  },
  kebijakan_privasi: {
    title: "Kebijakan Privasi",
    icon: "security",
    body: "Kebijakan Privasi ini menjelaskan bagaimana Sukabumi Berliterasi mengelola informasi pengguna. Kami berkomitmen untuk menjaga privasi Anda. Penggunaan data login via Google Sheets pada Tokolitera hanya digunakan untuk verifikasi status keanggotaan/pelanggan Anda dan tidak akan pernah disebarluaskan ke pihak ketiga tanpa persetujuan tertulis."
  },
  pedoman_media_siber: {
    title: "Pedoman Media Siber",
    icon: "gavel",
    body: "Kemerdekaan berpendapat, kemernekaan berekspresi, dan kemerdekaan pers adalah hak asasi manusia yang dilindungi Pancasila, Undang-Undang Dasar 1945, dan Deklarasi Universal Hak Asasi Manusia PBB. Seluruh berita di Litera News disunting dan disajikan dengan berpedoman pada kode etik jurnalistik demi menghadirkan informasi yang akurat, berimbang, dan edukatif."
  },
  disclaimer: {
    title: "Disclaimer",
    icon: "warning",
    body: "Segala materi berita, foto, dan informasi dalam Litera News dihimpun dari kiriman komunitas dan sindikasi Blogspot Peradma. Redaksi berusaha menjaga akurasi informasi, namun tidak bertanggung jawab atas kerugian materiil maupun non-materiil yang timbul dari penyalahgunaan informasi di dalam platform ini."
  },
  tos: {
    title: "Syarat & Ketentuan (TOS)",
    icon: "rule",
    body: "Dengan mengakses aplikasi Sukabumi Berliterasi / Litera News, Anda setuju untuk terikat oleh Syarat dan Ketentuan Layanan ini. Anda dilarang keras menyalin konten berita untuk tujuan plagiarisme, melakukan spamming pada formulir pendaftaran, atau memanipulasi data transaksi Tokolitera."
  }
};

export default function NewsGrid({ news, loading, userCoords, setUserCoords, isIslamicExpanded, setIsIslamicExpanded }) {
  const [islamicTab, setIslamicTab] = useState('sholat');
  const [selectedNews, setSelectedNews] = useState(null);

  const shareCardRef = useRef(null);
  const [shareImagePreview, setShareImagePreview] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Warta Banner Ads state
  const [wartaBanners, setWartaBanners] = useState([]);
  const [beritaBanners, setBeritaBanners] = useState([]);
  const [activeWartaBannerIdx, setActiveWartaBannerIdx] = useState(0);
  const [activeFooterModal, setActiveFooterModal] = useState(null);
  const [activeHeadlineIdx, setActiveHeadlineIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock timer
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 11) return "Selamat Pagi, Pegiat Literasi! 🌅";
    if (hour < 15) return "Selamat Siang, Pegiat Literasi! ☀️";
    if (hour < 18) return "Selamat Sore, Pegiat Literasi! ☕";
    return "Selamat Malam, Teman Membaca! 🌙";
  };

  const getReadTime = (content) => {
    const words = String(content || '').trim().split(/\s+/).length;
    const time = Math.max(1, Math.ceil(words / 180));
    return `${time} mnt baca`;
  };

  // Get unique categories list
  const allCategories = ['Semua', ...new Set(news.flatMap(n => n.categories || []).filter(Boolean))];

  // Fetch banners from spreadsheet
  useEffect(() => {
    const fetchWartaBanners = async () => {
      try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/1RYJoZ2NjyR1GBrx75g7BapPPsVQxWoXADleV2e1dtHc/gviz/tq?tqx=out:json&t=${Date.now()}`);
        if (!res.ok) return;
        const text = await res.text();
        const jsonStart = text.indexOf('google.visualization.Query.setResponse(');
        if (jsonStart === -1) return;
        const rawJson = text.substring(jsonStart + 'google.visualization.Query.setResponse('.length, text.length - 2);
        const parsed = JSON.parse(rawJson);
        const rows = parsed.table?.rows || [];
        const items = rows.map(r => {
          if (!r || !r.c) return null;
          const imgUrl = r.c[1]?.v;
          const targetUrl = r.c[2]?.v;
          if (!imgUrl) return null;
          return {
            image: getImageUrl(imgUrl),
            link: targetUrl || '#'
          };
        }).filter(Boolean);
        setWartaBanners(items);
      } catch (err) {
        console.error("Gagal mengambil banner warta:", err);
      }
    };

    const fetchBeritaBanners = async () => {
      try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/1r43-ZPHMDQRLWU7okDRm0X0W9ojLl41-sdTbZuzWdsI/gviz/tq?tqx=out:json&t=${Date.now()}`);
        if (!res.ok) return;
        const text = await res.text();
        const jsonStart = text.indexOf('google.visualization.Query.setResponse(');
        if (jsonStart === -1) return;
        const rawJson = text.substring(jsonStart + 'google.visualization.Query.setResponse('.length, text.length - 2);
        const parsed = JSON.parse(rawJson);
        const rows = parsed.table?.rows || [];
        const items = rows.map(r => {
          if (!r || !r.c) return null;
          const imgUrl = r.c[1]?.v;
          const targetUrl = r.c[2]?.v;
          if (!imgUrl) return null;
          return {
            image: getImageUrl(imgUrl),
            link: targetUrl || '#'
          };
        }).filter(Boolean);
        setBeritaBanners(items);
      } catch (err) {
        console.error("Gagal mengambil banner berita terkini:", err);
      }
    };

    fetchWartaBanners();
    fetchBeritaBanners();
  }, []);

  // Rotate banners every 5 seconds
  useEffect(() => {
    if (wartaBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveWartaBannerIdx(prev => (prev + 1) % wartaBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [wartaBanners.length]);
  
  // Rotate headlines every 5 seconds
  useEffect(() => {
    const totalHeadlines = Math.min(3, news.length);
    if (totalHeadlines <= 1) return;
    const timer = setInterval(() => {
      setActiveHeadlineIdx(prev => (prev + 1) % totalHeadlines);
    }, 5000);
    return () => clearInterval(timer);
  }, [news.length]);

  useEffect(() => {
    if (!selectedNews) {
      setShareError(null);
      document.title = "Sukabumi Berliterasi - Jendela Ilmu Digital";
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', 'Sukabumi Berliterasi');
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', 'Sukabumi Berliterasi adalah jendela ilmu digital untuk warga Sukabumi.');
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute('content', '/desain-tanpa-judul-2.png');
    } else {
      document.title = selectedNews.title;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', selectedNews.title);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', selectedNews.summary || '');
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute('content', selectedNews.image || '/desain-tanpa-judul-2.png');
    }
  }, [selectedNews]);

  useEffect(() => {
    if (!loading && news && news.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      const titleParam = params.get('title');
      if (pageParam === 'home' && titleParam) {
        const decodedTitle = decodeURIComponent(titleParam).toLowerCase();
        const found = news.find(n => slugify(n.title) === decodedTitle || n.title.toLowerCase() === decodedTitle || n.title === titleParam);
        if (found) {
          setSelectedNews(found);
        }
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [news, loading]);

  const getCorsSafeImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    // Gunakan proxy weserv.nl untuk menjamin CORS header (Access-Control-Allow-Origin: *)
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  };

  const handleGenerateImage = async (article) => {
    setIsGeneratingImage(true);
    setShareError(null);
    setImageLoadError(false);
    
    try {
      // 1. Jika ada gambar, pramuat (preload) lewat proxy CORS agar ter-cache dan siap dirender
      if (article.image) {
        const safeUrl = getCorsSafeImageUrl(article.image);
        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = resolve;
            img.onerror = reject;
            img.src = safeUrl;
          });
        } catch (preloadErr) {
          console.warn("Gagal pramuat gambar warta:", preloadErr);
          // Jika gagal pramuat, fallback ke tampilan tanpa gambar
          setImageLoadError(true);
        }
      }

      // 2. Berikan jeda waktu agar React selesai merender template di DOM
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!shareCardRef.current) {
        throw new Error("Template gambar tidak ditemukan.");
      }
      
      const options = {
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        scale: 2, // Meningkatkan resolusi agar teks tajam (1200x1200px)
        logging: false
      };

      let canvas;
      try {
        canvas = await html2canvas(shareCardRef.current, options);
      } catch (corsErr) {
        console.warn("Gagal merender dengan gambar (CORS), mencoba fallback tanpa gambar:", corsErr);
        setImageLoadError(true);
        // Tunggu update DOM
        await new Promise((resolve) => setTimeout(resolve, 150));
        canvas = await html2canvas(shareCardRef.current, { ...options, useCORS: false });
      }
      
      const dataUrl = canvas.toDataURL('image/png');
      setShareImagePreview(dataUrl);
    } catch (err) {
      console.error("Gagal membuat gambar warta:", err);
      setShareError("Gagal membuat gambar warta. Silakan coba lagi.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShareNewsLink = (e, article) => {
    e.stopPropagation(); // prevent opening the details modal
    const shareUrl = `${window.location.origin}?page=home&title=${slugify(article.title)}`;
    const shareText = `*Warta Literasi:* ${article.title}\n\nBaca selengkapnya di sini:\n\uD83D\uDC49 ${shareUrl}`;
    
    if (navigator.share) {
      // Hilangkan URL dari parameter text agar tidak muncul ganda, karena browser/OS akan otomatis menempelkan parameter url
      const cleanShareText = `*Warta Literasi:* ${article.title}\n\nBaca selengkapnya di sini:`;
      navigator.share({
        title: article.title,
        text: cleanShareText,
        url: shareUrl
      }).catch(err => console.warn("Gagal membagikan link:", err));
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert("Link warta telah disalin ke clipboard! Silakan bagikan.");
      }).catch(err => {
        console.error("Gagal menyalin link:", err);
      });
    }
  };

  const handleDownloadImage = (article) => {
    const link = document.createElement('a');
    link.download = `warta-${article.title.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    link.href = shareImagePreview;
    link.click();
  };

  const handleShareImageFile = async (article) => {
    try {
      const response = await fetch(shareImagePreview);
      const blob = await response.blob();
      const file = new File([blob], `warta-${article.title.substring(0, 15).replace(/[^a-z0-9]/gi, '_')}.png`, { type: 'image/png' });
      
      const shareUrl = `${window.location.origin}?page=home&title=${slugify(article.title)}`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: article.title,
          text: `Warta Literasi: ${article.title}\n\nDetail lengkap kunjungi:\n\uD83D\uDC49 ${shareUrl}`
        });
      } else {
        alert("Perangkat Anda tidak mendukung pembagian berkas gambar secara langsung.");
      }
    } catch (err) {
      console.error("Gagal membagikan berkas gambar:", err);
    }
  };

  const filteredNews = news;

  return (
    <section className="space-y-6">

      {/* Collapsible Islamic Features Section */}
      {isIslamicExpanded && (
        <div className="sticky top-0 z-20 glass-panel p-3 rounded-2xl bg-white/90 dark:bg-[#051411]/90 backdrop-blur-md border border-teal-500/15 space-y-3 shadow-lg shadow-teal-500/5 animate-in slide-in-from-top duration-300">
          {/* Islamic Tab Switcher */}
          <div className="flex bg-white/40 dark:bg-black/25 border border-teal-500/10 p-1 rounded-2xl shadow-sm">
            <button
              onClick={() => setIslamicTab('sholat')}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all border-0 cursor-pointer flex items-center justify-center gap-1 ${
                islamicTab === 'sholat'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-600 dark:text-teal-200/60 hover:text-primary dark:hover:text-[#4edea3] bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-sm">mosque</span>
              Sholat
            </button>
            <button
              onClick={() => setIslamicTab('kiblat')}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all border-0 cursor-pointer flex items-center justify-center gap-1 ${
                islamicTab === 'kiblat'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-600 dark:text-teal-200/60 hover:text-primary dark:hover:text-[#4edea3] bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-sm">explore</span>
              Kiblat
            </button>
            <button
              onClick={() => setIslamicTab('ayat')}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all border-0 cursor-pointer flex items-center justify-center gap-1 ${
                islamicTab === 'ayat'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-600 dark:text-teal-200/60 hover:text-primary dark:hover:text-[#4edea3] bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-sm">menu_book</span>
              Ayat
            </button>
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in duration-300">
            {islamicTab === 'sholat' && <PrayerTimes />}
            {islamicTab === 'kiblat' && <QiblaCompass userCoords={userCoords} setUserCoords={setUserCoords} />}
            {islamicTab === 'ayat' && <OneDayOneAyat />}
          </div>
        </div>
      )}

      {/* Banner Iklan dari Spreadsheet (Litera News Banners) */}
      {wartaBanners.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-teal-500/10 dark:border-teal-500/20">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeWartaBannerIdx * 100}%)` }}
          >
            {wartaBanners.map((banner, idx) => (
              <a
                key={idx}
                href={banner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-full block shrink-0 flex justify-center bg-transparent"
              >
                <img 
                  src={banner.image} 
                  alt="Iklan Banner" 
                  className="h-16 w-auto max-w-full object-contain rounded-xl block"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </a>
            ))}
          </div>
          {wartaBanners.length > 1 && (
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {wartaBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveWartaBannerIdx(idx); }}
                  className={`w-1.5 h-1.5 rounded-full border-0 cursor-pointer transition-all ${idx === activeWartaBannerIdx ? 'bg-primary w-3' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}



      {loading ? (
        <div className="space-y-4">
          <div className="glass-panel rounded-3xl p-5 h-48 shimmer"></div>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-panel rounded-2xl p-4 h-36 w-40 shrink-0 shimmer"></div>
            ))}
          </div>
          {[1, 2].map(i => (
            <div key={i} className="glass-panel rounded-3xl p-5 h-20 shimmer"></div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-12 opacity-60">
          <span className="material-symbols-outlined text-5xl">feed_sad</span>
          <p className="mt-2 text-sm font-semibold">Tidak ditemukan warta yang cocok.</p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* ===== HEADLINE - Berita Utama Slider (3 slide) ===== */}
          {filteredNews.length > 0 && (() => {
            const headlineItems = filteredNews.slice(0, 3);
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary dark:text-[#4edea3]">newspaper</span>
                  <h2 className="text-xs font-black text-primary dark:text-[#4edea3] uppercase tracking-wider">Headlines</h2>
                </div>
                
                <div className="relative overflow-hidden rounded-3xl border border-teal-500/10 dark:border-teal-500/20 bg-gradient-to-br from-primary/5 to-teal-500/5">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${activeHeadlineIdx * 100}%)` }}
                  >
                    {headlineItems.map((n, idx) => (
                      <div
                        key={idx}
                        className="min-w-full block shrink-0 cursor-pointer group relative"
                        onClick={() => setSelectedNews(n)}
                      >
                        {n.image ? (
                          <div className="w-full h-48 overflow-hidden relative">
                            <img 
                              src={n.image} 
                              alt={n.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"></div>
                            
                            <div className="absolute bottom-0 left-0 right-0 p-4 pb-6">
                              <span className="bg-rose-500 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                Headline
                              </span>
                              <h3 className="font-extrabold text-xs sm:text-sm leading-snug text-white mt-1.5 drop-shadow-md line-clamp-2">
                                {n.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1.5 text-[9px] text-white/75 font-semibold">
                                <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">schedule</span>{n.date}</span>
                                <span className="inline-block w-0.5 h-0.5 rounded-full bg-white/40"></span>
                                <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">timer</span>{getReadTime(n.content)}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-5 pb-7 space-y-2">
                            <span className="bg-rose-500 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                              Headline
                            </span>
                            <h3 className="font-extrabold text-sm leading-snug text-slate-800 dark:text-[#eafaf6] group-hover:text-primary transition-colors line-clamp-2">
                              {n.title}
                            </h3>
                            <p className="text-[11px] text-slate-600 dark:text-teal-200/80 line-clamp-2">{n.summary}</p>
                            <div className="flex items-center gap-2 text-[8px] text-slate-400 dark:text-teal-200/40 font-semibold">
                              <span>{n.date}</span>
                              <span className="inline-block w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-teal-200/20"></span>
                              <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[9px]">timer</span>{getReadTime(n.content)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Navigation dots */}
                  {headlineItems.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
                      {headlineItems.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveHeadlineIdx(idx); }}
                          className={`w-1.5 h-1.5 rounded-full border-0 cursor-pointer transition-all ${idx === activeHeadlineIdx ? 'bg-[#4edea3] w-3.5' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ===== TRENDING - Horizontal scroll (Artikel ke-4 s/d ke-7) ===== */}
          {filteredNews.length > 3 && (() => {
            const trendingItems = filteredNews.slice(3, 7);
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-amber-500 dark:text-amber-400">trending_up</span>
                  <h2 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Trending</h2>
                </div>
                <div className="relative">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                  {trendingItems.map((n, index) => (
                    <div
                      key={index}
                      className="glass-panel rounded-2xl overflow-hidden cursor-pointer group shrink-0 w-36 border border-teal-500/10 dark:border-teal-500/20 hover:border-primary/30 transition-all"
                      onClick={() => setSelectedNews(n)}
                    >
                      {n.image && (
                        <div className="w-full h-20 overflow-hidden">
                          <img 
                            src={n.image} 
                            alt={n.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-350"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="p-2.5 space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[7px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Trending
                          </span>
                        </div>
                        <h4 className="font-bold text-[11px] leading-tight text-slate-800 dark:text-[#eafaf6] line-clamp-2 group-hover:text-primary dark:group-hover:text-[#4edea3] transition-colors">
                          {n.title}
                        </h4>
                        <div className="flex items-center gap-1 text-[8px] text-slate-400 dark:text-teal-200/40 font-semibold">
                          <span>{n.date}</span>
                          <span className="inline-block w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-teal-200/20"></span>
                          <span>{getReadTime(n.content)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Swipe fade indicator */}
                <div className="absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-white/80 dark:from-[#0b2621]/80 to-transparent pointer-events-none rounded-r-2xl"></div>
                </div>
              </div>
            );
          })()}

          {/* ===== BERITA TERKINI - Daftar kompak (Artikel ke-8 dst) ===== */}
          {filteredNews.length > 7 && (() => {
            const latestItems = filteredNews.slice(7);
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary dark:text-[#4edea3]">schedule</span>
                  <h2 className="text-xs font-black text-primary dark:text-[#4edea3] uppercase tracking-wider">Berita Terkini</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {latestItems.map((n, index) => {
                    const cardElement = (
                      <div
                        className="glass-panel rounded-2xl p-3 hover:bg-white/40 dark:hover:bg-inverse-surface/20 transition-all cursor-pointer flex flex-row gap-3 items-center group"
                        onClick={() => setSelectedNews(n)}
                      >
                        {n.image && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 bg-surface-container border border-teal-500/10 dark:border-teal-500/20">
                            <img 
                              src={n.image} 
                              alt={n.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-1.5 text-[8px] font-semibold text-slate-400 dark:text-teal-200/50">
                              <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">schedule</span>{n.date}</span>
                              <span className="inline-block w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-teal-200/20"></span>
                              <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[9px]">timer</span>{getReadTime(n.content)}</span>
                            </div>
                            <span className="bg-primary/10 text-primary dark:text-[#4edea3] text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              Terkini
                            </span>
                          </div>
                          <h3 className="font-bold text-xs leading-snug text-slate-800 dark:text-[#eafaf6] group-hover:text-primary dark:group-hover:text-[#4edea3] transition-colors line-clamp-2">
                            {n.title}
                          </h3>
                          <p className="text-[10px] text-slate-500 dark:text-teal-200/60 leading-relaxed line-clamp-1">
                            {n.summary}
                          </p>
                        </div>
                      </div>
                    );

                    const bannerIndex = Math.floor((index + 1) / 6) - 1;
                    const showBanner = (index + 1) % 6 === 0 && beritaBanners.length > 0 && bannerIndex < 2;
                    const banner = showBanner ? beritaBanners[bannerIndex % beritaBanners.length] : null;

                    return (
                      <React.Fragment key={index}>
                        {cardElement}
                        {banner && (
                          <div className="my-2 overflow-hidden rounded-2xl border border-teal-500/10 dark:border-teal-500/20">
                            <a
                              href={banner.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full flex justify-center bg-transparent"
                            >
                              <img 
                                src={banner.image} 
                                alt="Iklan Berita" 
                                className="w-full h-auto max-h-52 object-contain rounded-xl block"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </a>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Jika total berita <= 7, tampilkan sisanya (selain headline & trending) sebagai Berita Terkini */}
          {filteredNews.length > 3 && filteredNews.length <= 7 && (() => {
            const remainingItems = filteredNews.slice(Math.min(7, filteredNews.length));
            if (remainingItems.length === 0) return null;
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary dark:text-[#4edea3]">schedule</span>
                  <h2 className="text-xs font-black text-primary dark:text-[#4edea3] uppercase tracking-wider">Berita Terkini</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {remainingItems.map((n, index) => (
                    <div
                      key={index}
                      className="glass-panel rounded-2xl p-3 hover:bg-white/40 dark:hover:bg-inverse-surface/20 transition-all cursor-pointer flex flex-row gap-3 items-center group"
                      onClick={() => setSelectedNews(n)}
                    >
                      {n.image && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 bg-surface-container border border-teal-500/10 dark:border-teal-500/20">
                          <img src={n.image} alt={n.title} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <h3 className="font-bold text-xs leading-snug text-slate-800 dark:text-[#eafaf6] group-hover:text-primary transition-colors line-clamp-2">{n.title}</h3>
                        <div className="flex items-center gap-1.5 text-[8px] text-slate-400 dark:text-teal-200/40 font-semibold">
                          <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">schedule</span>{n.date}</span>
                          <span className="inline-block w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-teal-200/20"></span>
                          <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[9px]">timer</span>{getReadTime(n.content)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* ===== WARTA SCREEN FOOTER ===== */}
      <footer className="mt-8 pt-6 border-t border-teal-500/10 dark:border-teal-500/20 space-y-6">
        
        {/* Fitur E-Koran & Portal Blogspot */}
        <div className="grid grid-cols-2 gap-3">
          {/* E-Koran Card */}
          <div className="glass-panel p-3.5 rounded-2xl border border-teal-500/10 dark:border-teal-500/20 flex flex-col justify-between gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-primary dark:text-[#4edea3]">
                <span className="material-symbols-outlined text-sm font-fill">menu_book</span>
                <span className="text-[10px] font-black uppercase tracking-wider">E-Koran Litera</span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-teal-200/50 leading-normal">
                Baca koran digital Sukabumi Berliterasi edisi terbaru (PDF).
              </p>
            </div>
            <a
              href="https://peradma.blogspot.com/search/label/E-Koran"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/95 dark:bg-[#4edea3] dark:hover:bg-[#3bc48d] text-white dark:text-slate-950 text-[9px] font-extrabold py-1.5 px-3 rounded-lg text-center transition-colors block"
            >
              Baca E-Koran
            </a>
          </div>

          {/* Portal Blogspot Card */}
          <div className="glass-panel p-3.5 rounded-2xl border border-teal-500/10 dark:border-teal-500/20 flex flex-col justify-between gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-[#4edea3]">
                <span className="material-symbols-outlined text-sm font-fill">feed</span>
                <span className="text-[10px] font-black uppercase tracking-wider">Kabar Lainnya</span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-teal-200/50 leading-normal">
                Akses berita lengkap di portal resmi Blogspot Peradma.
              </p>
            </div>
            <a
              href="https://peradma.blogspot.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-teal-200 text-[9px] font-extrabold py-1.5 px-3 rounded-lg text-center transition-colors block"
            >
              Kunjungi Blogspot
            </a>
          </div>
        </div>

        {/* Link / Icon Navigasi Legal & Redaksi */}
        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 border-t border-teal-500/5 pt-4 text-center">
          {[
            { id: 'tentang_kami', label: 'Tentang Kami', icon: 'info' },
            { id: 'redaksi', label: 'Redaksi', icon: 'groups' },
            { id: 'kontak_kami', label: 'Kontak Kami', icon: 'contact_support' },
            { id: 'yuk_menulis', label: 'Yuk Menulis', icon: 'edit_note' },
            { id: 'kebijakan_privasi', label: 'Kebijakan Privasi', icon: 'security' },
            { id: 'pedoman_media_siber', label: 'Pedoman Media Siber', icon: 'gavel' },
            { id: 'disclaimer', label: 'Disclaimer', icon: 'warning' },
            { id: 'tos', label: 'TOS', icon: 'rule' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveFooterModal(item.id)}
              className="flex items-center gap-1 text-[9px] font-bold text-slate-600 hover:text-primary dark:text-teal-200/60 dark:hover:text-[#4edea3] bg-transparent border-0 cursor-pointer transition-colors uppercase tracking-wider py-1"
            >
              <span className="material-symbols-outlined text-[11px] opacity-80">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-center pt-2 pb-4 text-[9px] text-slate-400 dark:text-teal-200/30 font-semibold tracking-wider">
          &copy; 2026 Sukabumi Berliterasi. All rights reserved.
        </div>

      </footer>

      {selectedNews && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-[110] flex flex-col items-center justify-center p-4 animate-in fade-in">
          {/* Backdrop Click to Close */}
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setSelectedNews(null)}
          ></div>
          
          <div className="relative max-w-[320px] w-full bg-white dark:bg-zinc-900 rounded-3xl p-5 flex flex-col gap-3.5 border border-teal-500/20 shadow-2xl z-10 text-slate-800 dark:text-[#eafaf6]">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedNews(null)}
              className="absolute top-3 right-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-teal-200 rounded-full p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors z-20 flex items-center justify-center border-0"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
            
            {/* News Image */}
            {selectedNews.image && (
              <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-teal-500/10 mt-3 shrink-0">
                <img 
                  src={selectedNews.image} 
                  alt={selectedNews.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* News Meta */}
            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-500 dark:text-teal-200/60 opacity-80">
              <span className="material-symbols-outlined text-[11px]">calendar_today</span>
              <span>{selectedNews.date}</span>
              <span className="inline-block w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-teal-200/20"></span>
              <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">timer</span>{getReadTime(selectedNews.content)}</span>
              <span className="bg-primary/95 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ml-auto">
                Warta
              </span>
            </div>
            
            {/* News Content */}
            <div className="space-y-2 overflow-y-auto max-h-[160px] scrollbar-thin">
              <h3 className="font-extrabold text-xs leading-snug text-slate-800 dark:text-[#eafaf6]">
                {selectedNews.title}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-teal-200/80 leading-relaxed">
                {selectedNews.content || selectedNews.summary}
              </p>
            </div>
            
            {shareError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-[10px] font-bold py-1.5 px-3 rounded-lg text-center animate-in fade-in duration-200">
                {shareError}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1 mt-auto shrink-0 w-full">
              <button
                onClick={() => handleGenerateImage(selectedNews)}
                disabled={isGeneratingImage}
                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white py-2 w-full rounded-xl text-[11px] font-black transition-all border-0 disabled:opacity-50"
              >
                {isGeneratingImage ? (
                  <>
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                    Memproses Gambar...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xs">image</span>
                    Jadikan Gambar Warta
                  </>
                )}
              </button>

              <button
                onClick={(e) => handleShareNewsLink(e, selectedNews)}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 w-full rounded-xl text-[11px] font-black transition-all border-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">share</span>
                Bagikan Link Warta
              </button>
              
              <a
                href={selectedNews.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-teal-200 py-2 w-full rounded-xl text-[11px] font-black text-center transition-all border-0"
              >
                Baca Selengkapnya di Blogspot
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Share Image Preview Modal */}
      {shareImagePreview && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-[120] flex flex-col items-center justify-center p-4 animate-in fade-in">
          {/* Backdrop Click to Close */}
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => {
              setShareImagePreview(null);
            }}
          ></div>

          <div className="relative max-w-[320px] w-full bg-white dark:bg-zinc-900 rounded-3xl p-5 flex flex-col gap-4 border border-teal-500/20 shadow-2xl z-10 text-slate-800 dark:text-[#eafaf6]">
            {/* Close Button */}
            <button 
              onClick={() => {
                setShareImagePreview(null);
              }}
              className="absolute top-3 right-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-teal-200 rounded-full p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors z-20 flex items-center justify-center border-0"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>

            <h3 className="font-extrabold text-sm text-center tracking-wide text-slate-800 dark:text-[#eafaf6] mt-2">
              Gambar Warta Siap Dibagikan
            </h3>

            {/* Generated Image Container */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-teal-500/10 shadow-md">
              <img 
                src={shareImagePreview} 
                alt="Warta Preview" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full">
              {navigator.share && (
                <button
                  onClick={() => handleShareImageFile(selectedNews)}
                  className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white py-2 w-full rounded-xl text-[11px] font-black transition-all border-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs font-fill">share</span>
                  Bagikan Gambar Langsung
                </button>
              )}

              <button
                onClick={() => handleDownloadImage(selectedNews)}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-teal-200 py-2 w-full rounded-xl text-[11px] font-black transition-all border-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">download</span>
                Unduh Gambar (PNG)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FOOTER MODAL POPUP ===== */}
      {activeFooterModal && footerModalContent[activeFooterModal] && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-[120] flex flex-col items-center justify-center p-4 animate-in fade-in">
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setActiveFooterModal(null)}
          ></div>
          <div className="relative max-w-[320px] w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 flex flex-col gap-4 border border-teal-500/20 shadow-2xl z-10 text-slate-800 dark:text-[#eafaf6]">
            {/* Close Button */}
            <button 
              onClick={() => setActiveFooterModal(null)}
              className="absolute top-3 right-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-teal-200 rounded-full p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors z-20 flex items-center justify-center border-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
            
            {/* Title */}
            <div className="flex items-center gap-3 border-b border-teal-500/10 pb-3 mt-2">
              <div className="bg-[#4edea3]/20 text-[#4edea3] w-9 h-9 rounded-2xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-base font-fill">
                  {footerModalContent[activeFooterModal].icon}
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-[#eafaf6] tracking-wide leading-tight">
                {footerModalContent[activeFooterModal].title}
              </h3>
            </div>
            
            {/* Body Text */}
            <div className="overflow-y-auto max-h-[220px] pr-1">
              <p className="text-[11px] text-slate-600 dark:text-teal-200/80 leading-relaxed whitespace-pre-line">
                {footerModalContent[activeFooterModal].body}
              </p>
            </div>
            
            {/* Action Buttons */}
            <button
              onClick={() => setActiveFooterModal(null)}
              className="mt-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white py-2 w-full rounded-xl text-[11px] font-black transition-all border-0 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Hidden Share Card Template for html2canvas */}
      {selectedNews && (
        <div 
          ref={shareCardRef}
          style={{ 
            width: '600px', 
            height: '600px', 
            position: 'absolute', 
            top: '-9999px', 
            left: '-9999px',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
          className="bg-gradient-to-br from-[#051411] via-[#08221c] to-[#12362e] text-[#eafaf6] p-8 flex flex-col justify-between select-none animate-none"
        >
          {/* Card Header */}
          <div className="flex items-center gap-3.5 border-b border-teal-500/20 pb-4">
            <div className="bg-[#4edea3]/20 border border-[#4edea3]/30 text-[#4edea3] w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-2xl font-fill">auto_stories</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider uppercase text-[#4edea3]">Sukabumi Berliterasi</h1>
              <p className="text-[10px] text-teal-200/50 font-bold tracking-widest uppercase">Warta & Kabar Terkini</p>
            </div>
            <div className="ml-auto text-right">
              <span className="bg-[#4edea3]/90 text-slate-950 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider block mb-1">
                Warta
              </span>
              <span className="text-[10px] font-bold text-slate-400 block">{selectedNews.date}</span>
            </div>
          </div>

          {/* Card Body */}
          <div className="flex-1 py-4 flex flex-col justify-center gap-4">
            {selectedNews.image && !imageLoadError ? (
              <div 
                className="w-full h-[360px] rounded-2xl border border-teal-500/10 shadow-md bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${getCorsSafeImageUrl(selectedNews.image)})` }}
              />
            ) : (
              <div className="w-full h-[360px] rounded-2xl bg-teal-950/30 border border-teal-500/10 flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-4xl text-[#4edea3]/40 font-fill">auto_stories</span>
                <span className="text-[11px] text-teal-200/40 uppercase font-bold tracking-widest">Sukabumi Berliterasi</span>
              </div>
            )}
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-white leading-snug">
                {selectedNews.title}
              </h2>
            </div>
          </div>

          {/* Card Footer */}
          <div className="border-t border-teal-500/20 pt-4 flex justify-between items-center text-[10px] text-teal-200/40 font-bold uppercase tracking-wider">
            <span>sukabumiberliterasi.netlify.app</span>
            <span className="flex items-center gap-1 text-[#4edea3]/50">
              <span className="material-symbols-outlined text-xs">auto_stories</span>
              Gerakan Sukabumi Berliterasi
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
