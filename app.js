/**
 * Sukabumi Berliterasi - Single Page Application Engine
 */

// --- Global State ---
const AppState = {
    theme: 'light',
    currentScreen: 'screen-berita',
    data: {
        news: [],
        agenda: [],
        karya: [],
        mitra: []
    }
};

// --- API Endpoints ---
const ENDPOINTS = {
    blogger: 'https://peradma.blogspot.com/feeds/posts/default?alt=json',
    sheetAgenda: '1KggpPNdk09m7GxrIrKLWjtQhcEkvFPR6r2JFP7I4DX8',
    sheetMitra: '11ueCaQJYp4U4gpArmipBdaZ1PfA-DZeC_hqA4t3rptQ',
    sheetKarya: '1fD4HaV4-ZFTMRDLhsXVKQzxNFYl7PG0AkilQjAQvx6s'
};

// --- Helper: Parse Google Sheets JSON Output ---
async function fetchGoogleSheet(sheetId) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Extract JSON string from Google Sheets JSONP wrapper
        const startIdx = text.indexOf('google.visualization.Query.setResponse(');
        if (startIdx === -1) throw new Error("Invalid spreadsheet format");
        
        const jsonStart = startIdx + 'google.visualization.Query.setResponse('.length;
        const jsonStr = text.substring(jsonStart, text.length - 2); // trim last );
        
        const data = JSON.parse(jsonStr);
        const table = data.table;
        
        if (!table || !table.rows) return [];
        
        const headers = table.cols.map(col => col.label ? col.label.trim().toLowerCase() : '');
        
        return table.rows.map(row => {
            const item = {};
            row.c.forEach((cell, index) => {
                const header = headers[index] || `col_${index}`;
                // Keep cell value if not empty, otherwise default to empty string
                item[header] = cell ? (cell.v !== null ? cell.v : '') : '';
            });
            return item;
        });
    } catch (error) {
        console.error(`Error loading sheet ${sheetId}:`, error);
        return [];
    }
}

// --- Helper: Extract Image from Blogger Post Content ---
function extractFirstImage(contentHtml, bloggerThumbnail) {
    if (contentHtml) {
        // Scrape first image source in the content HTML as primary source (original uploaded image)
        const div = document.createElement('div');
        div.innerHTML = contentHtml;
        const img = div.querySelector('img');
        if (img && img.src) {
            let imgUrl = img.src;
            imgUrl = imgUrl.replace(/\/s\d+(-[a-zA-Z0-9_-])*\//, '/s1600/');
            imgUrl = imgUrl.replace(/\/w\d+-h\d+(-[a-zA-Z0-9_-])*\//, '/s1600/');
            return imgUrl;
        }
    }
    
    if (bloggerThumbnail) {
        // Replace small thumbnail size to original high resolution
        let highRes = bloggerThumbnail.replace(/\/s\d+(-[a-zA-Z0-9_-])*\//, '/s1600/');
        highRes = highRes.replace(/\/w\d+-h\d+(-[a-zA-Z0-9_-])*\//, '/s1600/');
        return highRes;
    }
    
    return 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=800&q=80'; // high quality placeholder
}

// --- Helper: Generate Random Ticket Code ---
function generateTicketCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SL-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// --- Helper: Format Indonesian Date ---
function formatIndoDate(dateStr) {
    if (!dateStr) return '';
    try {
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj)) return dateStr;
        return dateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}

// --- Data Fetching Operations ---
async function loadAllAppData() {
    const splashScreen = document.getElementById('splash-screen');
    const appContainer = document.getElementById('app-container');
    const minLoadTime = 2500; // 2.5 seconds minimum visual transition
    const startTime = Date.now();

    try {
        // Parallel data loading
        const [newsData, agendaData, karyaData, mitraData] = await Promise.all([
            fetchBloggerFeed(),
            fetchGoogleSheet(ENDPOINTS.sheetAgenda),
            fetchGoogleSheet(ENDPOINTS.sheetKarya),
            fetchGoogleSheet(ENDPOINTS.sheetMitra)
        ]);

        AppState.data.news = newsData;
        AppState.data.agenda = agendaData;
        AppState.data.karya = karyaData;
        AppState.data.mitra = mitraData;

        // Render initial data
        renderNews(AppState.data.news);
        renderAgenda(AppState.data.agenda);
        renderKarya(AppState.data.karya);
        renderMitra(AppState.data.mitra);

    } catch (error) {
        console.error("Critical error loading application data:", error);
    } finally {
        // Calculate remaining wait time to satisfy UX requirement
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, minLoadTime - elapsed);

        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            appContainer.classList.remove('hidden');
            setTimeout(() => splashScreen.remove(), 500); // Clean up splash DOM element
        }, delay);
    }
}

// --- Fetch Blogger Posts ---
async function fetchBloggerFeed() {
    try {
        const response = await fetch(ENDPOINTS.blogger);
        const data = await response.json();
        const entries = data.feed.entry || [];
        
        return entries.map(entry => {
            const title = entry.title ? entry.title.$t : 'No Title';
            const published = entry.published ? entry.published.$t : '';
            
            const linkObj = entry.link.find(l => l.rel === 'alternate');
            const link = linkObj ? linkObj.href : '#';
            
            const content = entry.content ? entry.content.$t : '';
            const summary = entry.summary ? entry.summary.$t : content.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
            
            const mediaThumbnail = entry.media$thumbnail ? entry.media$thumbnail.url : null;
            const image = extractFirstImage(content, mediaThumbnail);
            
            return { title, published, link, summary, image };
        });
    } catch (error) {
        console.error("Error fetching Blogger feed:", error);
        return [];
    }
}

// --- Rendering: Berita Literasi ---
function renderNews(articles) {
    const grid = document.getElementById('news-grid');
    grid.innerHTML = '';
    
    if (articles.length === 0) {
        grid.innerHTML = `
            <div class="no-data">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Tidak ada berita terbaru saat ini.</p>
            </div>
        `;
        return;
    }
    
    articles.forEach((article, idx) => {
        const dateFormatted = formatIndoDate(article.published);
        const card = document.createElement('article');
        card.className = 'news-card';
        card.innerHTML = `
            <div class="news-img-wrapper" style="cursor:pointer;" id="news-img-wrap-${idx}">
                <img class="news-img" src="${article.image}" alt="${article.title}" loading="lazy">
            </div>
            <div class="news-meta">
                <span><i class="fa-solid fa-calendar"></i> ${dateFormatted}</span>
                <span>Peradma</span>
            </div>
            <div class="news-content" style="display:flex; flex-direction:column; flex-grow:1;">
                <h4 class="news-title" style="cursor:pointer;" id="news-title-${idx}">${article.title}</h4>
                <p class="news-desc">${article.summary}</p>
                <button class="btn btn-secondary btn-full btn-view-news-detail" style="margin-top:auto;" id="news-btn-${idx}">
                    Lihat Detail <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);

        // Bind events
        document.getElementById(`news-img-wrap-${idx}`).addEventListener('click', () => openNewsDetail(article));
        document.getElementById(`news-title-${idx}`).addEventListener('click', () => openNewsDetail(article));
        document.getElementById(`news-btn-${idx}`).addEventListener('click', () => openNewsDetail(article));
    });
}

// --- Rendering: Agenda Kegiatan ---
function renderAgenda(activities) {
    const list = document.getElementById('agenda-list');
    list.innerHTML = '';
    
    if (activities.length === 0) {
        list.innerHTML = `
            <div class="no-data">
                <i class="fa-solid fa-calendar-xmark"></i>
                <p>Belum ada jadwal kelas atau kegiatan literasi saat ini.</p>
            </div>
        `;
        return;
    }
    
    // Maps standard spreadsheet column headers if named differently
    activities.forEach(activity => {
        // Support common spreadsheet names (kategori/category, nama/judul/kegiatan, deskripsi/detail, tanggal/waktu, lokasi/tempat)
        const kategori = activity.kategori || activity.category || 'Kelas Literasi';
        const nama = activity.kegiatan || activity.nama || activity.judul || 'Kegiatan Menarik';
        const deskripsi = activity.deskripsi || activity.description || 'Mari bergabung dalam kelas literasi bersama warga Sukabumi.';
        const tanggal = activity.tanggal || activity.waktu || 'Segera Diumumkan';
        const lokasi = activity.lokasi || activity.tempat || 'Pojok Baca Sukabumi';
        
        const row = document.createElement('div');
        row.className = 'agenda-row';
        row.innerHTML = `
            <div class="agenda-info">
                <span class="agenda-badge">${kategori}</span>
                <h4 class="agenda-title">${nama}</h4>
                <p style="color: var(--text-muted); margin-bottom: 0.5rem; font-size: 0.95rem;">${deskripsi}</p>
                <div class="agenda-meta">
                    <span><i class="fa-solid fa-calendar-day"></i> ${tanggal}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${lokasi}</span>
                </div>
            </div>
            <button class="btn btn-primary btn-daftar-kelas" data-nama="${nama}" data-tanggal="${tanggal}">
                Daftar Kelas
            </button>
        `;
        list.appendChild(row);
    });

    // Modal Opening Event Triggers
    document.querySelectorAll('.btn-daftar-kelas').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const nama = e.currentTarget.getAttribute('data-nama');
            const tanggal = e.currentTarget.getAttribute('data-tanggal');
            openRegistrationModal(nama, tanggal);
        });
    });
}

// --- Rendering: Koleksi Karya Pegiat ---
function renderKarya(works) {
    const grid = document.getElementById('karya-grid');
    grid.innerHTML = '';
    
    if (works.length === 0) {
        grid.innerHTML = `
            <div class="no-data">
                <i class="fa-solid fa-feather"></i>
                <p>Belum ada karya tulis atau buku pegiat literasi terdaftar.</p>
            </div>
        `;
        return;
    }
    
    works.forEach(work => {
        const judul = work.judul || work.title || 'Karya Literasi';
        const penulis = work.penulis || work.author || 'Pegiat Literasi';
        const kategori = work.kategori || work.category || 'Artikel';
        const ringkasan = work.ringkasan || work.summary || work.deskripsi || '-';
        const kontributor = work.kontributor || work.pegiat || '-';
        const link = work.link || work.url || '#';
        
        const shareText = encodeURIComponent(`*Karya Literasi di Sukabumi Berliterasi*\n\n*Judul:* ${judul}\n*Penulis/Pegiat:* ${penulis}\n*Kategori:* ${kategori}\n*Ringkasan:* ${ringkasan}\n\nYuk lihat karya-karya inspiratif lainnya di:\n👉 sukabumiberliterasi.netlify.app`);
        const waShareUrl = `https://api.whatsapp.com/send?text=${shareText}`;

        const card = document.createElement('div');
        card.className = 'karya-card';
        card.innerHTML = `
            <div class="karya-header">
                <span class="karya-tag">${kategori}</span>
            </div>
            <h4 class="karya-title">${judul}</h4>
            <span class="karya-author">Oleh: ${penulis}</span>
            <p class="karya-summary">${ringkasan}</p>
            <div class="karya-footer" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px;">
                <span class="karya-contributor"><i class="fa-solid fa-circle-user"></i> ${kontributor}</span>
                <div style="display: flex; gap: 10px; align-items: center;">
                    ${link !== '#' ? `<a href="${link}" target="_blank" rel="noopener noreferrer" class="karya-btn" style="margin: 0;">Baca <i class="fa-solid fa-arrow-right-long"></i></a>` : ''}
                    <a href="${waShareUrl}" target="_blank" rel="noopener noreferrer" class="karya-share-btn" style="font-size: 11px; font-weight: bold; color: #10b981; text-decoration: none; display: flex; align-items: center; gap: 4px; border: 1px solid #10b981; padding: 4px 8px; rounded-lg: 6px; border-radius: 8px;">
                        <i class="fa-solid fa-share-nodes"></i> Bagikan
                    </a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- Helper: Parse Google Drive Logo URL to Thumbnail Endpoint ---
function getGoogleDriveLogoUrl(src) {
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
}

// --- Rendering: Mitra Kolaborasi ---
function renderMitra(partners) {
    const grid = document.getElementById('mitra-grid');
    grid.innerHTML = '';
    
    if (partners.length === 0) {
        grid.innerHTML = `
            <div class="no-data">
                <i class="fa-solid fa-user-group"></i>
                <p>Belum ada data mitra kolaborasi yang terdaftar.</p>
            </div>
        `;
        return;
    }
    
    partners.forEach(partner => {
        const nama = partner.lembaga || partner.nama || partner.organization || 'Mitra Komunitas';
        const kontribusi = partner.kontribusi || partner.role || 'Kolaborator';
        const logoUrl = getGoogleDriveLogoUrl(partner.logo || partner.logourl || '');
        
        const shareText = encodeURIComponent(`*Mitra Kolaborasi Sukabumi Berliterasi*\n\n*Nama Instansi/Komunitas:* ${nama}\n*Bentuk Kolaborasi:* ${kontribusi}\n\nMari berkolaborasi membangun literasi bersama di:\n👉 sukabumiberliterasi.netlify.app`);
        const waShareUrl = `https://api.whatsapp.com/send?text=${shareText}`;

        const card = document.createElement('div');
        card.className = 'mitra-card';
        
        const logoElement = logoUrl 
            ? `<img src="${logoUrl}" alt="${nama}" loading="lazy">` 
            : `<i class="fa-solid fa-landmark"></i>`;
            
        card.innerHTML = `
            <div class="mitra-logo-container">
                ${logoElement}
            </div>
            <h4 class="mitra-name">${nama}</h4>
            <span class="mitra-role">${kontribusi}</span>
            <div class="mitra-share-container" style="margin-top: 8px; width: 100%; display: flex; justify-content: center;">
                <a href="${waShareUrl}" target="_blank" rel="noopener noreferrer" style="color: #10b981; font-size: 11px; font-weight: bold; display: flex; align-items: center; gap: 4px; text-decoration: none; border: 1px solid #10b981; padding: 4px 10px; border-radius: 8px; transition: all 0.2s;">
                    <i class="fa-solid fa-share-nodes"></i> Bagikan
                </a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- UI Logic: Navigation Engines ---
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.app-screen');
    const pageTitle = document.getElementById('page-title');
    
    function navigateTo(targetId) {
        // Update active class state on nav elements
        navItems.forEach(item => {
            if (item.getAttribute('data-target') === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Switch page contents
        screens.forEach(screen => {
            if (screen.id === targetId) {
                screen.classList.add('active');
            } else {
                screen.classList.remove('active');
            }
        });
        
        // Update Page Titles
        const matchedItem = Array.from(navItems).find(item => item.getAttribute('data-target') === targetId);
        if (matchedItem) {
            const titleSpan = matchedItem.querySelector('span');
            if (titleSpan) {
                pageTitle.textContent = titleSpan.textContent;
            }
        }
        
        AppState.currentScreen = targetId;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            navigateTo(target);
        });
    });
}

// --- UI Logic: Theme Configurations ---
function setupTheme() {
    const themeBtnDesktop = document.getElementById('theme-toggle-desktop');
    const themeBtnMobile = document.getElementById('theme-toggle-mobile');
    
    // Check saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        AppState.theme = theme;
        localStorage.setItem('theme', theme);
        
        const isDark = theme === 'dark';
        const moonIcon = '<i class="fa-solid fa-moon"></i>';
        const sunIcon = '<i class="fa-solid fa-sun"></i>';
        
        // Update Desktop Theme toggle
        if (themeBtnDesktop) {
            themeBtnDesktop.innerHTML = isDark 
                ? `${sunIcon} <span>Mode Terang</span>` 
                : `${moonIcon} <span>Mode Gelap</span>`;
        }
        
        // Update Mobile Theme toggle
        if (themeBtnMobile) {
            themeBtnMobile.innerHTML = isDark ? sunIcon : moonIcon;
        }
    }
    
    function toggleTheme() {
        const nextTheme = AppState.theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
    }
    
    if (themeBtnDesktop) themeBtnDesktop.addEventListener('click', toggleTheme);
    if (themeBtnMobile) themeBtnMobile.addEventListener('click', toggleTheme);
}

// --- UI Logic: Registration Modal & Ticket Generation ---
const modal = document.getElementById('modal-registration');
const closeBtn = document.getElementById('close-modal');
const formDaftar = document.getElementById('form-daftar-kelas');

function openRegistrationModal(namaKelas, tanggalKelas) {
    document.getElementById('form-agenda-name').value = namaKelas;
    document.getElementById('form-agenda-date').value = tanggalKelas;
    document.getElementById('reg-agenda-title').textContent = namaKelas;
    
    // Reset Form & Views
    formDaftar.reset();
    document.getElementById('registration-form-step').classList.remove('hidden');
    document.getElementById('ticket-display-step').classList.add('hidden');
    
    modal.classList.remove('hidden');
}

function closeRegistrationModal() {
    modal.classList.add('hidden');
}

if (closeBtn) closeBtn.addEventListener('click', closeRegistrationModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) closeRegistrationModal();
});

if (formDaftar) {
    formDaftar.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const namaUser = document.getElementById('reg-nama').value;
        const hpUser = document.getElementById('reg-hp').value;
        const kelasNama = document.getElementById('form-agenda-name').value;
        const kelasTanggal = document.getElementById('form-agenda-date').value;
        
        // Generate values
        const kodeUnik = generateTicketCode();
        
        // Update Digital Ticket DOM elements
        document.getElementById('ticket-user-name').textContent = namaUser;
        document.getElementById('ticket-code').textContent = kodeUnik;
        document.getElementById('ticket-class-name').textContent = kelasNama;
        document.getElementById('ticket-date').textContent = kelasTanggal;
        
        // Build WhatsApp text and link
        const adminWA = '6281234567890'; // fallback Admin
        const textTemplate = `Halo Admin, saya telah mendaftar kelas di Sukabumi Berliterasi.%0A%0A*Detail Tiket Digital*%0ANama: ${encodeURIComponent(namaUser)}%0AHandphone: ${encodeURIComponent(hpUser)}%0AKelas: ${encodeURIComponent(kelasNama)}%0ATanggal: ${encodeURIComponent(kelasTanggal)}%0AKode Tiket: *${kodeUnik}*`;
        const waLink = `https://wa.me/${adminWA}?text=${textTemplate}`;
        
        const waBtn = document.getElementById('btn-wa-ticket');
        if (waBtn) waBtn.href = waLink;
        
        // Transition form steps
        document.getElementById('registration-form-step').classList.add('hidden');
        document.getElementById('ticket-display-step').classList.remove('hidden');
        
        // Save references for sharing
        AppState.currentTicket = {
            nama: namaUser,
            kelas: kelasNama,
            tanggal: kelasTanggal,
            kode: kodeUnik,
            waLink: waLink
        };
    });
}

// --- Ticket Export & Sharing Functions ---
document.getElementById('btn-save-ticket')?.addEventListener('click', () => {
    const ticketElement = document.getElementById('digital-ticket');
    
    // Perform temporary render styles for html2canvas extraction
    const prevBorder = ticketElement.style.border;
    ticketElement.style.border = "none";
    
    html2canvas(ticketElement, {
        scale: 2, // High resolution export
        useCORS: true,
        backgroundColor: null
    }).then(canvas => {
        ticketElement.style.border = prevBorder;
        
        const link = document.createElement('a');
        link.download = `Tiket-${AppState.currentTicket.kode}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});

document.getElementById('btn-share-ticket')?.addEventListener('click', () => {
    if (!AppState.currentTicket) return;
    
    const shareText = `Saya mendaftar ke Kelas "${AppState.currentTicket.kelas}" di Sukabumi Berliterasi. Kode tiket saya: ${AppState.currentTicket.kode}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Tiket Sukabumi Berliterasi',
            text: shareText,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: Copy to Clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Informasi tiket disalin ke clipboard!');
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    }
});

// --- Search Filter Logic ---
document.getElementById('news-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = AppState.data.news.filter(article => {
        return article.title.toLowerCase().includes(query) || 
               article.summary.toLowerCase().includes(query);
    });
    renderNews(filtered);
});

document.getElementById('karya-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = AppState.data.karya.filter(work => {
        const judul = (work.judul || work.title || '').toLowerCase();
        const penulis = (work.penulis || work.author || '').toLowerCase();
        const kategori = (work.kategori || work.category || '').toLowerCase();
        const ringkasan = (work.ringkasan || work.summary || work.deskripsi || '').toLowerCase();
        
        return judul.includes(query) || 
               penulis.includes(query) || 
               kategori.includes(query) || 
               ringkasan.includes(query);
    });
    renderKarya(filtered);
});

// --- Weather Widget & Qibla Compass JS Logic ---

let userCoords = null; // { latitude, longitude }

const WEATHER_CODES = {
  0: { desc: 'Cerah', emoji: '☀️', bgClass: 'weather-cerah' },
  1: { desc: 'Cerah Berawan', emoji: '⛅', bgClass: 'weather-berawan-cerah' },
  2: { desc: 'Cerah Berawan', emoji: '⛅', bgClass: 'weather-berawan-cerah' },
  3: { desc: 'Berawan', emoji: '☁️', bgClass: 'weather-berawan' },
  45: { desc: 'Berkabut', emoji: '🌫️', bgClass: 'weather-berawan' },
  48: { desc: 'Berkabut', emoji: '🌫️', bgClass: 'weather-berawan' },
  51: { desc: 'Gerimis', emoji: '🌧️', bgClass: 'weather-hujan' },
  53: { desc: 'Gerimis', emoji: '🌧️', bgClass: 'weather-hujan' },
  55: { desc: 'Gerimis', emoji: '🌧️', bgClass: 'weather-hujan' },
  61: { desc: 'Hujan', emoji: '🌧️', bgClass: 'weather-hujan' },
  63: { desc: 'Hujan', emoji: '🌧️', bgClass: 'weather-hujan' },
  65: { desc: 'Hujan', emoji: '🌧️', bgClass: 'weather-hujan' },
  71: { desc: 'Salju', emoji: '❄️', bgClass: 'weather-berawan' },
  73: { desc: 'Salju', emoji: '❄️', bgClass: 'weather-berawan' },
  75: { desc: 'Salju', emoji: '❄️', bgClass: 'weather-berawan' },
  80: { desc: 'Hujan Deras', emoji: '🌦️', bgClass: 'weather-hujan' },
  81: { desc: 'Hujan Deras', emoji: '🌦️', bgClass: 'weather-hujan' },
  82: { desc: 'Hujan Deras', emoji: '🌦️', bgClass: 'weather-hujan' },
  95: { desc: 'Badai Petir', emoji: '⛈️', bgClass: 'weather-badai' },
  96: { desc: 'Badai Petir', emoji: '⛈️', bgClass: 'weather-badai' },
  99: { desc: 'Badai Petir', emoji: '⛈️', bgClass: 'weather-badai' }
};

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { desc: 'Berawan', emoji: '☁️', bgClass: 'weather-berawan' };
}

async function loadWeather() {
  const card = document.getElementById('weather-card');
  if (!card) return;

  const lat = userCoords ? userCoords.latitude : -6.9277;
  const lon = userCoords ? userCoords.longitude : 106.9300;

  let locationName = 'Kota Sukabumi';
  if (userCoords) {
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
      const geoData = await geoRes.json();
      locationName = geoData.address.city || geoData.address.town || geoData.address.municipality || geoData.address.village || geoData.address.county || 'Lokasi Terkini';
    } catch (e) {
      locationName = 'Lokasi Terkini';
    }
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    if (!response.ok) throw new Error('API error');
    const data = await response.json();

    const currentTemp = Math.round(data.current.temperature_2m);
    const currentHumidity = data.current.relative_humidity_2m;
    const currentCode = data.current.weather_code;
    const tempMax = Math.round(data.daily.temperature_2m_max[0]);
    const tempMin = Math.round(data.daily.temperature_2m_min[0]);

    const currentHourIndex = new Date().getHours();
    let hourlyHtml = '';
    for (let i = 0; i < 24; i++) {
      const targetIndex = currentHourIndex + i;
      const timeStr = data.hourly.time[targetIndex];
      if (!timeStr) continue;
      const hourVal = new Date(timeStr).getHours();
      const formattedHour = `${String(hourVal).padStart(2, '0')}:00`;
      const temp = Math.round(data.hourly.temperature_2m[targetIndex]);
      const code = data.hourly.weather_code[targetIndex];
      const info = getWeatherInfo(code);

      hourlyHtml += `
        <div class="weather-hourly-item">
          <span class="weather-hourly-time">${formattedHour}</span>
          <span class="weather-hourly-emoji">${info.emoji}</span>
          <span class="weather-hourly-temp">${temp}°C</span>
        </div>
      `;
    }

    const weatherInfo = getWeatherInfo(currentCode);

    card.className = `weather-widget ${weatherInfo.bgClass}`;
    card.innerHTML = `
      <div class="weather-header">
        <div class="flex items-center gap-1">
          <i class="fa-solid fa-location-dot"></i>
          <span>${locationName}</span>
        </div>
        ${!userCoords ? `
          <button id="btn-weather-gps" class="weather-gps-btn">
            <i class="fa-solid fa-location-crosshairs"></i> Gunakan GPS
          </button>
        ` : ''}
      </div>

      <div class="weather-main">
        <div class="weather-temp-container">
          <span class="weather-temp">${currentTemp}</span>
          <span class="weather-unit">°C</span>
        </div>
        <div class="weather-status">
          <span class="weather-emoji">${weatherInfo.emoji}</span>
          <span class="weather-desc">${weatherInfo.desc}</span>
        </div>
      </div>

      <div class="weather-stats">
        <div>
          <span class="weather-stat-label">KELEMBAPAN</span>
          <span class="weather-stat-val">${currentHumidity}%</span>
        </div>
        <div>
          <span class="weather-stat-label">SUHU MIN</span>
          <span class="weather-stat-val">${tempMin}°C</span>
        </div>
        <div>
          <span class="weather-stat-label">SUHU MAKS</span>
          <span class="weather-stat-val">${tempMax}°C</span>
        </div>
      </div>

      <div>
        <div class="weather-hourly-title">Prakiraan 24 Jam</div>
        <div class="weather-hourly-list">
          ${hourlyHtml}
        </div>
      </div>
    `;

    const gpsBtn = document.getElementById('btn-weather-gps');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', requestGPSLocation);
    }

  } catch (error) {
    card.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: #ef4444;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.5rem;"></i>
        <p style="font-size: 0.8rem; font-weight: 700; margin-top: 0.5rem;">Gagal memuat cuaca</p>
        <button id="btn-weather-retry" style="background: none; border: none; color: var(--primary-color); font-weight: 700; text-decoration: underline; margin-top: 0.5rem; cursor: pointer;">Coba Lagi</button>
      </div>
    `;
    const retryBtn = document.getElementById('btn-weather-retry');
    if (retryBtn) retryBtn.addEventListener('click', loadWeather);
  }
}

function requestGPSLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        loadWeather();
        updateQiblaUI();
      },
      (error) => {
        console.warn('GPS failed:', error);
      }
    );
  }
}

let compassHeading = 0;
let hasSensor = false;
let sensorActive = false;

function calculateQibla(lat, lon) {
  const phiU = (lat * Math.PI) / 180;
  const phiK = (21.4225 * Math.PI) / 180;
  const lambdaDiff = ((39.8262 - lon) * Math.PI) / 180;

  const y = Math.sin(lambdaDiff);
  const x = Math.cos(phiU) * Math.tan(phiK) - Math.sin(phiU) * Math.cos(lambdaDiff);

  let qiblaRad = Math.atan2(y, x);
  let qiblaDeg = (qiblaRad * 180) / Math.PI;
  return (qiblaDeg + 360) % 360;
}

function setupQiblaCompass() {
  const btnGPS = document.getElementById('btn-request-qibla-gps');
  if (!btnGPS) return;

  btnGPS.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showQiblaError('Geolokasi tidak didukung oleh browser Anda.');
      return;
    }
    btnGPS.disabled = true;
    btnGPS.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mencari...';
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        btnGPS.disabled = false;
        btnGPS.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Cari Arah Kiblat';
        
        updateQiblaUI();
        loadWeather(); 
        initCompassSensor();
      },
      (error) => {
        btnGPS.disabled = false;
        btnGPS.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Cari Arah Kiblat';
        
        let msg = 'Gagal mengakses GPS. Silakan masukkan koordinat secara manual.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Izin lokasi ditolak. Silakan masukkan koordinat secara manual.';
        }
        showQiblaError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const manualForm = document.getElementById('qibla-manual-form');
  if (manualForm) {
    manualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const lat = parseFloat(document.getElementById('qibla-manual-lat').value);
      const lon = parseFloat(document.getElementById('qibla-manual-lon').value);
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        showQiblaError('Koordinat tidak valid.');
        return;
      }
      userCoords = { latitude: lat, longitude: lon };
      updateQiblaUI();
      loadWeather();
      initCompassSensor();
    });
  }
}

function showQiblaError(msg) {
  const errDiv = document.getElementById('qibla-error-msg');
  const manualForm = document.getElementById('qibla-manual-form');
  if (errDiv) {
    errDiv.textContent = msg;
    errDiv.classList.remove('hidden');
  }
  if (manualForm) {
    manualForm.classList.remove('hidden');
  }
}

function updateQiblaUI() {
  if (!userCoords) return;
  
  const initView = document.getElementById('qibla-init-view');
  const compassView = document.getElementById('qibla-compass-view');
  if (initView) initView.classList.add('hidden');
  if (compassView) compassView.classList.remove('hidden');

  const qAngle = calculateQibla(userCoords.latitude, userCoords.longitude);
  
  const userCoordsEl = document.getElementById('qibla-user-coords');
  const angleTextEl = document.getElementById('qibla-angle-text');
  if (userCoordsEl) userCoordsEl.textContent = `${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}`;
  if (angleTextEl) angleTextEl.textContent = `Arah Kiblat: ${qAngle.toFixed(1)}° dari Utara`;
  
  const marker = document.getElementById('compass-qibla-marker');
  if (marker) {
    marker.style.transform = `rotate(${qAngle}deg)`;
  }
  
  window.qiblaAngle = qAngle;
}

function handleCompassOrientation(e) {
  let heading = null;
  if (e.webkitCompassHeading !== undefined) {
    heading = e.webkitCompassHeading;
  } else if (e.absolute && e.alpha !== null) {
    heading = 360 - e.alpha;
  } else if (e.alpha !== null) {
    heading = 360 - e.alpha;
  }
  
  if (heading !== null) {
    compassHeading = heading;
    hasSensor = true;
    
    const dial = document.getElementById('compass-card-dial');
    if (dial) {
      dial.style.transform = `rotate(${-compassHeading}deg)`;
    }
    
    const desc = document.getElementById('qibla-sensor-desc');
    if (desc) {
      desc.textContent = "Kompas aktif secara real-time. Putar perangkat Anda hingga ikon Masjid (Kiblat) sejajar dengan penunjuk atas.";
    }
  }
}

function initCompassSensor() {
  const sensorBtn = document.getElementById('btn-activate-sensor');
  
  const register = () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(state => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handleCompassOrientation, true);
            sensorActive = true;
            if (sensorBtn) sensorBtn.classList.add('hidden');
          }
        })
        .catch(console.error);
    } else {
      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleCompassOrientation, true);
      } else {
        window.addEventListener('deviceorientation', handleCompassOrientation, true);
      }
      sensorActive = true;
      if (sensorBtn) sensorBtn.classList.add('hidden');
    }
  };

  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    if (sensorBtn) {
      sensorBtn.classList.remove('hidden');
      sensorBtn.addEventListener('click', register);
    }
  } else {
    register();
  }
}

// --- Google Drive Event Flyer Gallery JS Logic ---

const FALLBACK_FLYERS = [
  {
    id: '1En-_a4IjOt-oJQliNoIufqkE49jFMP3u',
    name: 'Desain tanpa judul (2)',
    thumbnailLink: 'https://lh3.googleusercontent.com/d/1En-_a4IjOt-oJQliNoIufqkE49jFMP3u',
    webContentLink: 'https://lh3.googleusercontent.com/d/1En-_a4IjOt-oJQliNoIufqkE49jFMP3u'
  }
];

const GDRIVE_FOLDER_ID = '1hJI_2TS3JqKCpc2uaWi2V5YmSlHI8J7YsoTOuYNIAM6JJf6Pwwu5Ph-u5g62e5HE2Op7UgjF';
const GOOGLE_API_KEY = ''; // Masukkan Google API Key Anda di sini jika diperlukan

async function loadFlyers() {
  const grid = document.getElementById('flyer-gallery-grid');
  if (!grid) return;

  let flyerList = FALLBACK_FLYERS;

  if (GOOGLE_API_KEY) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${GDRIVE_FOLDER_ID}'+in+parents+and+mimeType+contains+'image/'+and+trashed=false&fields=files(id,name,thumbnailLink,webContentLink)&key=${GOOGLE_API_KEY}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.files && data.files.length > 0) {
          flyerList = data.files.map(f => {
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
        }
      }
    } catch (err) {
      console.warn('Gagal memuat flyer dari GDrive, menggunakan fallback:', err);
    }
  }

  grid.innerHTML = '';
  flyerList.forEach(flyer => {
    const card = document.createElement('div');
    card.className = 'flyer-item-card';
    card.innerHTML = `
      <div class="flyer-thumb-container" onclick="openFlyerLightbox('${flyer.name}', '${flyer.webContentLink}')">
        <img class="flyer-thumb-img" src="${flyer.thumbnailLink}" alt="${flyer.name}" loading="lazy">
      </div>
      <div class="flyer-info-container">
        <span class="flyer-info-title">${flyer.name}</span>
        <button class="flyer-share-btn" onclick="shareFlyerWA('${flyer.webContentLink}')">
          <i class="fa-solid fa-share-nodes"></i> Share WA
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openFlyerLightbox(name, imgUrl) {
  const lightbox = document.getElementById('flyer-lightbox');
  const img = document.getElementById('lightbox-flyer-img');
  const title = document.getElementById('lightbox-flyer-title');
  const shareBtn = document.getElementById('btn-share-flyer-wa');

  if (!lightbox || !img || !title) return;

  img.src = imgUrl;
  title.textContent = name;
  
  const shareText = `Yuk ikuti kegiatan literasi seru ini! Lihat flyer acaranya di sini: ${imgUrl}\n\nAkses info kegiatan lainnya di sukabumiberliterasi.netlify.app`;
  shareBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  lightbox.classList.remove('hidden');
}

function shareFlyerWA(imgUrl) {
  const shareText = `Yuk ikuti kegiatan literasi seru ini! Lihat flyer acaranya di sini: ${imgUrl}\n\nAkses info kegiatan lainnya di sukabumiberliterasi.netlify.app`;
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  window.open(url, '_blank');
}

function setupFlyerGallery() {
  const closeBtn = document.getElementById('close-flyer-lightbox');
  const lightbox = document.getElementById('flyer-lightbox');
  const backdrop = document.getElementById('flyer-lightbox-backdrop');
  if (closeBtn && lightbox) {
    closeBtn.addEventListener('click', () => {
      lightbox.classList.add('hidden');
    });
  }
  if (backdrop && lightbox) {
    backdrop.addEventListener('click', () => {
      lightbox.classList.add('hidden');
    });
  }
  loadFlyers();
}

function openNewsDetail(article) {
  const modal = document.getElementById('news-detail-modal');
  const img = document.getElementById('news-detail-img');
  const date = document.getElementById('news-detail-date');
  const title = document.getElementById('news-detail-title');
  const summary = document.getElementById('news-detail-summary');
  const shareBtn = document.getElementById('btn-share-news-wa');
  const blogLink = document.getElementById('btn-visit-news-blog');

  if (!modal || !title || !summary) return;

  if (img) {
    if (article.image) {
      img.src = article.image;
      document.getElementById('news-detail-img-container').style.display = 'block';
    } else {
      document.getElementById('news-detail-img-container').style.display = 'none';
    }
  }

  const dateFormatted = formatIndoDate(article.published);
  if (date) date.textContent = dateFormatted;

  title.textContent = article.title;
  summary.textContent = article.summary;

  const shareText = `*${article.title}*\n\n${article.summary}\n\nBaca berita lengkapnya di sini: ${article.link}\n\nAkses info kegiatan literasi lainnya di sukabumiberliterasi.netlify.app`;
  shareBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  blogLink.href = article.link;

  modal.classList.remove('hidden');
}

function setupNewsDetailModal() {
  const closeBtn = document.getElementById('close-news-modal');
  const backdrop = document.getElementById('news-detail-backdrop');
  const modal = document.getElementById('news-detail-modal');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }
  if (backdrop && modal) {
    backdrop.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    setupNavigation();
    loadAllAppData();
    loadWeather();
    setupQiblaCompass();
    setupFlyerGallery();
    setupNewsDetailModal();
});

