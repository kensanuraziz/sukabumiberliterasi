import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';

const STATIC_VOUCHERS = [
  { kode: 'LITERA5', tipe: 'persentase', nilai: 5, minBelanja: 0 },
  { kode: 'SUKABUMI', tipe: 'nominal', nilai: 2000, minBelanja: 0 },
  { kode: 'DISKON5', tipe: 'persentase', nilai: 5, minBelanja: 0 },
  { kode: 'DISKON10', tipe: 'persentase', nilai: 10, minBelanja: 0 },
  { kode: 'TOKOLITERA', tipe: 'nominal', nilai: 3000, minBelanja: 0 },
  { kode: 'PERCIS', tipe: 'persentase', nilai: 5, minBelanja: 0 },
  { kode: 'BERLITERASI', tipe: 'nominal', nilai: 5000, minBelanja: 0 }
];

const getBgGradient = (category) => {
  const cat = String(category).toLowerCase();
  if (cat.includes('buku')) return "from-emerald-400/25 to-teal-500/25";
  if (cat.includes('merchandise')) return "from-amber-400/25 to-orange-500/25";
  if (cat.includes('aksesoris')) return "from-rose-400/25 to-red-500/25";
  if (cat.includes('digital')) return "from-purple-400/25 to-pink-500/25";
  if (cat.includes('mainan') || cat.includes('fisik')) return "from-blue-400/25 to-indigo-500/25";
  return "from-teal-400/25 to-cyan-500/25";
};

const getIconForCategory = (category) => {
  const cat = String(category).toLowerCase();
  if (cat.includes('buku')) return 'menu_book';
  if (cat.includes('digital')) return 'devices';
  if (cat.includes('mainan')) return 'sports_esports';
  if (cat.includes('merchandise')) return 'apparel';
  if (cat.includes('aksesoris')) return 'bookmark';
  return 'storefront';
};

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

const getDrivePdfThumbnail = (url) => {
  if (!url) return '';
  const urlStr = String(url).trim();
  if (urlStr.includes('drive.google.com')) {
    let id = '';
    if (urlStr.includes('/file/d/')) {
      const parts = urlStr.split('/file/d/');
      if (parts[1]) {
        id = parts[1].split('/')[0].split('?')[0];
      }
    } else if (urlStr.includes('id=')) {
      const parts = urlStr.split('id=');
      if (parts[1]) {
        id = parts[1].split('&')[0];
      }
    }
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w800` : '';
  }
  return '';
};

// Haversine formula to calculate distance in km
const calculateDistance = (lat1, lon1, lat2 = -6.9142, lon2 = 106.9388) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Extract lat/lng coordinates from various Google Maps URL formats
const extractCoordsFromGoogleMapsUrl = (url) => {
  if (!url) return null;
  try {
    // Format: @lat,lng or @lat,lng,zoom
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

    // Format: ?q=lat,lng or query=lat,lng
    const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

    // Format: /place/lat,lng
    const placeMatch = url.match(/\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };

    // Format: ll=lat,lng
    const llMatch = url.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };

    // Format: !3d-lat!4dlng (Google Maps embed/directions internal format)
    const dMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (dMatch) return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
  } catch (e) {
    console.error('Failed to parse Google Maps URL:', e);
  }
  return null;
};

// Geocode a textual address using OpenStreetMap Nominatim API (Free and Open, CORS enabled)
const geocodeAddress = async (addressText) => {
  if (!addressText) return null;
  try {
    // Strip RT/RW to improve OSM geocoding matching accuracy
    const cleanAddress = addressText.replace(/(RT|RW)\s*\d+\/?\s*\d*/gi, '').trim();
    const query = cleanAddress || addressText;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: {
        'User-Agent': 'TokoliteraApp/1.0 (sukabumiberliterasi@gmail.com)'
      }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
};

// Validate that coordinates are within a reasonable bounding box (Jawa Barat + buffer)
// This prevents Nominatim from returning wildly inaccurate results
const isReasonableCoordinate = (lat, lng) => {
  return lat >= -7.8 && lat <= -6.0 && lng >= 105.0 && lng <= 108.5;
};

// Get actual road distance using OSRM (Open Source Routing Machine) — Free, no API key needed
const getRouteDistance = async (lat1, lng1, lat2, lng2) => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`
    );
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      return {
        distance: data.routes[0].distance / 1000, // meter → km
        duration: Math.round(data.routes[0].duration / 60), // detik → menit
      };
    }
  } catch (error) {
    console.error('OSRM routing error:', error);
  }
  return null;
};

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  let videoId = '';
  try {
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v');
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
    }
  } catch (e) {
    console.error(e);
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

const parseVariantString = (str) => {
  if (!str || !str.trim()) return null;
  const cleanStr = String(str).trim();
  
  // Extract variant name
  let name = '';
  if (cleanStr.toLowerCase().includes('tidak ada varian')) {
    name = '';
  } else {
    const nameMatch = cleanStr.match(/Nama\s+Varian\s*:\s*([^,]+)/i);
    if (nameMatch) {
      name = nameMatch[1].trim();
    } else {
      const parts = cleanStr.split(',');
      if (parts[0] && !parts[0].includes('Stock') && !parts[0].includes('Harga')) {
        name = parts[0].replace(/.*:/, '').trim();
      }
    }
  }

  // Extract Stock
  let stock = 0;
  const stockMatch = cleanStr.match(/Stock\s*:\s*(\d+)/i);
  if (stockMatch) {
    stock = parseInt(stockMatch[1], 10);
  }

  // Extract Harga Jual (original price)
  let originalPrice = 0;
  const originalPriceMatch = cleanStr.match(/Harga\s+Jual\s*:\s*([^,]+)/i);
  if (originalPriceMatch) {
    const rawMatch = originalPriceMatch[1].split(/berat/i)[0];
    originalPrice = parseInt(rawMatch.replace(/[^0-9]/g, ''), 10) || 0;
  }

  // Extract Harga Setelah Diskon
  let price = 0;
  const discountPriceMatch = cleanStr.match(/Harga\s+Setelah\s+Diskon\s*(?::)?\s*([^,]+)/i);
  if (discountPriceMatch) {
    const rawMatch = discountPriceMatch[1].split(/berat/i)[0];
    price = parseInt(rawMatch.replace(/[^0-9]/g, ''), 10) || 0;
  }

  if (price === 0) {
    price = originalPrice;
  }

  // Extract Berat (Weight) if available in variant string
  let weight = 0;
  const weightMatch = cleanStr.match(/Berat\s*:\s*([0-9.]+)/i);
  if (weightMatch) {
    weight = parseFloat(weightMatch[1]) || 0;
  }

  return {
    name,
    stock,
    originalPrice,
    price,
    weight
  };
};

const getLabelStyles = (label) => {
  const norm = String(label).toLowerCase().trim();
  if (norm.includes('tbm') || norm.includes('literasi')) {
    return 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/15';
  }
  if (norm.includes('umkm') || norm.includes('lokal')) {
    return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/15';
  }
  if (norm.includes('sale') || norm.includes('promo') || norm.includes('diskon') || norm.includes('flash')) {
    return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/15';
  }
  if (norm.includes('baru') || norm.includes('new')) {
    return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/15';
  }
  
  // Default color schemes based on character length/hash to ensure different labels look different
  const hash = norm.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const schemes = [
    'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/15',
    'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/15',
    'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/15',
    'bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 border border-pink-500/15'
  ];
  return schemes[hash % schemes.length];
};

// ID Google Sheets Responses/Jawaban Google Form Transaksi Anda
// Masukkan ID spreadsheet di sini agar status pelacakan dibaca secara langsung/live dari Google Sheets Admin.
// Salin bagian ID dari URL spreadsheet Anda (antara /d/ dan /edit).
// Pastikan pengaturan berbagi spreadsheet diatur ke "Siapa saja yang memiliki link dapat melihat" (Anyone with link can view).
const SHEET_TRANSACTIONS = '1CiEeQuUvNBq6FC7sVQJ6Lmj3JwPj38AIv4YCgnpaECM';

// ID Google Sheets Akun Pengguna (Response Google Form Pendaftaran)
const SHEET_ACCOUNTS = '1FL8T0wx_qnmsaEIffhZXJOBuyzpa_cptdqsVDqrbwbQ';

// ID Google Sheets Banner Iklan (Link PDF)
const SHEET_BANNERS = '1mV3DcoatP0KN4i32VM3cSYjmZ_90ICZV_gVCfsZFNdE'; 

export default function SupportSection({ 
  products, 
  loading, 
  shippingServices,
  isHidden,
  darkMode,
  toggleDarkMode
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('tokolitera_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState('info'); // 'info', 'likes', 'orders'
  const [loginLoading, setLoginLoading] = useState(false);

  // Banner ads state
  const [bannerAds, setBannerAds] = useState([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);



  // Parse shipping services from spreadsheet
  const parsedShippingServices = React.useMemo(() => {
    if (!shippingServices || shippingServices.length <= 1) return [];
    return shippingServices.slice(1).map((r, idx) => ({
      id: `ship-${idx}`,
      name: r[1] || 'Kurir',
      type: r[2] || 'Reguler',
      estimasi: r[3] || '-',
      tarifPerKm: parseInt(String(r[4] || '0').replace(/[^0-9]/g, ''), 10) || 0,
      tarifTambahanBerat: parseInt(String(r[5] || '0').replace(/[^0-9]/g, ''), 10) || 0,
      tarifMinimum: parseInt(String(r[6] || '0').replace(/[^0-9]/g, ''), 10) || 0,
      area: r[7] || '',
      aktif: String(r[8] || '').trim().toLowerCase() === 'aktif'
    }));
  }, [shippingServices]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Cart States
  const [cart, setCart] = useState({});
  const [shippingDistance, setShippingDistance] = useState(1); // default 1 km
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [hasGps, setHasGps] = useState(false);
  const [gpsSource, setGpsSource] = useState(''); // 'browser' | 'googlemaps' | 'nominatim' | 'osrm'
  const [sellerCoords, setSellerCoords] = useState(null); // { lat, lng }
  const [buyerCoords, setBuyerCoords] = useState(null);   // { lat, lng }
  const [routeDuration, setRouteDuration] = useState(null); // minutes
  const [sellerDisplayAddress, setSellerDisplayAddress] = useState(''); // for route info display
  const [deliveryMethod, setDeliveryMethod] = useState(''); // shipping service ID or 'seller_courier'

  // Recipient info states
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressLandmark, setAddressLandmark] = useState('');
  const [sellerNote, setSellerNote] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [courierNote, setCourierNote] = useState('');
  
  // Voucher States
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  
  // Checkout/Receipt States
  const [receiptImage, setReceiptImage] = useState(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [hasDownloadedReceipt, setHasDownloadedReceipt] = useState(false);
  const [checkoutOrderId, setCheckoutOrderId] = useState('');
  const [checkoutWaText, setCheckoutWaText] = useState('');

  // Auth states
  
  // Registration Form states
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  // Login Form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Profile Settings & Wishlist & Orders states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [modalQty, setModalQty] = useState(1);
  const [likedProductIds, setLikedProductIds] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  
  // Profile edit fields
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileProv, setProfileProv] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileDist, setProfileDist] = useState('');
  const [profileSubDist, setProfileSubDist] = useState('');
  const [profilePatokan, setProfilePatokan] = useState('');
  const [profilePostalCode, setProfilePostalCode] = useState('');
  const [profileGoogleMapsUrl, setProfileGoogleMapsUrl] = useState('');
  
  // Multi-address (#1) - max 3 saved addresses per user
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(0);
  
  // New address form states
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressIdx, setEditingAddressIdx] = useState(null);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddressRecipientName, setNewAddressRecipientName] = useState('');
  const [newAddressRecipientPhone, setNewAddressRecipientPhone] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [newAddressPatokan, setNewAddressPatokan] = useState('');
  const [newAddressMapsUrl, setNewAddressMapsUrl] = useState('');

  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewCode, setReviewCode] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewProductTitle, setReviewProductTitle] = useState(''); // auto from order
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState(null); // base64 photo
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [reviewToast, setReviewToast] = useState(''); // inline toast instead of alert
  const [localReviews, setLocalReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('tokolitera_reviews');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Live Tracking state
  const [showTracking, setShowTracking] = useState(false);
  const [trackingStep, setTrackingStep] = useState(0); // 0 to 4
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [trackingProductTitles, setTrackingProductTitles] = useState('');
  const [trackingSellerAddress, setTrackingSellerAddress] = useState('');
  const [trackingSellerMapUrl, setTrackingSellerMapUrl] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const customAlert = (msg) => { setAlertMessage(msg); };
  const [buyNowPrevProduct, setBuyNowPrevProduct] = useState(null);

  // Persist reviews to localStorage
  React.useEffect(() => {
    localStorage.setItem('tokolitera_reviews', JSON.stringify(localReviews));
  }, [localReviews]);

  // Fetch banner ads from Google Sheets
  React.useEffect(() => {
    if (!SHEET_BANNERS) return;
    const fetchBanners = async () => {
      try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_BANNERS}/gviz/tq?tqx=out:json&t=${Date.now()}`);
        if (!res.ok) return;
        const text = await res.text();
        const jsonStart = text.indexOf('google.visualization.Query.setResponse(');
        if (jsonStart === -1) return;
        const rawJson = text.substring(jsonStart + 'google.visualization.Query.setResponse('.length, text.length - 2);
        const parsed = JSON.parse(rawJson);
        const rows = parsed.table?.rows || [];
        const banners = rows
          .map(row => {
            if (!row || !row.c) return null;
            const linkPdf = row.c[1]?.v;
            if (!linkPdf) return null;
            return { link: linkPdf };
          })
          .filter(Boolean);
        setBannerAds(banners);
      } catch (err) {
        console.error('Failed to fetch banner ads:', err);
      }
    };
    fetchBanners();
  }, []);

  // Auto-rotate banner ads
  React.useEffect(() => {
    if (bannerAds.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex(prev => (prev + 1) % bannerAds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerAds.length]);

  const parsedProducts = React.useMemo(() => {
    if (!products || products.length <= 1) return [];
    return products.slice(1).map((r, idx) => {
      // 0: No, 1: Nama Toko, 2: Nama Produk, 3: Gambar Ke 1, 4: Video, 5: Gambar Ke 2, 6: Gambar Ke 3, 7: Gambar Ke 4, 8: Gambar Ke 5
      // 9: Kategori, 10: Deskripsi Produk, 11: Stock, 12: Harga Jual, 13: Harga Setelah Diskon, 14: Alamat Penjual, 15: Google maps penjual, 16: Harga antar dari Penjual per 1km
      const shopName = r[1] || 'Toko Tokolitera';
      const title = r[2] || 'Produk Literasi';
      const images = [
        getImageUrl(r[3]),
        getImageUrl(r[5]),
        getImageUrl(r[6]),
        getImageUrl(r[7]),
        getImageUrl(r[8])
      ].filter(Boolean);

      const youtubeUrl = r[4] || '';
      const category = r[9] || 'Lainnya';
      const desc = r[10] || '';
      
      // Parse Varian 1, 2, 3, 4 from columns 11, 12, 13, 14
      const parsedVariants = [
        parseVariantString(r[11]),
        parseVariantString(r[12]),
        parseVariantString(r[13]),
        parseVariantString(r[14])
      ].filter(Boolean);

      const hasVariants = parsedVariants.length > 1 || (parsedVariants[0] && parsedVariants[0].name !== '');
      const variantList = hasVariants ? parsedVariants.map(v => v.name) : [];

      // Get base price/stock from the first variant
      const baseVar = parsedVariants[0] || { name: '', stock: 0, originalPrice: 0, price: 0 };
      const stock = baseVar.stock;
      const originalPrice = baseVar.originalPrice;
      const price = baseVar.price;

      const weightVal = r[15];
      let productWeight = 0;
      if (weightVal) {
        const cleanWeight = String(weightVal).replace(/varian\s*\d+/gi, '');
        const match = cleanWeight.match(/[0-9]+(?:[.,][0-9]+)?/);
        if (match) {
          productWeight = parseFloat(match[0].replace(',', '.')) || 0;
        }
      }
      
      if (baseVar && baseVar.weight > 0) {
        productWeight = baseVar.weight;
      }

      const sellerAddress = r[16] || '';
      const sellerMapUrl = r[17] || '';
      
      const rateVal = r[18];
      const sellerDeliveryRate = rateVal !== undefined && rateVal !== null && rateVal !== ''
        ? parseInt(String(rateVal).replace(/[^0-9]/g, ''), 10) || 0
        : 0;

      const label = r[19] || '';
      const shippingPrep = r[20] || '';

      return {
        id: r[0] || `p-${idx}`,
        shopName,
        title,
        images,
        imageUrl: images[0] || '',
        youtubeUrl,
        category,
        desc,
        stock,
        originalPrice,
        price,
        productWeight,
        sellerAddress,
        sellerMapUrl,
        sellerDeliveryRate,
        label,
        shippingPrep,
        parsedVariants,
        hasVariants,
        variantList,
        imageIcon: getIconForCategory(category),
        bgGradient: getBgGradient(category)
      };
    });
  }, [products]);

  // Load product from URL query parameter (productId)
  React.useEffect(() => {
    if (!loading && parsedProducts && parsedProducts.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const productParam = params.get('productId');
      if (productParam) {
        const found = parsedProducts.find(p => String(p.id) === productParam);
        if (found) {
          setSelectedProduct(found);
        }
        // Clean URL parameter without page reload
        const url = new URL(window.location);
        url.searchParams.delete('productId');
        window.history.replaceState({}, '', url);
      }
    }
  }, [loading, parsedProducts]);

  // Live tracking & syncing status from Google Sheets (if SHEET_TRANSACTIONS is defined)
  React.useEffect(() => {
    if (!showTracking || !trackingOrderId || !SHEET_TRANSACTIONS) {
      // Fallback: Simulator if SHEET_TRANSACTIONS is empty
      if (showTracking && !SHEET_TRANSACTIONS) {
        const interval = setInterval(() => {
          setTrackingStep(prev => {
            if (prev >= 4) {
              clearInterval(interval);
              return 4;
            }
            return prev + 1;
          });
        }, 5000);
        return () => clearInterval(interval);
      }
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_TRANSACTIONS}/gviz/tq?tqx=out:json&t=${Date.now()}`);
        if (!res.ok) return;
        const text = await res.text();
        const jsonStart = text.indexOf('google.visualization.Query.setResponse(');
        if (jsonStart === -1) return;
        const rawJson = text.substring(jsonStart + 'google.visualization.Query.setResponse('.length, text.length - 2);
        const parsed = JSON.parse(rawJson);
        const rows = parsed.table?.rows || [];

        for (const row of rows) {
          if (!row || !row.c) continue;
          const oId = row.c[1]?.v;
          if (oId && String(oId).trim().toUpperCase() === trackingOrderId.trim().toUpperCase()) {
            const status = row.c[8]?.v || 'Belum Dibayar';
            
            // Map status string to step value:
            // 0: Belum Dibayar
            // 1: Sedang Dikemas (atau Diterima Penjual)
            // 2: Kurir Menuju Penjual
            // 3: Paket Sedang Diantar / Kurir Mendekati Lokasi
            // 4: Selesai
            let step = 0;
            const s = status.toLowerCase();
            if (s.includes('belum dibayar') || s.includes('menunggu')) step = 0;
            else if (s.includes('dikemas') || s.includes('diterima penjual') || s.includes('proses')) step = 1;
            else if (s.includes('dikirim') || s.includes('diantar') || s.includes('jalan')) step = 3;
            else if (s.includes('mendekati') || s.includes('dekat')) step = 3;
            else if (s.includes('selesai') || s.includes('tiba') || s.includes('terima')) step = 4;

            setTrackingStep(step);

            // Update local history as well
            setOrderHistory(prev => {
              const next = prev.map(order => {
                if (order.orderId === trackingOrderId) {
                  return { ...order, status };
                }
                return order;
              });
              localStorage.setItem(`tokolitera_orders_${currentUser.username}`, JSON.stringify(next));
              return next;
            });
            break;
          }
        }
      } catch (err) {
        console.error("Live tracking status fetch error:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll status every 10 seconds
    return () => clearInterval(interval);
  }, [showTracking, trackingOrderId, currentUser]);

  const submitOrderToGoogleSheets = (orderId, username, recipient, shops, details, total, address, status) => {
    const transactionFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdVZiuZQmk2EKfKcK6KxsTM02Sp3kpoc_Ltqm2_DD6S-QB3-g/formResponse";
    const formData = new FormData();
    formData.append("entry.1108011341", orderId);
    formData.append("entry.636157710", username);
    formData.append("entry.1663565168", recipient);
    formData.append("entry.2041677886", shops);
    formData.append("entry.1588999426", details);
    formData.append("entry.518855684", total);
    formData.append("entry.480572829", address);
    formData.append("entry.1178591047", status);

    fetch(transactionFormUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData
    }).catch(err => {
      console.log("Transaction sheet submission notice:", err);
    });
  };

  // Sync all order statuses from Google Sheets when the profile order tab is active
  const syncOrderStatusesFromGoogleSheets = async () => {
    if (!currentUser || orderHistory.length === 0 || !SHEET_TRANSACTIONS) return;
    
    try {
      const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_TRANSACTIONS}/gviz/tq?tqx=out:json&t=${Date.now()}`);
      if (!res.ok) return;
      const text = await res.text();
      const jsonStart = text.indexOf('google.visualization.Query.setResponse(');
      if (jsonStart === -1) return;
      const rawJson = text.substring(jsonStart + 'google.visualization.Query.setResponse('.length, text.length - 2);
      const parsed = JSON.parse(rawJson);
      
      const rows = parsed.table?.rows || [];
      if (rows.length === 0) return;

      const sheetStatuses = {};
      rows.forEach(row => {
        if (!row || !row.c) return;
        const oId = row.c[1]?.v;
        const status = row.c[8]?.v;
        if (oId && status) {
          sheetStatuses[String(oId).trim().toUpperCase()] = String(status).trim();
        }
      });

      setOrderHistory(prev => {
        let hasChanges = false;
        const next = prev.map(order => {
          const sheetStatus = sheetStatuses[order.orderId.toUpperCase()];
          if (sheetStatus && order.status !== sheetStatus) {
            hasChanges = true;
            return { ...order, status: sheetStatus };
          }
          return order;
        });

        if (hasChanges) {
          localStorage.setItem(`tokolitera_orders_${currentUser.username}`, JSON.stringify(next));
        }
        return next;
      });
    } catch (e) {
      console.error("Failed to sync order statuses from Google Sheets:", e);
    }
  };

  React.useEffect(() => {
    if (profileTab === 'orders') {
      syncOrderStatusesFromGoogleSheets();
    }
  }, [profileTab]);

  // Sync user profile settings, wishlist, and order history on login
  React.useEffect(() => {
    if (currentUser) {
      setRecipientName(currentUser.fullName || '');
      // We will handle deliveryAddress, addressLandmark, and buyerCoords via savedAddresses
      
      // Load profile fields
      setProfileFullName(currentUser.fullName || '');
      setProfilePhoto(currentUser.profilePhoto || '');
      setProfilePhone(currentUser.phoneNumber || '');
      setProfileEmail(currentUser.email || '');
      setProfileAddress(currentUser.address || '');
      setProfileProv(currentUser.provinsi || '');
      setProfileCity(currentUser.kota || '');
      setProfileDist(currentUser.kecamatan || '');
      setProfileSubDist(currentUser.kelurahan || '');
      setProfilePatokan(currentUser.patokan || '');
      setProfilePostalCode(currentUser.kodePos || '');
      setProfileGoogleMapsUrl(currentUser.googleMapsUrl || '');

      // Buyer coordinates are now synced from the selected address

      // Load Wishlist (Liked Products)
      try {
        const savedLikes = localStorage.getItem(`tokolitera_likes_${currentUser.username}`);
        setLikedProductIds(savedLikes ? JSON.parse(savedLikes) : []);
      } catch (e) {
        setLikedProductIds([]);
      }

      // Load Order History
      try {
        const savedOrders = localStorage.getItem(`tokolitera_orders_${currentUser.username}`);
        setOrderHistory(savedOrders ? JSON.parse(savedOrders) : []);
      } catch (e) {
        setOrderHistory([]);
      }

      // Load saved addresses (#1)
      try {
        const addrs = localStorage.getItem(`tokolitera_addresses_${currentUser.username}`);
        if (addrs) {
          setSavedAddresses(JSON.parse(addrs));
        } else {
          // Create default address from profile
          const defaultAddr = currentUser.address || '';
          if (defaultAddr) {
            const defaultEntry = { 
              label: 'Alamat Utama', 
              recipientName: currentUser.fullName || '',
              recipientPhone: currentUser.phoneNumber || '',
              address: [
                currentUser.address,
                currentUser.kelurahan ? `Kel. ${currentUser.kelurahan}` : '',
                currentUser.kecamatan ? `Kec. ${currentUser.kecamatan}` : '',
                currentUser.kota,
                currentUser.provinsi,
                currentUser.kodePos
              ].filter(Boolean).join(', '),
              patokan: currentUser.patokan || '',
              mapsUrl: currentUser.googleMapsUrl || '' 
            };
            setSavedAddresses([defaultEntry]);
            localStorage.setItem(`tokolitera_addresses_${currentUser.username}`, JSON.stringify([defaultEntry]));
          }
        }
        setSelectedAddressIdx(0);
      } catch (e) {
        setSavedAddresses([]);
      }
    } else {
      setRecipientName('');
      setDeliveryAddress('');
      setProfileFullName('');
      setProfilePhoto('');
      setProfilePhone('');
      setProfileEmail('');
      setProfileAddress('');
      setProfileProv('');
      setProfileCity('');
      setProfileDist('');
      setProfileSubDist('');
      setProfilePatokan('');
      setProfilePostalCode('');
      setProfileGoogleMapsUrl('');
      setLikedProductIds([]);
      setOrderHistory([]);
    }
  }, [currentUser]);

  // Sync selected address to checkout fields
  React.useEffect(() => {
    if (savedAddresses.length > 0 && savedAddresses[selectedAddressIdx]) {
      const selected = savedAddresses[selectedAddressIdx];
      setRecipientName(selected.recipientName || currentUser?.fullName || '');
      setRecipientPhone(selected.recipientPhone || currentUser?.phone || '');
      setDeliveryAddress(selected.address || '');
      setAddressLandmark(selected.patokan || '');
      
      const mapsUrl = selected.mapsUrl || '';
      if (mapsUrl) {
        const coords = extractCoordsFromGoogleMapsUrl(mapsUrl);
        if (coords && isReasonableCoordinate(coords.lat, coords.lng)) {
          setBuyerCoords({ lat: coords.lat, lng: coords.lng });
          setGpsSource('googlemaps');
        } else {
          setBuyerCoords(null);
          setGpsSource('');
        }
      } else {
        setBuyerCoords(null);
        setGpsSource('');
      }
    } else {
      setDeliveryAddress('');
      setAddressLandmark('');
      setSellerNote('');
      setAdminNote('');
      setCourierNote('');
      setBuyerCoords(null);
      setGpsSource('');
    }
  }, [savedAddresses, selectedAddressIdx]);



  const categories = React.useMemo(() => {
    const cats = new Set(parsedProducts.map(p => p.category).filter(Boolean));
    return ['Semua', ...Array.from(cats)];
  }, [parsedProducts]);

  const filteredProducts = parsedProducts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.desc.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (value) => {
    if (value === 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  };

  // Cart Handlers
  const addToCart = (product, variant, qty = 1) => {
    const cartKey = product.id + (variant ? `-${variant}` : '');
    const resolvedPrice = (variant && product.hasVariants)
      ? (product.parsedVariants.find(v => v.name === variant)?.price || product.price)
      : product.price;

    setCart(prev => {
      const existing = prev[cartKey];
      return {
        ...prev,
        [cartKey]: {
          product,
          variant,
          quantity: existing ? existing.quantity + qty : qty,
          price: resolvedPrice
        }
      };
    });
  };

  const handleAddToCartSecure = (product, variant, qty = 1) => {
    if (!currentUser) {
      setAuthMode('register');
      setShowAuthModal(true);
      customAlert("Harap masuk atau daftar akun pembeli terlebih dahulu untuk melakukan pembelian!");
      return false;
    }
    const hasVar = product.hasVariants || (product.variantList && product.variantList.length > 0);
    if (hasVar && !variant) {
      customAlert("Harap pilih varian produk terlebih dahulu!");
      return false;
    }
    addToCart(product, variant, qty);
    return true;
  };

  const handleBuyNow = (product, variant, qty = 1) => {
    if (!currentUser) {
      setAuthMode('register');
      setShowAuthModal(true);
      customAlert("Harap masuk atau daftar akun pembeli terlebih dahulu untuk melakukan pembelian!");
      return;
    }
    const hasVar = product.hasVariants || (product.variantList && product.variantList.length > 0);
    if (hasVar && !variant) {
      customAlert("Harap pilih varian produk terlebih dahulu!");
      return;
    }
    const cartKey = product.id + (variant ? `-${variant}` : '');
    const resolvedPrice = (variant && product.hasVariants)
      ? (product.parsedVariants.find(v => v.name === variant)?.price || product.price)
      : product.price;

    setCart(prev => {
      return {
        ...prev,
        [cartKey]: {
          product,
          variant,
          quantity: qty,
          price: resolvedPrice
        }
      };
    });
    setBuyNowPrevProduct({ product, variant, qty });
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleShareProduct = (product, e) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}?page=support&productId=${product.id}`;
    const shareText = `*Katalog Produk Tokolitera:* ${product.title}\n\nLihat detail produk menarik ini di Tokolitera Sukabumi Berliterasi:\n👉 ${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Katalog Produk Tokolitera: ${product.title}`,
        url: shareUrl
      }).catch(err => console.warn("Gagal membagikan produk:", err));
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        customAlert("Link produk telah disalin ke clipboard! Silakan bagikan.");
      }).catch(err => {
        console.error("Gagal menyalin link produk:", err);
      });
    }
  };

  const handleToggleLikeProduct = (productId, e) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      setAuthMode('register');
      setShowAuthModal(true);
      customAlert("Harap login atau daftar akun terlebih dahulu untuk menyukai produk!");
      return;
    }
    
    setLikedProductIds(prev => {
      let next;
      if (prev.includes(productId)) {
        next = prev.filter(id => id !== productId);
      } else {
        next = [...prev, productId];
      }
      localStorage.setItem(`tokolitera_likes_${currentUser.username}`, JSON.stringify(next));
      return next;
    });
  };

  const updateQuantity = (productId, amount) => {
    setCart(prev => {
      const existing = prev[productId];
      if (!existing) return prev;
      const newQty = existing.quantity + amount;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return {
        ...prev,
        [productId]: {
          ...existing,
          quantity: newQty
        }
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      customAlert('Pilih file gambar yang valid (JPG/PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300; // compress to max 300px
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Quality 0.6 keeps file size very small
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
        setProfilePhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleGetGpsForProfile = (setMapsUrlFunc) => {
    if (!navigator.geolocation) {
      customAlert('Browser Anda tidak mendukung GPS Geolocation.');
      return;
    }
    
    setGpsLoading(true); // Reuse existing gpsLoading state for UI feedback
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapsUrlFunc(`https://maps.google.com/?q=${latitude},${longitude}`);
        setGpsLoading(false);
      },
      (error) => {
        customAlert('Gagal mendapatkan lokasi GPS. Pastikan izin lokasi aktif dan sinyal kuat.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  // GPS geolocation handler has been removed per user request

  const cartItems = Object.values(cart);
  const groupedCartItems = React.useMemo(() => {
    const groups = {};
    cartItems.forEach(item => {
      const shop = item.product.shopName || 'Toko Tokolitera';
      if (!groups[shop]) {
        groups[shop] = [];
      }
      groups[shop].push(item);
    });
    return groups;
  }, [cartItems]);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + ((item.price || item.product.price) * item.quantity), 0);
  const adminFee = 1000;
  
  // Check if cart contains physical items (anything that is NOT "Produk Digital")
  const hasPhysicalItems = cartItems.some(item => !item.product.category.toLowerCase().includes('digital'));

  // Shipping calculation logic:
  // If only digital products are in the cart, delivery is FREE (Rp0)
  // Uses selected shipping service tariff from spreadsheet
  const physicalItems = cartItems.filter(item => !item.product.category.toLowerCase().includes('digital'));
  const maxSellerRate = physicalItems.length > 0
    ? Math.max(...physicalItems.map(item => item.product.sellerDeliveryRate || 0), 0)
    : 0;

  const uniqueShopsInCart = Array.from(new Set(physicalItems.map(item => item.product.shopName)));

  // Find the selected shipping service object
  const selectedShippingService = parsedShippingServices.find(s => s.id === deliveryMethod) || null;

  const shippingFee = !hasPhysicalItems || !deliveryAddress.trim() || !hasGps || !deliveryMethod
    ? 0
    : uniqueShopsInCart.reduce((total, shop) => {
        const shopItems = physicalItems.filter(item => item.product.shopName === shop);
        const maxShopRate = Math.max(...shopItems.map(item => item.product.sellerDeliveryRate || 0), 0);
        
        let shopFee = 0;
        if (deliveryMethod === 'seller_courier') {
          // Kurir penjual: gunakan tarif penjual dari spreadsheet produk
          shopFee = shippingDistance < 1 
            ? (maxShopRate > 0 ? maxShopRate : 3000) 
            : Math.ceil(shippingDistance) * (maxShopRate > 0 ? maxShopRate : 5000);
        } else if (selectedShippingService) {
          // Jasa kirim dari spreadsheet: gunakan tarif per km & minimum + tambahan berat per kg
          const baseFee = shippingDistance < 1 
            ? selectedShippingService.tarifMinimum 
            : Math.ceil(shippingDistance) * selectedShippingService.tarifPerKm;
            
          const shopTotalWeight = shopItems.reduce((sum, item) => sum + (item.quantity * (item.product.productWeight || 0)), 0);
          const weightFee = shopTotalWeight * (selectedShippingService.tarifTambahanBerat || 0);
          
          shopFee = baseFee + weightFee;
        } else {
          // Fallback: tarif standar
          shopFee = shippingDistance < 1 ? 3000 : Math.ceil(shippingDistance) * 5000;
        }
        
        return total + shopFee;
      }, 0);
      
  // Calculate discount
  let discountAmount = 0;
  if (appliedVoucher) {
    if (String(appliedVoucher.tipe).toLowerCase() === 'persentase') {
      discountAmount = (subtotal * appliedVoucher.nilai) / 100;
    } else {
      discountAmount = appliedVoucher.nilai;
    }
    if (discountAmount > subtotal) discountAmount = subtotal; // limit discount
  }
    
  const grandTotal = subtotal > 0 ? (subtotal - discountAmount + adminFee + shippingFee) : 0;

  // Auto-geocode addresses to calculate distance automatically without Google Maps URLs
  // IMPORTANT: This only runs if gpsSource is NOT already 'browser' or 'googlemaps'
  // to prevent overwriting accurate GPS readings with less accurate Nominatim results
  React.useEffect(() => {
    if (!hasPhysicalItems || !deliveryAddress.trim()) return;
    
    // Don't overwrite if we already have an accurate GPS source
    if (gpsSource === 'browser' || gpsSource === 'googlemaps') return;

    const timer = setTimeout(async () => {
      setGpsLoading(true);
      setGpsError('');

      // Find first physical item to identify seller address / coordinates
      const firstPhysicalItem = cartItems.find(item => !item.product.category.toLowerCase().includes('digital'));
      if (!firstPhysicalItem) {
        setGpsLoading(false);
        return;
      }

      const sellerAddr = firstPhysicalItem.product.sellerAddress || '';
      const sellerMapUrl = firstPhysicalItem.product.sellerMapUrl || '';

      // Try to get seller coordinates
      let sLat = -6.9142;
      let sLng = 106.9388;
      const sCoords = extractCoordsFromGoogleMapsUrl(sellerMapUrl);
      if (sCoords) {
        sLat = sCoords.lat;
        sLng = sCoords.lng;
      } else if (sellerAddr) {
        const coords = await geocodeAddress(sellerAddr);
        if (coords && isReasonableCoordinate(coords.lat, coords.lng)) {
          sLat = coords.lat;
          sLng = coords.lng;
        }
      }

      // Geocode buyer's address
      // Priority: 1. Google Maps URL from selected address 2. Nominatim geocoding from address text
      let bCoords = null;

      const selectedAddress = (savedAddresses && savedAddresses.length > 0 && savedAddresses[selectedAddressIdx]) 
        ? savedAddresses[selectedAddressIdx] 
        : null;

      // 0. HIGHEST PRIORITY: Use selected address's Google Maps URL coordinates if available
      if (selectedAddress && selectedAddress.mapsUrl) {
        const gmCoords = extractCoordsFromGoogleMapsUrl(selectedAddress.mapsUrl);
        if (gmCoords && isReasonableCoordinate(gmCoords.lat, gmCoords.lng)) {
          bCoords = gmCoords;
        }
      }

      // 1. Try Kelurahan-level search first (highest precision) only for primary address
      if (!bCoords && selectedAddressIdx === 0 && currentUser && currentUser.kelurahan) {
        const kelurahanQuery = [
          `Kelurahan ${currentUser.kelurahan}`,
          currentUser.kecamatan ? `Kecamatan ${currentUser.kecamatan}` : '',
          currentUser.kota || 'Sukabumi',
          currentUser.provinsi || 'Jawa Barat'
        ].filter(Boolean).join(', ');
        
        bCoords = await geocodeAddress(kelurahanQuery);
        
        // Validate Nominatim result is within reasonable area
        if (bCoords && !isReasonableCoordinate(bCoords.lat, bCoords.lng)) {
          bCoords = null;
        }
        
        // 1.1 Simple fallback Kelurahan query if the combined one fails
        if (!bCoords) {
          const simpleKelurahan = `${currentUser.kelurahan}, ${currentUser.kota || 'Sukabumi'}`;
          bCoords = await geocodeAddress(simpleKelurahan);
          if (bCoords && !isReasonableCoordinate(bCoords.lat, bCoords.lng)) {
            bCoords = null;
          }
        }
      }

      // 2. Try Kecamatan-level search next only for primary address
      if (!bCoords && selectedAddressIdx === 0 && currentUser && currentUser.kecamatan) {
        const kecamatanQuery = [
          `Kecamatan ${currentUser.kecamatan}`,
          currentUser.kota || 'Sukabumi',
          currentUser.provinsi || 'Jawa Barat'
        ].filter(Boolean).join(', ');
        
        bCoords = await geocodeAddress(kecamatanQuery);
        if (bCoords && !isReasonableCoordinate(bCoords.lat, bCoords.lng)) {
          bCoords = null;
        }
      }

      // 3. Fallback to full address text
      if (!bCoords) {
        bCoords = await geocodeAddress(deliveryAddress);
        if (bCoords && !isReasonableCoordinate(bCoords.lat, bCoords.lng)) {
          bCoords = null;
        }
      }

      if (bCoords) {
        // Save coordinates for map display
        setSellerCoords({ lat: sLat, lng: sLng });
        setBuyerCoords({ lat: bCoords.lat, lng: bCoords.lng });
        setSellerDisplayAddress(sellerAddr || firstPhysicalItem.product.shopName || 'Toko');

        // Try OSRM for actual road distance first
        const route = await getRouteDistance(sLat, sLng, bCoords.lat, bCoords.lng);
        if (route) {
          const finalDistance = Math.max(1, parseFloat(route.distance.toFixed(1)));
          setShippingDistance(finalDistance);
          setRouteDuration(route.duration);
          setHasGps(true);
          setGpsSource('osrm');
          setGpsError('');
        } else {
          // Fallback to Haversine if OSRM is offline
          const distance = calculateDistance(bCoords.lat, bCoords.lng, sLat, sLng);
          const finalDistance = Math.max(1, parseFloat(distance.toFixed(2)));
          setShippingDistance(finalDistance);
          setRouteDuration(null);
          setHasGps(true);
          setGpsSource('nominatim');
          setGpsError('');
        }
      } else {
        // Fallback: If OSM Nominatim is completely offline or fails, use a safe estimate
        // so checkout is never blocked, but courier is still compensated fairly
        setShippingDistance(5.0);
        setRouteDuration(null);
        setSellerCoords(null);
        setBuyerCoords(null);
        setHasGps(true);
        setGpsSource('nominatim');
        setGpsError('Jarak dihitung estimasi 5 Km (alamat tidak terdeteksi presisi). Harap masukkan Link Google Maps di Profil untuk jarak akurat.');
      }
      setGpsLoading(false);
    }, 1500); // 1.5s debounce to respect Nominatim API guidelines

    return () => clearTimeout(timer);
  }, [deliveryAddress, hasPhysicalItems, currentUser, gpsSource, selectedAddressIdx, savedAddresses]);

  const selectedVariantInfo = (selectedProduct && selectedProduct.hasVariants && selectedVariant)
    ? selectedProduct.parsedVariants.find(v => v.name === selectedVariant)
    : null;

  // Check local stock (reduced after purchases) - falls back to spreadsheet stock
  const getEffectiveStock = (product) => {
    try {
      const localStock = JSON.parse(localStorage.getItem('tokolitera_local_stock') || '{}');
      if (localStock[product.title] !== undefined) return localStock[product.title];
    } catch {}
    return product.stock || 0;
  };

  const displayStock = selectedVariantInfo ? selectedVariantInfo.stock : (selectedProduct ? getEffectiveStock(selectedProduct) : 0);
  const displayOriginalPrice = selectedVariantInfo ? selectedVariantInfo.originalPrice : (selectedProduct ? selectedProduct.originalPrice : 0);
  const displayPrice = selectedVariantInfo ? selectedVariantInfo.price : (selectedProduct ? selectedProduct.price : 0);

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddressText.trim() || !newAddressPatokan.trim() || !newAddressMapsUrl.trim()) {
      customAlert("Alamat lengkap, patokan, dan link Google Maps wajib diisi!");
      return;
    }
    const newEntry = {
      label: newAddressLabel.trim() || `Alamat ${editingAddressIdx !== null ? editingAddressIdx + 1 : savedAddresses.length + 1}`,
      recipientName: newAddressRecipientName.trim() || currentUser.fullName || '',
      recipientPhone: newAddressRecipientPhone.trim() || currentUser.phone || '',
      address: newAddressText.trim(),
      patokan: newAddressPatokan.trim(),
      mapsUrl: newAddressMapsUrl.trim()
    };
    
    let updated;
    if (editingAddressIdx !== null) {
      updated = [...savedAddresses];
      updated[editingAddressIdx] = newEntry;
    } else {
      updated = [...savedAddresses, newEntry];
    }
    
    setSavedAddresses(updated);
    localStorage.setItem(`tokolitera_addresses_${currentUser.username}`, JSON.stringify(updated));
    setSelectedAddressIdx(editingAddressIdx !== null ? editingAddressIdx : updated.length - 1);
    
    // Reset form
    setIsAddingAddress(false);
    setEditingAddressIdx(null);
    setNewAddressLabel('');
    setNewAddressRecipientName('');
    setNewAddressRecipientPhone('');
    setNewAddressText('');
    setNewAddressPatokan('');
    setNewAddressMapsUrl('');
  };

  const handleEditAddress = (idx) => {
    const addr = savedAddresses[idx];
    setEditingAddressIdx(idx);
    setNewAddressLabel(addr.label || '');
    setNewAddressRecipientName(addr.recipientName || '');
    setNewAddressRecipientPhone(addr.recipientPhone || '');
    setNewAddressText(addr.address || '');
    setNewAddressPatokan(addr.patokan || '');
    setNewAddressMapsUrl(addr.mapsUrl || '');
    setIsAddingAddress(true);
  };

  const handleDeleteAddress = (idx) => {
    if (idx === 0) {
      customAlert("Alamat Utama tidak bisa dihapus.");
      return;
    }
    if (confirm("Hapus alamat ini?")) {
      const updated = savedAddresses.filter((_, i) => i !== idx);
      setSavedAddresses(updated);
      localStorage.setItem(`tokolitera_addresses_${currentUser.username}`, JSON.stringify(updated));
      setSelectedAddressIdx(0);
    }
  };

  const handleOpenDetail = (product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setSelectedVariant('');
    setModalQty(1);
  };

  const nextImage = () => {
    if (!selectedProduct) return;
    setActiveImageIndex((prev) => (prev + 1) % selectedProduct.images.length);
  };

  const prevImage = () => {
    if (!selectedProduct) return;
    setActiveImageIndex((prev) => (prev - 1 + selectedProduct.images.length) % selectedProduct.images.length);
  };

  // Checkout and Receipt Generation
  const handleCheckVoucher = () => {
    if (!voucherCode.trim()) return;
    setCheckingVoucher(true);
    setVoucherError('');
    setAppliedVoucher(null);
    
    const codeUpper = voucherCode.trim().toUpperCase();
    const foundVoucher = STATIC_VOUCHERS.find(v => v.kode === codeUpper);

    if (foundVoucher) {
      setAppliedVoucher(foundVoucher);
      setVoucherError('');
    } else {
      setVoucherError('Kode voucher tidak ditemukan atau tidak valid.');
    }
    setCheckingVoucher(false);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (!recipientName.trim()) {
      customAlert("Harap masukkan Nama Penerima.");
      return;
    }
    if (hasPhysicalItems && !deliveryAddress.trim()) {
      customAlert("Harap masukkan Alamat Lengkap untuk pengiriman fisik.");
      return;
    }
    if (hasPhysicalItems && !deliveryMethod) {
      customAlert("Harap pilih Opsi Jasa Kirim terlebih dahulu.");
      return;
    }

    setGeneratingReceipt(true);
    setHasDownloadedReceipt(false);
    
    // Decrement voucher quota in backend if applied
    if (appliedVoucher && VOUCHER_API_URL) {
      try {
        await fetch(`${VOUCHER_API_URL}?code=${encodeURIComponent(appliedVoucher.kode)}&action=use`);
      } catch (err) {
        console.error("Failed to decrement voucher:", err);
      }
    }

    const orderId = `LIT-${Date.now().toString().slice(-6)}`;
    setCheckoutOrderId(orderId);
    
    // Set tracking details
    const productTitles = cartItems.map(item => item.product.title).join(', ');
    const firstPhysicalItem = cartItems.find(item => !item.product.category.toLowerCase().includes('digital'));
    const sellerAddressVal = firstPhysicalItem ? firstPhysicalItem.product.sellerAddress : '';
    const sellerMapUrlVal = firstPhysicalItem ? firstPhysicalItem.product.sellerMapUrl : '';

    setTrackingOrderId(orderId);
    setTrackingProductTitles(productTitles);
    setTrackingSellerAddress(sellerAddressVal);
    setTrackingSellerMapUrl(sellerMapUrlVal);

    const formattedDate = new Intl.DateTimeFormat('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());

    // Create Temporary Offscreen DOM Element for Receipt
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '480px';
    tempDiv.style.padding = '35px';
    tempDiv.style.background = '#ffffff';
    tempDiv.style.color = '#1e293b';
    tempDiv.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.border = '2px solid #0f766e';
    tempDiv.style.borderRadius = '16px';
    
    // Compile seller addresses to display
    const uniqSellerAddresses = Array.from(new Set(cartItems.map(item => item.product.sellerAddress).filter(Boolean)));
    const sellerAddressHtml = uniqSellerAddresses.length > 0 
      ? uniqSellerAddresses.map(addr => `<span style="display:block;margin-top:2px;">• ${addr}</span>`).join('') 
      : 'Sukabumi Berliterasi';

    // Receipt Header
    let content = `
      <div style="text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #0f766e; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">TOKOLITERA</h2>
        <div style="font-size: 10px; color: #64748b; font-weight: 700; margin-top: 3px; letter-spacing: 0.1em; text-transform: uppercase;">Sukabumi Berliterasi</div>
        <p style="margin: 5px 0 0 0; font-size: 10px; color: #64748b; line-height: 1.4;">
          <strong>Alamat Penjual:</strong><br>${sellerAddressHtml}
        </p>
      </div>
      
      <div style="margin-bottom: 20px; font-size: 11px; color: #475569; line-height: 1.6;">
        <div style="display: flex; justify-content: space-between;">
          <span>No. Pesanan:</span>
          <strong style="color: #0f766e;">#${orderId}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Waktu:</span>
          <span>${formattedDate} WIB</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Nama Penerima:</span>
          <span style="font-weight: 700;">${recipientName}</span>
        </div>
        ${hasPhysicalItems ? `
        <div style="display: flex; justify-content: space-between;">
          <span>Alamat Kirim:</span>
          <span style="max-width: 250px; text-align: right;">${deliveryAddress}</span>
        </div>
        ${addressLandmark ? `
        <div style="display: flex; justify-content: space-between;">
          <span>Patokan:</span>
          <span style="max-width: 250px; text-align: right; font-style: italic;">${addressLandmark}</span>
        </div>` : ''}

        <div style="display: flex; justify-content: space-between;">
          <span>Kurir Pengiriman:</span>
          <span style="font-weight: 700; color: #0f766e;">${deliveryMethod === 'seller_courier' ? 'Kurir Mandiri Penjual' : (selectedShippingService ? selectedShippingService.name : 'Kurir Standar')}</span>
        </div>
        ` : `
        <div style="display: flex; justify-content: space-between;">
          <span>Metode Kirim:</span>
          <span style="color: #0f766e; font-weight: 700;">Email / Digital (Bebas Ongkir)</span>
        </div>
        `}
      </div>

      <h4 style="margin: 0 0 10px 0; color: #0f766e; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px;">Daftar Belanja</h4>
      <div style="margin-bottom: 20px;">
    `;

    // Render items rows
    cartItems.forEach(item => {
      const itemPrice = item.price || item.product.price;
      content += `
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; line-height: 1.4;">
          <div style="max-width: 250px;">
            <div style="font-weight: 700; color: #1e293b;">${item.product.title}${item.variant ? ` (${item.variant})` : ''}</div>
            <div style="font-size: 10px; color: #64748b;">${item.quantity} x ${formatPrice(itemPrice)}</div>
          </div>
          <span style="font-weight: 700; color: #1e293b; align-self: flex-end;">${formatPrice(itemPrice * item.quantity)}</span>
        </div>
      `;
    });

    // Cost Breakdown
    content += `
      </div>
      <h4 style="margin: 0 0 10px 0; color: #0f766e; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px;">Rincian Biaya</h4>
      <div style="font-size: 11px; color: #475569; line-height: 1.6; margin-bottom: 20px; border-bottom: 2px dashed #e2e8f0; padding-bottom: 15px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Subtotal Item:</span>
          <span style="font-weight: 600; color: #1e293b;">${formatPrice(subtotal)}</span>
        </div>
        ${discountAmount > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
          <span>Diskon (${appliedVoucher.kode}):</span>
          <span style="font-weight: 600; color: #059669;">-${formatPrice(discountAmount)}</span>
        </div>` : ''}
        <div style="display: flex; justify-content: space-between;">
          <span>Biaya Admin per Pesanan:</span>
          <span>${formatPrice(adminFee)}</span>
        </div>
        ${hasPhysicalItems ? `
        <div style="display: flex; justify-content: space-between;">
          <span>Jarak Pengiriman:</span>
          <span>${hasGps ? `${shippingDistance} Km` : 'Belum Ditentukan'}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Biaya Ongkir (${deliveryMethod === 'seller_courier' ? 'Tarif Penjual' : (selectedShippingService ? selectedShippingService.name : 'Tarif Standar')}):</span>
          <span>${hasGps ? formatPrice(shippingFee) : 'Akan Dikonfirmasi Admin'}</span>
        </div>
        ` : `
        <div style="display: flex; justify-content: space-between;">
          <span>Ongkos Kirim (Digital):</span>
          <span style="color: #0f766e; font-weight: 700;">Rp 0 (Bebas Ongkir)</span>
        </div>
        `}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f0faf7; padding: 12px 15px; border-radius: 8px; margin-bottom: 20px;">
        <span style="font-size: 12px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.05em;">Total Pembayaran</span>
        <span style="font-size: 18px; font-weight: 900; color: #0f766e;">
          ${hasPhysicalItems && !hasGps 
            ? `${formatPrice(subtotal + adminFee)} + Ongkir` 
            : formatPrice(grandTotal)
          }
        </span>
      </div>

      <div style="text-align: center; font-size: 10px; color: #94a3b8; line-height: 1.5; margin-top: 15px;">
        <div style="font-weight: 700; color: #64748b; margin-bottom: 3px;">Terima kasih telah berliterasi!</div>
        Pembelian Anda berkontribusi langsung mendukung gerakan literasi digital di wilayah Sukabumi.
      </div>
    `;

    tempDiv.innerHTML = content;
    document.body.appendChild(tempDiv);

    try {
      // Capture canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imageUrl = canvas.toDataURL('image/png');
      setReceiptImage(imageUrl);

      // Compile WA Text
      let waText = `Halo Admin Tokolitera,\n\nSaya ingin melakukan pemesanan produk sebagai berikut:\n`;
      cartItems.forEach((item, index) => {
        const itemPrice = item.price || item.product.price;
        waText += `\n*${index + 1}. ${item.product.title}${item.variant ? ` (${item.variant})` : ''}*`;
        waText += `\n   Jumlah: ${item.quantity} x ${formatPrice(itemPrice)} = ${formatPrice(itemPrice * item.quantity)}`;
      });
      
      waText += `\n\n*Informasi Penerima:*`;
      waText += `\n- Nama Penerima: ${recipientName}`;
      if (hasPhysicalItems) {
        waText += `\n- Alamat Lengkap: ${deliveryAddress}`;
        if (addressLandmark) waText += `\n- Patokan Alamat: ${addressLandmark}`;

        waText += `\n- Jasa Kirim: ${deliveryMethod === 'seller_courier' ? 'Kurir Mandiri Penjual' : (selectedShippingService ? selectedShippingService.name + ' (' + selectedShippingService.estimasi + ')' : 'Kurir Standar')}`;
        waText += `\n- Jarak Pengiriman (GPS): ${hasGps ? `${shippingDistance} km` : 'Belum ditentukan (sesuai alamat)'}`;
      } else {
        waText += `\n- Pengiriman: Digital via Email / Chat (Bebas Ongkir)`;
      }

      waText += `\n\n*Rincian Biaya:*`;
      waText += `\n- Subtotal: ${formatPrice(subtotal)}`;
      if (discountAmount > 0) {
        waText += `\n- Diskon (${appliedVoucher.kode}): -${formatPrice(discountAmount)}`;
      }
      waText += `\n- Biaya Admin: ${formatPrice(adminFee)}`;
      waText += `\n- Ongkos Kirim: ${hasGps ? formatPrice(shippingFee) : 'Menunggu konfirmasi Admin (berdasarkan alamat)'}`;
      if (hasPhysicalItems) {
        const totalWeight = physicalItems.reduce((sum, item) => sum + (item.quantity * (item.product.productWeight || 0)), 0);
        if (totalWeight > 0) {
          waText += `\n- Total Berat: ${totalWeight.toFixed(2)} kg`;
        }
      }
      waText += `\n*TOTAL BAYAR: ${hasPhysicalItems && !hasGps ? `${formatPrice(subtotal + adminFee)} + Ongkir` : formatPrice(grandTotal)}*`;
      waText += `\n\n_Catatan Penting: Pemesanan resmi Tokolitera hanya dilayani ke nomor WA 083163140043. Saya melampirkan foto resi resmi (#${orderId}) bersama chat ini._`;

      setCheckoutWaText(waText);

      // Save order to history if user is logged in
      if (currentUser) {
        const newOrder = {
          orderId,
          date: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date()),
          items: cartItems.map(item => ({
            productId: item.product.id,
            title: item.product.title,
            variant: item.variant || '',
            price: item.price || item.product.price,
            quantity: item.quantity,
            imageUrl: item.product.imageUrl || ''
          })),
          subtotal,
          adminFee,
          shippingFee,
          grandTotal,
          deliveryAddress: hasPhysicalItems ? deliveryAddress : 'Pengiriman Digital',
          status: 'Belum Dibayar' // 'Belum Dibayar' (awal), 'Sedang Dikemas', 'Sedang Diantar', 'Selesai'
        };

        const updatedHistory = [newOrder, ...orderHistory];
        setOrderHistory(updatedHistory);
        localStorage.setItem(`tokolitera_orders_${currentUser.username}`, JSON.stringify(updatedHistory));

        // Update global sales counts for real sold counts representation
        // AND reduce local stock (#2)
        try {
          const globalSales = JSON.parse(localStorage.getItem('tokolitera_global_sales') || '{}');
          const localStock = JSON.parse(localStorage.getItem('tokolitera_local_stock') || '{}');
          cartItems.forEach(item => {
            globalSales[item.product.title] = (globalSales[item.product.title] || 0) + item.quantity;
            // Reduce stock locally
            const currentStock = localStock[item.product.title] !== undefined 
              ? localStock[item.product.title] 
              : (item.product.stock || 0);
            localStock[item.product.title] = Math.max(0, currentStock - item.quantity);
          });
          localStorage.setItem('tokolitera_global_sales', JSON.stringify(globalSales));
          localStorage.setItem('tokolitera_local_stock', JSON.stringify(localStock));
        } catch (e) {
          console.error(e);
        }

        // Kirim transaksi awal ke Google Sheets secara asinkron
        const shopsStr = uniqueShopsInCart.join(', ');
        const detailsStr = cartItems.map(item => `${item.product.title}${item.variant ? ` [Varian: ${item.variant}]` : ''} (x${item.quantity})`).join('\n');
        const fullAddressWithLandmark = deliveryAddress + (addressLandmark ? ` (Patokan: ${addressLandmark})` : '');
        
        submitOrderToGoogleSheets(
          orderId,
          currentUser.username,
          recipientName,
          shopsStr,
          detailsStr,
          String(grandTotal),
          hasPhysicalItems ? fullAddressWithLandmark : 'Pengiriman Digital',
          'Belum Dibayar'
        );
        
        // Save order ID for real-time tracking
        setTrackingOrderId(orderId);
        setTrackingProductTitles(cartItems.map(item => `${item.product.title} (x${item.quantity})`).join(', '));
        
        // Find seller info for tracking from first item
        const firstItem = cartItems[0]?.product;
        if (firstItem) {
          setTrackingSellerAddress(firstItem.sellerAddress || '');
          setTrackingSellerMapUrl(firstItem.sellerMapUrl || '');
        }
      }

      // Reset Cart and open confirmation/download dialog
      setCart({});
      setIsCartOpen(false);
      setShowReceiptPreview(true);
    } catch (err) {
      console.error("Gagal mencetak resi: ", err);
      customAlert("Gagal memproses cetak resi belanja digital.");
    } finally {
      document.body.removeChild(tempDiv);
      setGeneratingReceipt(false);
    }
  };

  const handleDownloadReceiptAction = () => {
    if (!receiptImage) return;
    const downloadLink = document.createElement('a');
    downloadLink.download = `Resi-Tokolitera-${checkoutOrderId}.png`;
    downloadLink.href = receiptImage;
    downloadLink.click();
    setHasDownloadedReceipt(true);
  };

  const handleOpenWhatsAppAction = () => {
    if (!hasDownloadedReceipt) return;
    const waUrl = `https://wa.me/6283163140043?text=${encodeURIComponent(checkoutWaText)}`;
    window.open(waUrl, '_blank');
    setShowReceiptPreview(false);
    // Reset recipient states
    setRecipientName('');
    setDeliveryAddress('');
    setAddressLandmark('');
    setSellerNote('');
    setAdminNote('');
    setCourierNote('');
  };

  const localAccountsList = JSON.parse(localStorage.getItem('tokolitera_accounts') || '[]');

  return (
    <>
      <section className={`space-y-6 relative pb-10 ${isHidden ? 'hidden' : ''}`}>
      
              {/* Sticky Header Row with Cart Accumulator at the very top */}
        <div className="flex justify-between items-center gap-2 sticky top-0 z-40 bg-white/75 dark:bg-[#051411]/75 backdrop-blur-md -mx-4 px-4 py-3 border-b border-teal-500/10 dark:border-teal-500/20">
          
          <div className="flex-1 min-w-0 flex items-center">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0 shadow-sm border border-primary/20">
                  {currentUser.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-[#eafaf6] truncate text-sm leading-tight">Halo, {currentUser.fullName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-teal-200/50 truncate leading-tight">Pelanggan Tokolitera</p>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                <h2 className="text-base font-black text-slate-800 dark:text-[#eafaf6] leading-none">Etalase Lokal</h2>
                <span className="text-[9px] text-slate-500 dark:text-teal-200/50 font-bold uppercase tracking-wider">
                  Cari yang Bikin Bangga, Yuk!
                </span>
              </div>
            )}
          </div>
  
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Dark/Light mode toggle */}
            <button 
              onClick={toggleDarkMode}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 dark:bg-teal-950/45 dark:hover:bg-teal-950/65 text-slate-600 dark:text-teal-200/80 rounded-full border-0 cursor-pointer flex items-center justify-center transition-all shadow-sm"
              title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {currentUser ? (
              <>
                <button
                  onClick={() => {
                    setProfileTab('info');
                    setShowProfileModal(true);
                  }}
                  className="w-8 h-8 bg-slate-100 hover:bg-slate-200 dark:bg-teal-950/45 dark:hover:bg-teal-950/65 text-slate-600 dark:text-teal-200/80 rounded-full border-0 cursor-pointer flex items-center justify-center transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('tokolitera_user');
                    setCurrentUser(null);
                    setCart({});
                    customAlert("Berhasil keluar akun.");
                  }}
                  className="w-8 h-8 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 rounded-full border-0 cursor-pointer flex items-center justify-center transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full flex items-center justify-center border-0 cursor-pointer transition-colors shadow-sm text-[11px] font-bold gap-1"
                title="Masuk / Daftar"
              >
                <span className="material-symbols-outlined text-[14px]">login</span>
                Masuk
              </button>
            )}

            {totalItems > 0 && (
              <button
                onClick={() => {
                  setBuyNowPrevProduct(null);
                  setIsCartOpen(true);
                }}
                className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 border-0 cursor-pointer shadow-md text-[11px] font-black animate-pulse ml-1"
              >
                <span className="material-symbols-outlined text-[14px] font-fill">shopping_cart</span>
                {totalItems}
              </button>
            )}
          </div>
        </div>

      {/* Banner Iklan dari Spreadsheet */}
      {bannerAds.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-teal-500/10 dark:border-teal-500/20">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeBannerIndex * 100}%)` }}
          >
            {bannerAds.map((banner, idx) => {
              const driveThumbnail = getDrivePdfThumbnail(banner.link);
              return (
                <a
                  key={idx}
                  href={banner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-full block shrink-0 no-underline"
                >
                  {driveThumbnail ? (
                    <div className="w-full h-40 sm:h-52 relative overflow-hidden bg-slate-50/60 dark:bg-zinc-900/60 flex items-center justify-center">
                      <img 
                        src={driveThumbnail} 
                        alt="Promo Banner PDF" 
                        className="h-full w-auto object-contain mx-auto"
                        onError={(e) => {
                          // Fallback to text visual if image fails to load
                          e.target.style.display = 'none';
                        }}
                      />
                      {/* Floating Badge */}
                      <div className="absolute top-2 right-2 bg-rose-600/90 text-white text-[8px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-[10px]">ads_click</span>
                        <span>Klik Informasi Selengkapnya</span>
                      </div>
                    </div>
                  ) : (
                    <div className="min-w-full flex items-center gap-3 p-3.5 group bg-gradient-to-r from-primary/5 via-teal-500/5 to-emerald-500/5 dark:from-primary/10 dark:via-teal-500/10 dark:to-emerald-500/10">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary text-xl font-fill">picture_as_pdf</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-[#eafaf6] leading-tight truncate">
                          📢 Info & Promo Terbaru
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-teal-200/60 mt-0.5">
                          Ketuk untuk melihat detail PDF →
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-primary/50 text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </div>
                  )}
                </a>
              );
            })}
          </div>
          {bannerAds.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {bannerAds.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveBannerIndex(idx); }}
                  className={`w-1.5 h-1.5 rounded-full border-0 cursor-pointer transition-all ${idx === activeBannerIndex ? 'bg-[#4edea3] w-3.5' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Bar & Category Filter */}
      <div className="space-y-3">
        <div className="relative w-full">
          <input
            className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-full px-6 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 w-full text-slate-800 dark:text-[#eafaf6] text-sm"
            placeholder="Cari produk..."
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="material-symbols-outlined absolute right-4 top-2.5 text-on-surface-variant dark:text-on-surface-variant opacity-50">
            search
          </span>
        </div>

        {/* Categories Tabs */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white/40 dark:bg-black/25 text-slate-600 dark:text-teal-200/70 border border-teal-500/5 hover:bg-white/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid - Vertical Cards (Title below image, Full title displayed) */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-panel p-4 rounded-2xl md:rounded-3xl h-44 shimmer"></div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 opacity-60">
          <span className="material-symbols-outlined text-5xl">storefront</span>
          <p className="mt-2 text-sm font-semibold">Produk tidak ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:gap-5">
          {filteredProducts.map(p => (
            <div 
              key={p.id}
              onClick={() => handleOpenDetail(p)}
              className="glass-panel p-3 md:p-4 rounded-2xl md:rounded-3xl border border-teal-500/10 dark:border-teal-500/20 bg-white/20 dark:bg-black/15 flex flex-col justify-between gap-3 hover:scale-[1.01] hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <div className="flex flex-col gap-2 relative">
                {/* Wishlist Like Heart Button */}
                <button
                  onClick={(e) => handleToggleLikeProduct(p.id, e)}
                  className="absolute top-1.5 right-1.5 z-10 p-1 bg-white/80 dark:bg-black/60 hover:scale-110 rounded-full border-0 cursor-pointer flex items-center justify-center shadow-sm transition-all"
                >
                  <span className={`material-symbols-outlined text-xs md:text-sm ${
                    likedProductIds.includes(p.id) ? 'text-rose-500 font-fill' : 'text-slate-400'
                  }`}>
                    favorite
                  </span>
                </button>
                {/* Product Image or Icon - Aspect Square */}
                {p.imageUrl ? (
                  <img 
                    src={p.imageUrl} 
                    alt={p.title} 
                    className="aspect-square w-full rounded-xl md:rounded-2xl object-cover border border-teal-500/10 bg-white" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className={`aspect-square w-full rounded-xl md:rounded-2xl bg-gradient-to-br ${p.bgGradient} border border-teal-500/10 flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-3xl md:text-4xl text-teal-800 dark:text-teal-200">
                      {p.imageIcon}
                    </span>
                  </div>
                )}

                {/* Details under the image */}
                <div className="space-y-1.5 min-w-0">
                  {/* Label above product title */}
                  {p.label && (() => {
                    const firstLabel = p.label.split(',').map(l => l.trim()).filter(Boolean)[0];
                    return firstLabel ? (
                      <span 
                        className={`inline-block px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-wider ${getLabelStyles(firstLabel)}`}
                      >
                        {firstLabel}
                      </span>
                    ) : null;
                  })()}
                  <h4 className="font-extrabold text-xs md:text-sm text-slate-800 dark:text-[#eafaf6] leading-snug break-words">
                    {p.title}
                  </h4>
                  
                  {/* Rating & Sold Stats */}
                  {(() => {
                    const productReviews = localReviews.filter(r => r.productTitle === p.title);
                    const hasReviews = productReviews.length > 0;
                    const avgStars = hasReviews
                      ? (productReviews.reduce((sum, r) => sum + r.stars, 0) / productReviews.length).toFixed(1)
                      : null;
                    
                    let displaySold = 0;
                    try {
                      const globalSales = JSON.parse(localStorage.getItem('tokolitera_global_sales') || '{}');
                      displaySold = globalSales[p.title] || 0;
                    } catch (e) {}

                    return (
                      <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-bold text-slate-500 dark:text-teal-200/40">
                        {hasReviews && (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <span className="material-symbols-outlined text-[10px] font-fill">star</span>
                            {avgStars}
                          </span>
                        )}
                        {hasReviews && <span className="opacity-40">|</span>}
                        {displaySold > 0 ? (
                          <span>Terjual {displaySold}</span>
                        ) : (
                          <span className="opacity-60">Terjual 0</span>
                        )}
                        {p.productWeight > 0 && (
                          <>
                            <span className="opacity-40">|</span>
                            <span className="flex items-center gap-0.5" title={`Berat: ${p.productWeight} kg`}>
                              <span className="material-symbols-outlined text-[10px]">scale</span>
                              {p.productWeight} kg
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
 
              {/* Price Row (Struck-through if promo exists) */}
              <div className="pt-2 border-t border-dashed border-teal-500/10 flex justify-between items-center mt-auto">
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] text-slate-400 dark:text-teal-200/40 font-bold uppercase tracking-wider leading-none">Harga</span>
                  <div className="flex items-baseline gap-1 flex-wrap mt-0.5">
                    {p.originalPrice > p.price && (
                      <span className="text-[9px] md:text-xs text-slate-400 dark:text-teal-200/30 line-through leading-none">
                        {formatPrice(p.originalPrice)}
                      </span>
                    )}
                    <span className="text-xs md:text-sm font-black text-slate-800 dark:text-[#4edea3] leading-none">
                      {formatPrice(p.price)}
                    </span>
                  </div>
                </div>
                
                {/* Arrow detail indicator */}
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary dark:text-[#4edea3] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-[#051411] border border-teal-500/20 w-full max-w-[460px] rounded-t-[2.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300 relative">
            
            {/* Close Button Top Right (Overlay) */}
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all border-0 cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Scrollable Container (Image + Details) */}
            <div className="flex-1 overflow-y-auto pb-4 scrollbar-none">
              
              {/* Product Image Carousel */}
              <div className="relative h-[360px] bg-slate-950/90 dark:bg-black/60 flex items-center justify-center overflow-hidden">
                {selectedProduct.images.length > 0 ? (
                  <>
                    <img 
                      src={selectedProduct.images[activeImageIndex]} 
                      alt={selectedProduct.title}
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Left & Right Navigation Arrows */}
                    {selectedProduct.images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          className="absolute left-3 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all border-0 cursor-pointer flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          className="absolute right-3 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all border-0 cursor-pointer flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                      </>
                    )}

                    {/* Indicator Dots */}
                    {selectedProduct.images.length > 1 && (
                      <div className="absolute bottom-4 flex gap-1.5 z-20">
                        {selectedProduct.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
                            className={`w-2 h-2 rounded-full border-0 transition-all cursor-pointer ${
                              activeImageIndex === idx ? 'bg-primary w-4' : 'bg-white/60'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${selectedProduct.bgGradient} flex flex-col items-center justify-center gap-2`}>
                    <span className="material-symbols-outlined text-6xl text-teal-800 dark:text-teal-200">
                      {selectedProduct.imageIcon}
                    </span>
                    <span className="text-xs text-teal-800/60 dark:text-teal-200/60 font-bold uppercase tracking-wider">Tidak ada gambar</span>
                  </div>
                )}
              </div>

              {/* details content */}
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="bg-primary/10 text-primary dark:text-[#4edea3] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
                      {selectedProduct.category}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-teal-200/60 font-bold">
                      <span className="material-symbols-outlined text-xs">inventory_2</span>
                      <span>Stok: <strong className="text-slate-800 dark:text-[#eafaf6]">{displayStock > 0 ? `${displayStock} unit` : 'Habis'}</strong></span>
                    </div>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-[#eafaf6] leading-snug flex-1">
                      {selectedProduct.title}
                    </h3>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={(e) => handleShareProduct(selectedProduct, e)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-teal-950/40 dark:hover:bg-teal-950/60 rounded-full border-0 cursor-pointer flex items-center justify-center shadow-sm transition-all"
                        title="Bagikan Produk"
                      >
                        <span className="material-symbols-outlined text-lg text-emerald-500">share</span>
                      </button>
                      <button
                        onClick={(e) => handleToggleLikeProduct(selectedProduct.id, e)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-teal-950/40 dark:hover:bg-teal-950/60 rounded-full border-0 cursor-pointer flex items-center justify-center shadow-sm transition-all"
                      >
                        <span className={`material-symbols-outlined text-lg transition-all ${
                          likedProductIds.includes(selectedProduct.id) ? 'text-rose-500 font-fill scale-110' : 'text-slate-400'
                        }`}>
                          favorite
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] font-bold text-slate-500 dark:text-teal-200/50">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">store</span>
                      <span>Toko: <strong className="text-slate-800 dark:text-[#eafaf6]">{selectedProduct.shopName}</strong></span>
                    </span>
                    {selectedProduct.productWeight > 0 && (
                      <span className="flex items-center gap-1 text-slate-500 dark:text-teal-200/55">
                        <span className="material-symbols-outlined text-[12px]">weight</span>
                        <span>Berat: <strong>{selectedProduct.productWeight} kg</strong></span>
                      </span>
                    )}
                    {selectedProduct.shippingPrep && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        <span>Kemas: <strong>{selectedProduct.shippingPrep}</strong></span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 pt-1.5">
                    {displayOriginalPrice > displayPrice && (
                      <span className="text-sm text-slate-400 dark:text-teal-200/30 line-through">
                        {formatPrice(displayOriginalPrice)}
                      </span>
                    )}
                    <span className="text-lg font-black text-primary dark:text-[#4edea3]">
                      {formatPrice(displayPrice)}
                    </span>
                  </div>
                </div>

                {/* Variant Selection Selector */}
                {selectedProduct.variantList && selectedProduct.variantList.length > 0 && (
                  <div className="border-t border-teal-500/10 pt-4 space-y-2">
                    <h4 className="text-xs font-black text-slate-400 dark:text-teal-200/40 uppercase tracking-widest font-extrabold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">format_list_bulleted</span>
                      Pilihan Varian
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.variantList.map(variant => (
                        <button
                          key={variant}
                          type="button"
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all border-0 cursor-pointer ${
                            selectedVariant === variant
                              ? 'bg-primary text-white border-primary shadow-sm scale-[1.03]'
                              : 'bg-slate-50 dark:bg-black/20 text-slate-700 dark:text-teal-200/70 border-teal-500/10 hover:border-teal-500/30'
                          }`}
                        >
                          {variant}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="border-t border-teal-500/10 pt-4 flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-400 dark:text-teal-200/40 uppercase tracking-widest font-extrabold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">shopping_basket</span>
                    Jumlah Pembelian
                  </h4>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/20 border border-teal-500/10 px-2.5 py-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setModalQty(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 flex items-center justify-center bg-slate-200 dark:bg-teal-950/80 text-slate-700 dark:text-teal-200 rounded-lg border-0 cursor-pointer text-xs font-black"
                    >
                      -
                    </button>
                    <span className="text-xs font-black text-slate-800 dark:text-[#eafaf6] min-w-[20px] text-center">{modalQty}</span>
                    <button
                      type="button"
                      onClick={() => setModalQty(prev => {
                        const maxStock = displayStock > 0 ? displayStock : 1;
                        return Math.min(maxStock, prev + 1);
                      })}
                      className="w-7 h-7 flex items-center justify-center bg-slate-200 dark:bg-teal-950/80 text-slate-700 dark:text-teal-200 rounded-lg border-0 cursor-pointer text-xs font-black"
                    >
                      +
                    </button>
                  </div>
                </div>

                {selectedProduct.youtubeUrl && (
                  <div className="border-t border-teal-500/10 pt-4 space-y-2">
                    <h4 className="text-xs font-black text-slate-400 dark:text-teal-200/40 uppercase tracking-widest">Video Demo (YouTube)</h4>
                    {getYouTubeEmbedUrl(selectedProduct.youtubeUrl) ? (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden border border-teal-500/15">
                        <iframe
                          src={getYouTubeEmbedUrl(selectedProduct.youtubeUrl)}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      </div>
                    ) : (
                      <a 
                        href={selectedProduct.youtubeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl border border-red-500/20 transition-all font-black text-xs"
                      >
                        <span className="material-symbols-outlined">play_circle</span>
                        Tonton Video di YouTube
                      </a>
                    )}
                  </div>
                )}

                {selectedProduct.sellerAddress && (
                  <div className="border-t border-teal-500/10 pt-4 space-y-2">
                    <h4 className="text-xs font-black text-slate-400 dark:text-teal-200/40 uppercase tracking-widest font-extrabold">Informasi Penjual</h4>
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-teal-200/80 leading-relaxed font-semibold">
                      <p className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary dark:text-[#4edea3] shrink-0 mt-0.5">location_on</span>
                        <span>{selectedProduct.sellerAddress}</span>
                      </p>
                      {selectedProduct.sellerMapUrl && (
                        <a 
                          href={selectedProduct.sellerMapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary dark:text-[#4edea3] hover:underline font-bold text-[11px] ml-5"
                        >
                          <span className="material-symbols-outlined text-[12px]">map</span> Buka Peta Penjual
                        </a>
                      )}
                      {/* Shipping rate hidden in catalog details per request */}
                    </div>
                  </div>
                )}

                <div className="border-t border-teal-500/10 pt-4 space-y-2">
                  <h4 className="text-xs font-black text-slate-400 dark:text-teal-200/40 uppercase tracking-widest">Deskripsi Produk</h4>
                  <p className="text-sm text-slate-600 dark:text-teal-200/80 leading-relaxed whitespace-pre-line">
                    {selectedProduct.desc || "Tidak ada deskripsi lengkap untuk produk ini."}
                  </p>
                </div>

                {/* Ulasan khusus produk ini */}
                <div className="border-t border-teal-500/10 pt-4 space-y-3">
                  <h4 className="text-xs font-black text-slate-400 dark:text-teal-200/40 uppercase tracking-widest font-extrabold">Ulasan Produk ({localReviews.filter(r => r.productTitle === selectedProduct.title).length})</h4>
                  {localReviews.filter(r => r.productTitle === selectedProduct.title).length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-none">
                      {localReviews.filter(r => r.productTitle === selectedProduct.title).map(r => (
                        <div key={r.id} className="p-2.5 bg-slate-50 dark:bg-black/25 border border-teal-500/5 rounded-xl space-y-1">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-800 dark:text-[#eafaf6]">{r.name}</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={`material-symbols-outlined text-[10px] ${
                                  i < r.stars ? 'text-amber-400 font-fill' : 'text-slate-300'
                                }`}>
                                  star
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-teal-200/70 italic leading-snug">
                            "{r.comment}"
                          </p>
                          {r.photo && (
                            <img src={r.photo} alt="Foto ulasan" className="w-20 h-20 object-cover rounded-lg border border-teal-500/10 mt-1" />
                          )}
                          {r.date && (
                            <p className="text-[8px] text-slate-400 dark:text-teal-200/30 mt-0.5">{r.date}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">Belum ada ulasan untuk produk ini.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Action Buttons */}
            <div className="flex gap-2 p-4 bg-white/50 dark:bg-black/20 border-t border-teal-500/10 z-10">
              {/* Button 1: Tanya Admin (WhatsApp Chat) */}
              <a 
                href={`https://wa.me/6283163140043?text=Halo%20Admin%20Tokolitera%2C%20saya%20tertarik%20dan%20ingin%20tanya%20tentang%20produk%20*${encodeURIComponent(selectedProduct.title)}*${selectedVariant ? `%20(Varian%3A%20${encodeURIComponent(selectedVariant)})` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-11 shrink-0 text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center gap-0.5 border-0 cursor-pointer no-underline transition-all hover:scale-[1.01]"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
              </a>
              
              {/* Button 2: Tambah ke Keranjang */}
              {displayStock <= 0 ? (
                <div className="flex-[3] py-3 text-xs font-black text-rose-500 bg-rose-500/10 rounded-2xl flex items-center justify-center gap-1 opacity-80">
                  <span className="material-symbols-outlined text-sm">inventory</span>
                  Stok Habis — Tidak Dapat Membeli
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      const success = handleAddToCartSecure(selectedProduct, selectedVariant, modalQty);
                      if (success) {
                        customAlert(`Berhasil menambahkan ${modalQty}x ${selectedProduct.title}${selectedVariant ? ` (${selectedVariant})` : ''} ke keranjang belanja!`);
                      }
                    }}
                    className="w-12 h-11 shrink-0 text-[10px] md:text-xs font-black text-white bg-primary hover:bg-primary-hover rounded-2xl flex items-center justify-center gap-0.5 transition-all border-0 cursor-pointer shadow-sm hover:scale-[1.01]"
                  >
                    <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                  </button>

                  {/* Button 3: Pesan Sekarang (Buy Now / Checkout) */}
                  <button 
                    onClick={() => handleBuyNow(selectedProduct, selectedVariant, modalQty)}
                    className="flex-1 py-3 h-11 text-[10px] md:text-xs font-black text-slate-900 bg-[#4edea3] hover:bg-[#3ec48e] rounded-2xl flex items-center justify-center gap-0.5 transition-all border-0 cursor-pointer shadow-md hover:scale-[1.01]"
                  >
                    <span className="material-symbols-outlined text-xs md:text-sm font-fill">bolt</span>
                    Pesan Sekarang
              </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Shopping Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-[#051411] border border-teal-500/20 w-full max-w-[460px] rounded-t-[2.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
            
            {/* Header */}
            <div className="p-5 border-b border-teal-500/10 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary dark:text-[#4edea3]">shopping_cart</span>
                <h3 className="text-base font-black text-slate-800 dark:text-[#eafaf6]">Keranjang Belanja</h3>
              </div>
              <button 
                onClick={() => {
                  setIsCartOpen(false);
                  if (buyNowPrevProduct) {
                    setSelectedProduct(buyNowPrevProduct.product);
                    setSelectedVariant(buyNowPrevProduct.variant);
                    setModalQty(buyNowPrevProduct.qty);
                    setBuyNowPrevProduct(null);
                  }
                }}
                className="p-1 hover:bg-slate-200 dark:hover:bg-teal-950/60 rounded-full border-0 cursor-pointer flex items-center justify-center text-slate-400 dark:text-teal-200/50"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Scrollable Cart Items & Options */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-none">
              
              {/* Item List */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-teal-200/30 uppercase tracking-widest">Item Pesanan</h4>
                {Object.entries(groupedCartItems).map(([shopName, items]) => (
                  <div key={shopName} className="space-y-2">
                    {/* Shop Header */}
                    <div className="flex items-center gap-1.5 px-1 py-0.5 border-b border-teal-500/10 text-[10px] font-black text-primary dark:text-[#4edea3] uppercase tracking-wider">
                      <span className="material-symbols-outlined text-xs">store</span>
                      {shopName}
                    </div>
                    
                    {items.map(item => {
                      const itemKey = item.product.id + (item.variant ? `-${item.variant}` : '');
                      return (
                        <div key={itemKey} className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-black/10 rounded-2xl border border-teal-500/5">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {item.product.imageUrl ? (
                              <img 
                                src={item.product.imageUrl} 
                                alt={item.product.title} 
                                className="w-12 h-12 rounded-xl object-cover shrink-0 bg-white" 
                              />
                            ) : (
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.product.bgGradient} flex items-center justify-center shrink-0`}>
                                <span className="material-symbols-outlined text-xl text-teal-800 dark:text-teal-200">
                                  {item.product.imageIcon}
                                </span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-extrabold text-xs text-slate-800 dark:text-[#eafaf6] truncate">{item.product.title}</div>
                              {item.variant && (
                                <div className="text-[10px] text-slate-500 dark:text-teal-200/50 font-bold">Varian: {item.variant}</div>
                              )}
                              {item.product.productWeight > 0 && (
                                <div className="text-[10px] text-slate-500 dark:text-teal-200/50 font-bold">Berat: {item.product.productWeight} kg</div>
                              )}
                              <div className="text-[11px] font-black text-primary dark:text-[#4edea3] mt-0.5">{formatPrice(item.price || item.product.price)}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-white dark:bg-black/20 border border-teal-500/10 px-1.5 py-0.5 rounded-lg">
                              <button
                                onClick={() => updateQuantity(itemKey, -1)}
                                className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-teal-950 text-slate-600 dark:text-teal-200/80 rounded border-0 cursor-pointer text-[10px] font-black"
                              >
                                -
                              </button>
                              <span className="text-[10px] font-black text-slate-800 dark:text-[#eafaf6] min-w-[14px] text-center">{item.quantity}</span>
                              <button
                                onClick={() => addToCart(item.product, item.variant)}
                                className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-teal-950 text-slate-600 dark:text-teal-200/80 rounded border-0 cursor-pointer text-[10px] font-black"
                              >
                                +
                              </button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(itemKey)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg border-0 cursor-pointer flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>



              {/* Recipient Information Form Fields */}
              <div className="border-t border-teal-500/10 pt-4 space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-teal-200/30 uppercase tracking-widest">Informasi Pengiriman</h4>
                
                <div className="space-y-3">
                  {/* Dari Toko (Moved here per request) */}
                  {hasPhysicalItems && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 border border-teal-500/10">
                      <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Dikirim Dari Toko</p>
                      <p className="text-[11px] text-slate-700 dark:text-teal-100/90 font-semibold leading-snug">
                        {sellerDisplayAddress || (cartItems.find(item => !item.product.category.toLowerCase().includes('digital'))?.product.shopName) || 'Toko Tokolitera'}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Nama Penerima *</label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={recipientName}
                          readOnly
                          placeholder="Nama penerima..."
                          className="bg-slate-100/80 dark:bg-black/25 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2 w-full text-slate-700 dark:text-teal-100/80 text-xs cursor-not-allowed opacity-80 focus:outline-none"
                        />
                        <span className="absolute top-2 right-2 material-symbols-outlined text-[14px] text-slate-400 dark:text-teal-200/30">lock</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">No. WhatsApp *</label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={recipientPhone}
                          readOnly
                          placeholder="No. WhatsApp..."
                          className="bg-slate-100/80 dark:bg-black/25 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2 w-full text-slate-700 dark:text-teal-100/80 text-xs cursor-not-allowed opacity-80 focus:outline-none"
                        />
                        <span className="absolute top-2 right-2 material-symbols-outlined text-[14px] text-slate-400 dark:text-teal-200/30">lock</span>
                      </div>
                    </div>
                  </div>

                  {hasPhysicalItems ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider flex items-center gap-1">
                          Alamat Lengkap Pengiriman *
                          <span className="material-symbols-outlined text-[10px] text-amber-500">lock</span>
                        </label>
                        <div className="space-y-2">
                          {savedAddresses.length > 1 ? (
                            <select
                              value={selectedAddressIdx}
                              onChange={(e) => setSelectedAddressIdx(Number(e.target.value))}
                              className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                            >
                              {savedAddresses.map((addr, idx) => (
                                <option key={idx} value={idx}>
                                  {addr.label || `Alamat ${idx + 1}`}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="bg-slate-100/80 dark:bg-black/25 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2 w-full text-slate-700 dark:text-teal-100/80 text-xs font-bold">
                              {savedAddresses[0]?.label || 'Alamat Utama'}
                            </div>
                          )}
                          <div className="relative">
                            <textarea 
                              value={deliveryAddress}
                              readOnly
                              rows="2"
                              className="bg-slate-100/80 dark:bg-black/25 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2 w-full text-slate-700 dark:text-teal-100/80 text-xs resize-none cursor-not-allowed opacity-80"
                            />
                            <span className="absolute top-2 right-2 material-symbols-outlined text-[14px] text-slate-400 dark:text-teal-200/30">lock</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 p-2 bg-amber-500/8 rounded-lg border border-amber-500/15">
                          <span className="material-symbols-outlined text-[11px] text-amber-500 shrink-0 mt-0.5">info</span>
                          <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold leading-normal">
                            Silakan pilih alamat pengiriman Anda. Untuk menambah alamat baru (maks. 3) atau mengubahnya, silakan perbarui di <strong>menu Profil</strong>.
                          </p>
                        </div>
                      </div>


                      {/* GPS distance & route section (only for physical delivery) */}
                      <div className="bg-slate-50/50 dark:bg-black/10 p-3 rounded-2xl border border-teal-500/5 space-y-3">
                        
                        {/* Google Maps Embed - Route from Seller to Buyer */}
                        {hasGps && sellerCoords && buyerCoords && !gpsLoading && (
                          <div className="rounded-xl overflow-hidden border border-teal-500/10 shadow-sm">
                            <iframe
                              src={`https://maps.google.com/maps?saddr=${sellerCoords.lat},${sellerCoords.lng}&daddr=${buyerCoords.lat},${buyerCoords.lng}&output=embed`}
                              width="100%"
                              height="220"
                              style={{ border: 0 }}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Rute Pengiriman"
                            />
                          </div>
                        )}

                        {/* Route Info Display (like LeafiQ) */}
                        {hasGps && sellerCoords && buyerCoords && !gpsLoading && (
                          <div className="space-y-2">

                            {/* Ke Alamat Pembeli */}
                            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-2.5 border border-teal-500/5">
                              <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">Ke Alamat Pembeli</p>
                              <p className="text-[10px] text-slate-700 dark:text-teal-100/90 font-semibold leading-snug">
                                {deliveryAddress}
                              </p>
                            </div>
                            {/* Hasil Rute */}
                            <div className="bg-emerald-500/5 dark:bg-emerald-900/20 rounded-xl p-2.5 border border-emerald-500/15">
                              <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Hasil Rute</p>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">route</span>
                                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">{shippingDistance < 1 ? '< 1' : shippingDistance} km</span>
                                </div>
                                {routeDuration && (
                                  <div className="flex items-center gap-1 text-slate-500 dark:text-teal-200/50">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                    <span className="text-xs font-bold">~{routeDuration} menit</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Distance header - shown when no route info yet */}
                        {(!hasGps || !sellerCoords || !buyerCoords || gpsLoading) && (
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Jarak Pengiriman</span>
                            <span className="text-xs font-black text-primary dark:text-[#4edea3] bg-primary/10 px-2 py-0.5 rounded-md">
                              {gpsLoading ? 'Mengukur...' : `${shippingDistance < 1 ? '< 1' : shippingDistance} Km`}
                            </span>
                          </div>
                        )}

                        {/* GPS Source indicator */}
                        {hasGps && !gpsLoading && gpsSource && (
                          <div className={`text-[9px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg w-fit ${
                            gpsSource === 'browser' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                              : gpsSource === 'googlemaps'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : gpsSource === 'osrm'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            <span className="material-symbols-outlined text-[10px]">
                              {gpsSource === 'browser' ? 'my_location' : gpsSource === 'googlemaps' ? 'location_on' : gpsSource === 'osrm' ? 'route' : 'map'}
                            </span>
                            {gpsSource === 'googlemaps' ? 'Via Google Maps Profil (Akurat)'  
                              : gpsSource === 'osrm' ? 'Via Rute Jalan (OSRM)' 
                              : 'Via Estimasi Alamat'}
                          </div>
                        )}

                        {gpsLoading && (
                          <div className="text-[9px] text-teal-600 dark:text-teal-400 font-semibold animate-pulse flex items-center gap-1 justify-center py-2 bg-white/40 dark:bg-black/20 rounded-lg border border-teal-500/5">
                            <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                            Menghitung rute pengiriman...
                          </div>
                        )}

                        {/* Auto from Google Maps URL */}
                        {(savedAddresses[selectedAddressIdx]?.mapsUrl || profileGoogleMapsUrl) && (
                          <button
                            onClick={async () => {
                              const currentMapsUrl = savedAddresses[selectedAddressIdx]?.mapsUrl || profileGoogleMapsUrl;
                              const coords = extractCoordsFromGoogleMapsUrl(currentMapsUrl);
                              if (coords && isReasonableCoordinate(coords.lat, coords.lng)) {
                                setGpsLoading(true);
                                // Get seller coords
                                const firstPhysical = cartItems.find(item => !item.product.category.toLowerCase().includes('digital'));
                                let sLat = -6.9142, sLng = 106.9388;
                                if (firstPhysical) {
                                  const sCoords = extractCoordsFromGoogleMapsUrl(firstPhysical.product.sellerMapUrl || '');
                                  if (sCoords) { sLat = sCoords.lat; sLng = sCoords.lng; }
                                  setSellerDisplayAddress(firstPhysical.product.sellerAddress || firstPhysical.product.shopName || 'Toko');
                                }
                                setSellerCoords({ lat: sLat, lng: sLng });
                                setBuyerCoords({ lat: coords.lat, lng: coords.lng });

                                // Try OSRM
                                const route = await getRouteDistance(sLat, sLng, coords.lat, coords.lng);
                                if (route) {
                                  setShippingDistance(Math.max(1, parseFloat(route.distance.toFixed(1))));
                                  setRouteDuration(route.duration);
                                } else {
                                  const distance = calculateDistance(coords.lat, coords.lng, sLat, sLng);
                                  setShippingDistance(Math.max(1, parseFloat(distance.toFixed(2))));
                                  setRouteDuration(null);
                                }
                                setHasGps(true);
                                setGpsSource('googlemaps');
                                setGpsError('');
                                setGpsLoading(false);
                              } else {
                                setGpsError('Tidak bisa membaca koordinat dari link Google Maps Anda. Silakan perbarui link di Profil atau Buku Alamat.');
                              }
                            }}
                            className="w-full flex items-center justify-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-emerald-500/20 cursor-pointer transition-all"
                          >
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            Hitung Jarak dari Titik Google Maps Alamat Ini
                          </button>
                        )}
                        


                        {/* Open route in Google Maps */}
                        {hasGps && sellerCoords && buyerCoords && (
                          <a 
                            href={`https://www.google.com/maps/dir/${sellerCoords.lat},${sellerCoords.lng}/${buyerCoords.lat},${buyerCoords.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 text-[9px] font-bold text-primary dark:text-[#4edea3] hover:underline"
                          >
                            <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                            Buka Rute Lengkap di Google Maps
                          </a>
                        )}

                        {gpsError && (
                          <p className="text-[9px] text-rose-500 font-semibold">{gpsError}</p>
                        )}
                      </div>

                      {/* Crucial location notice warning */}
                      <div className="flex gap-1.5 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-600 dark:text-amber-400">
                        <span className="material-symbols-outlined text-sm shrink-0">warning</span>
                        <p className="text-[9px] font-extrabold leading-normal">
                          Harap pembeli menentukan titik pengirimannya dengan cermat karena kami akan mengantar sesuai titik.
                        </p>
                      </div>

                      {/* Opsi Jasa Kirim - placed after GPS section */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-teal-200/30 uppercase tracking-widest">Opsi Jasa Kirim</h4>
                        
                        {deliveryAddress.trim() !== '' ? (
                          <div className="space-y-2">
                            <div className="relative">
                              <select
                                value={deliveryMethod}
                                onChange={(e) => setDeliveryMethod(e.target.value)}
                                className="w-full appearance-none bg-white/60 dark:bg-black/35 border border-teal-500/20 text-slate-700 dark:text-[#eafaf6] text-xs font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-primary shadow-sm"
                              >
                                <option value="" disabled>Pilih Jasa Kirim</option>
                                {parsedShippingServices.map(service => (
                                  <option key={service.id} value={service.id} disabled={!service.aktif}>
                                    {service.name} {service.aktif ? `- ${formatPrice(service.tarifPerKm)}/km` : '(Segera Hadir)'}
                                  </option>
                                ))}
                                {maxSellerRate > 0 && (
                                  <option value="seller_courier">Kurir Mandiri Penjual - {formatPrice(maxSellerRate)}/km</option>
                                )}
                              </select>
                              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
                                expand_more
                              </span>
                            </div>
                            
                            {parsedShippingServices.length === 0 && maxSellerRate === 0 && (
                              <p className="text-[10px] text-slate-400 italic text-center py-2">Belum ada jasa kirim tersedia. Hubungi Admin.</p>
                            )}
                            
                            {/* Selected Info Display */}
                            {deliveryMethod && (
                              <div className="text-[10px] bg-primary/5 dark:bg-primary/10 text-primary dark:text-[#4edea3] p-2.5 rounded-xl border border-primary/10 font-semibold leading-relaxed flex items-start gap-2">
                                <span className="material-symbols-outlined text-sm shrink-0">info</span>
                                <div>
                                  {deliveryMethod === 'seller_courier' ? (
                                    <>Diantar langsung oleh kurir dari pihak penjual.<br/>Kalkulasi tarif: <strong className="font-black">{formatPrice(maxSellerRate)} per Kilometer</strong>.</>
                                  ) : (
                                    <>
                                      {parsedShippingServices.find(s => s.id === deliveryMethod)?.type} • Estimasi pengiriman: <strong className="font-black">{parsedShippingServices.find(s => s.id === deliveryMethod)?.estimasi}</strong>.<br/>
                                      Kalkulasi tarif dasar: <strong className="font-black">{formatPrice(parsedShippingServices.find(s => s.id === deliveryMethod)?.tarifPerKm)} per Kilometer</strong>.
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-slate-50 dark:bg-black/10 p-4 rounded-2xl border border-dashed border-teal-500/10 text-center text-[10px] text-slate-500 dark:text-teal-200/40">
                            <span className="material-symbols-outlined text-xl mb-1 text-slate-400">local_shipping</span>
                            <p className="font-bold">Masukkan alamat lengkap pengiriman untuk memilih kurir.</p>
                          </div>
                        )}


                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2 p-3 bg-teal-500/10 rounded-xl border border-teal-500/20 text-teal-700 dark:text-teal-400">
                      <span className="material-symbols-outlined text-sm shrink-0">info</span>
                      <p className="text-[10px] font-bold leading-normal">
                        Pesanan Anda hanya berisi produk digital. Pengiriman akan dilakukan secara instan melalui Email / Chat WA (Bebas Ongkir).
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Voucher Section */}
              <div className="border-t border-teal-500/10 pt-4 space-y-2.5">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-teal-200/30 uppercase tracking-widest flex items-center justify-between">
                  <span>Voucher Diskon</span>
                  {appliedVoucher && (
                    <button 
                      onClick={() => { setAppliedVoucher(null); setVoucherCode(''); setVoucherError(''); }}
                      className="text-rose-500 hover:text-rose-600 capitalize flex items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[10px]">close</span> Hapus
                    </button>
                  )}
                </h4>
                
                {!appliedVoucher ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Masukkan Kode Voucher"
                        className="flex-1 bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary uppercase tracking-wider font-bold"
                      />
                      <button
                        onClick={handleCheckVoucher}
                        disabled={checkingVoucher || !voucherCode.trim()}
                        className="bg-slate-800 dark:bg-teal-500/20 text-white dark:text-teal-400 font-bold text-xs px-4 rounded-xl hover:bg-slate-700 dark:hover:bg-teal-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {checkingVoucher ? 'Cek...' : 'Pakai'}
                      </button>
                    </div>
                    {voucherError && (
                      <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">error</span> {voucherError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-sm">local_activity</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">{appliedVoucher.kode}</p>
                        <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/70">
                          Diskon {String(appliedVoucher.tipe).toLowerCase() === 'persentase' ? `${appliedVoucher.nilai}%` : formatPrice(appliedVoucher.nilai)} digunakan
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost Calculation Summary */}
              <div className="border-t border-teal-500/10 pt-4 space-y-2.5">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-teal-200/30 uppercase tracking-widest">Rincian Pembayaran</h4>
                <div className="text-xs space-y-1.5 text-slate-600 dark:text-teal-200/70">
                  <div className="flex justify-between">
                    <span>Subtotal Item:</span>
                    <span className="font-extrabold text-slate-800 dark:text-[#eafaf6]">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Diskon ({appliedVoucher?.kode}):</span>
                      <span className="font-extrabold">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Biaya Admin (Per Pesanan):</span>
                    <span className="font-extrabold text-slate-800 dark:text-[#eafaf6]">{formatPrice(adminFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkos Kirim:</span>
                    <span className="font-extrabold text-slate-800 dark:text-[#eafaf6]">
                      {hasPhysicalItems 
                        ? (deliveryAddress.trim() !== '' 
                            ? (hasGps 
                                ? (deliveryMethod
                                    ? `${formatPrice(shippingFee)} (${shippingDistance < 1 ? '< 1 km' : `${shippingDistance} Km`})`
                                    : 'Pilih jasa kirim...'
                                  )
                                : 'Mengukur jarak...'
                              )
                            : 'Menunggu alamat...'
                          )
                        : 'Rp 0 (Bebas Ongkir)'}
                    </span>
                  </div>
                  {hasPhysicalItems && (() => {
                    const totalWeight = physicalItems.reduce((sum, item) => sum + (item.quantity * (item.product.productWeight || 0)), 0);
                    return (
                      <div className="flex justify-between">
                        <span>Total Berat:</span>
                        <span className="font-extrabold text-slate-800 dark:text-[#eafaf6]">
                          {totalWeight > 0 ? `${totalWeight.toFixed(2)} kg` : <span className="text-amber-500 text-[10px] font-bold">Belum diisi di spreadsheet</span>}
                        </span>
                      </div>
                    );
                  })()}
                  <div className="flex justify-between border-t border-dashed border-teal-500/10 pt-2 text-sm font-black text-primary dark:text-[#4edea3]">
                    <span>Total Pembayaran:</span>
                    <span>
                      {hasPhysicalItems 
                        ? (deliveryAddress.trim() === ''
                            ? `${formatPrice(subtotal + adminFee)} (Belum ongkir)`
                            : (!hasGps
                                ? 'Mengukur jarak...'
                                : (!deliveryMethod
                                    ? `${formatPrice(subtotal + adminFee)} (Belum pilih kurir)`
                                    : formatPrice(grandTotal)
                                  )
                              )
                          )
                        : formatPrice(grandTotal)
                      }
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Action */}
            <div className="p-4 bg-white/50 dark:bg-black/20 border-t border-teal-500/10 flex gap-3">
              <button 
                onClick={() => {
                  setIsCartOpen(false);
                  if (buyNowPrevProduct) {
                    setSelectedProduct(buyNowPrevProduct.product);
                    setSelectedVariant(buyNowPrevProduct.variant);
                    setModalQty(buyNowPrevProduct.qty);
                    setBuyNowPrevProduct(null);
                  }
                }}
                className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-teal-200/80 bg-slate-100 dark:bg-teal-950/40 rounded-2xl hover:bg-slate-200 transition-all border-0 cursor-pointer"
              >
                Kembali
              </button>
              <button 
                onClick={handleCheckout}
                disabled={generatingReceipt || (hasPhysicalItems && (!hasGps || !deliveryMethod))}
                className="flex-[2] py-3 text-xs font-black text-white bg-primary hover:bg-primary-hover rounded-2xl flex items-center justify-center gap-1.5 transition-all border-0 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingReceipt ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">invoice</span>
                    Buat Pesanan
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Receipt Preview & Enforced Download Modal */}
      {showReceiptPreview && receiptImage && (
        <div className="absolute inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#051411] border border-teal-500/20 w-full max-w-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-300">
            
            <div className="p-5 border-b border-teal-500/10 text-center bg-teal-500/5 dark:bg-teal-500/10">
              <h3 className="text-base font-black text-primary dark:text-[#4edea3]">Langkah Terakhir Pembelian</h3>
              <p className="text-[11px] text-slate-600 dark:text-teal-200/60 mt-1">
                Silakan unduh kuitansi resmi Anda terlebih dahulu sebelum menghubungi admin.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center bg-slate-100 dark:bg-black/30 scrollbar-none">
              <div className="border border-teal-500/20 rounded-2xl overflow-hidden shadow-md max-w-[260px] bg-white">
                <img src={receiptImage} alt="Kuitansi Resi Belanja" className="w-full h-auto" />
              </div>
              
              {/* Enforced message info for order contact */}
              <div className="mt-3 p-3 bg-teal-500/10 rounded-xl border border-teal-500/20 text-center max-w-[320px]">
                <p className="text-[10px] text-teal-800 dark:text-teal-300 font-extrabold leading-normal">
                  PENTING: Segala bentuk informasi & layanan pemesanan Tokolitera HANYA dilakukan melalui kontak WhatsApp nomor resmi: <strong className="underline">0831-6314-0043</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 bg-white/50 dark:bg-black/20 border-t border-teal-500/10 flex flex-col gap-2">
              <button 
                onClick={handleDownloadReceiptAction}
                className="w-full py-3 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl flex items-center justify-center gap-1.5 border-0 cursor-pointer shadow-sm animate-pulse"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                {hasDownloadedReceipt ? 'Resi Berhasil Diunduh ✓' : '1. Unduh Resi (Wajib)'}
              </button>

              <div className="space-y-1">
                <button 
                  onClick={handleOpenWhatsAppAction}
                  disabled={!hasDownloadedReceipt}
                  className="w-full py-3 text-xs font-black text-white bg-primary hover:bg-primary-hover rounded-xl flex items-center justify-center gap-1.5 border-0 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm font-fill">chat</span>
                  {!hasDownloadedReceipt ? 'Kirim ke WhatsApp (Kunci 🔒)' : '2. Kirim Pesanan ke WhatsApp'}
                </button>
                {hasDownloadedReceipt && (
                  <p className="text-[9px] text-center text-rose-500 font-extrabold animate-bounce mt-1">
                    *Jangan lupa untuk melampirkan resi/gambar yang baru diunduh ke chat WhatsApp Admin!
                  </p>
                )}
              </div>

              {hasDownloadedReceipt && hasPhysicalItems && (
                <button 
                  onClick={() => {
                    setTrackingStep(0);
                    setShowTracking(true);
                    setShowReceiptPreview(false);
                  }}
                  className="w-full py-2.5 text-xs font-bold text-teal-800 dark:text-[#4edea3] bg-teal-500/10 hover:bg-teal-500/20 rounded-xl flex items-center justify-center gap-1.5 border border-teal-500/20 cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-sm font-fill">local_shipping</span>
                  Lacak Pengiriman (Realtime Maps)
                </button>
              )}

              <button 
                onClick={() => {
                  setShowReceiptPreview(false);
                  setHasDownloadedReceipt(false);
                }}
                className="w-full py-2 text-center text-[10px] text-slate-400 hover:underline border-0 bg-transparent cursor-pointer"
              >
                Batalkan & Kembali
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Real-time Google Maps simulated delivery tracking */}
      {showTracking && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#051411] border border-teal-500/20 w-full max-w-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            
            <div className="p-4 border-b border-teal-500/10 flex justify-between items-center bg-slate-50 dark:bg-black/20">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary dark:text-[#4edea3] animate-pulse">explore</span>
                <span className="text-xs font-black text-slate-800 dark:text-[#eafaf6]">Lacak Pengiriman Realtime</span>
              </div>
              <button 
                onClick={() => setShowTracking(false)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-teal-950/60 rounded-full border-0 cursor-pointer text-slate-400"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Tracking Map Screen */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
              
              {/* Premium Simulated Google Map */}
              <div className="relative h-[220px] bg-slate-200 dark:bg-zinc-800 rounded-3xl overflow-hidden border border-teal-500/10 shadow-inner flex items-center justify-center bg-map-grid">
                
                {/* Simulated Roads/Grid Route Path */}
                <svg className="absolute inset-0 w-full h-full stroke-slate-300 dark:stroke-zinc-700 stroke-[3] fill-none">
                  <path d="M 50 180 L 120 180 L 120 100 L 280 100 L 280 40 L 350 40" />
                  <path d="M 120 100 L 120 40 L 280 40" strokeDasharray="4 4" />
                </svg>

                <svg className="absolute inset-0 w-full h-full stroke-primary/40 dark:stroke-primary/20 stroke-[6] fill-none">
                  <path d="M 50 180 L 120 180 L 120 100 L 280 100 L 280 40 L 350 40" />
                </svg>

                {/* Animated Courier Truck */}
                <div 
                  className="absolute w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-1000 z-20"
                  style={{
                    left: trackingStep === 0 ? '50px' 
                         : trackingStep === 1 ? '120px' 
                         : trackingStep === 2 ? '200px' 
                         : trackingStep === 3 ? '280px' 
                         : '350px',
                    top: trackingStep === 0 ? '180px' 
                        : trackingStep === 1 ? '180px' 
                        : trackingStep === 2 ? '100px' 
                        : trackingStep === 3 ? '100px' 
                        : '40px',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <span className="material-symbols-outlined text-sm font-fill animate-bounce">local_shipping</span>
                </div>

                {/* Seller Location Marker (Origin) */}
                <div className="absolute left-[50px] top-[180px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className="bg-emerald-500 text-white p-1 rounded-full shadow-md">
                    <span className="material-symbols-outlined text-[10px] font-fill">store</span>
                  </div>
                  <span className="bg-white/80 dark:bg-black/80 px-1 py-0.5 rounded text-[8px] font-bold mt-0.5 border border-teal-500/10">Penjual</span>
                </div>

                {/* Buyer Location Marker (Destination) */}
                <div className="absolute left-[350px] top-[40px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className="bg-rose-500 text-white p-1 rounded-full shadow-md animate-pulse">
                    <span className="material-symbols-outlined text-[10px] font-fill">person_pin_circle</span>
                  </div>
                  <span className="bg-white/80 dark:bg-black/80 px-1 py-0.5 rounded text-[8px] font-bold mt-0.5 border border-teal-500/10">Pembeli</span>
                </div>
              </div>

              {/* Status Info */}
              <div className="bg-teal-500/5 dark:bg-teal-500/10 p-3.5 rounded-2xl border border-teal-500/10 space-y-2">
                <div className="text-[10px] font-black text-slate-400 dark:text-teal-200/40 uppercase tracking-widest">Detail Pesanan</div>
                <div className="text-xs text-slate-800 dark:text-[#eafaf6] space-y-1 font-semibold">
                  <div>No. Pesanan: <strong className="text-primary dark:text-[#4edea3]">#{trackingOrderId}</strong></div>
                  <div className="truncate">Produk: {trackingProductTitles}</div>
                  <div className="text-[11px] text-slate-600 dark:text-teal-200/60 mt-1">
                    Dari: {trackingSellerAddress || 'Alamat Penjual'}
                  </div>
                </div>
              </div>

              {/* Live Timeline Steps */}
              <div className="space-y-4 pt-2">
                {[
                  { title: "Pesanan Diterima Penjual", desc: "Penjual sedang menyiapkan barang di lokasi.", stepVal: 0 },
                  { title: "Kurir Menuju Penjual", desc: "Kurir berjalan menjemput paket.", stepVal: 1 },
                  { title: "Paket Sedang Diantar", desc: "Kurir membawa paket ke lokasi Anda.", stepVal: 2 },
                  { title: "Kurir Mendekati Lokasi", desc: "Kurir berada di dekat jalan rumah Anda.", stepVal: 3 },
                  { title: "Tiba di Tujuan", desc: "Paket berhasil diterima! Selamat berliterasi.", stepVal: 4 }
                ].map((s, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-bold ${
                        trackingStep >= s.stepVal 
                          ? 'bg-primary border-primary text-white font-black' 
                          : 'bg-white dark:bg-black/20 border-slate-300 text-slate-400'
                      }`}>
                        {trackingStep > s.stepVal ? '✓' : idx + 1}
                      </div>
                      {idx < 4 && (
                        <div className={`w-0.5 h-8 ${trackingStep > s.stepVal ? 'bg-primary' : 'bg-slate-300 dark:bg-zinc-700'}`}></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold leading-none ${trackingStep >= s.stepVal ? 'text-slate-800 dark:text-[#eafaf6]' : 'text-slate-400'}`}>
                        {s.title}
                      </h4>
                      <p className={`text-[10px] mt-1 leading-normal ${trackingStep >= s.stepVal ? 'text-slate-500 dark:text-teal-200/60' : 'text-slate-400/60'}`}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Tracking Footer */}
            <div className="p-4 bg-white/50 dark:bg-black/20 border-t border-teal-500/10 flex gap-2">
              <button 
                onClick={() => setShowTracking(false)}
                className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-teal-200/80 bg-slate-100 dark:bg-teal-950/40 rounded-xl hover:bg-slate-200 border-0 cursor-pointer"
              >
                Tutup
              </button>
              {trackingStep === 4 && (() => {
                // Find which products were in this order
                const thisOrder = orderHistory.find(o => o.orderId === trackingOrderId);
                const orderItems = thisOrder ? thisOrder.items : [];
                // Check if user already reviewed ALL products in this order
                const allReviewed = orderItems.length > 0 && orderItems.every(item => 
                  localReviews.some(r => r.productTitle === item.title && r.orderCode === trackingOrderId.replace('#', ''))
                );

                return allReviewed ? (
                  <div className="flex-[2] py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-xl flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm font-fill">check_circle</span>
                    Sudah Diulas
                  </div>
                ) : (
                  <button 
                    onClick={() => {
    const unreviewed = orderItems.find(item => 
      !localReviews.some(r => r.productTitle === item.title && r.orderCode === trackingOrderId.replace('#', ''))
    );
    if (!unreviewed) {
      customAlert('Kamu sudah mengulas semua produk di pesanan ini.');
      return;
    }
    setReviewCode(trackingOrderId);
    setReviewName(currentUser ? currentUser.name : recipientName);
    const matchedProd = parsedProducts.find(p => p.title === unreviewed.title);
    setReviewProductId(matchedProd ? matchedProd.id : '');
    setReviewProductTitle(unreviewed.title);
    setReviewStars(5);
    setReviewComment('');
    setReviewPhoto(null);
    setShowTracking(false);
    setShowReviewModal(true);
  }}
                    className="flex-[2] py-3 text-xs font-black text-white bg-primary hover:bg-primary-hover rounded-xl flex items-center justify-center gap-1 border-0 cursor-pointer shadow-md animate-pulse"
                  >
                    <span className="material-symbols-outlined text-sm font-fill">grade</span>
                    Beri Penilaian Produk
                  </button>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* Star Reviews Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#051411] border border-teal-500/20 w-full max-w-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            
            <div className="p-5 border-b border-teal-500/10 text-center bg-teal-500/5 dark:bg-teal-500/10">
              <h3 className="text-base font-black text-primary dark:text-[#4edea3]">Penilaian Produk</h3>
              <p className="text-[11px] text-slate-600 dark:text-teal-200/60 mt-1">
                Berikan penilaian untuk produk yang sudah Anda terima.
              </p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!reviewComment.trim()) {
                setReviewToast('Harap isi komentar ulasan!');
                setTimeout(() => setReviewToast(''), 3000);
                return;
              }

              const matchedProd = parsedProducts.find(p => p.id === reviewProductId) || parsedProducts.find(p => p.title === reviewProductTitle) || parsedProducts[0];
              const cleanedCode = reviewCode.trim().replace('#', '');
              
              // Check if already reviewed this product for this order (#9)
              const alreadyReviewed = localReviews.some(r => 
                r.productTitle === (matchedProd ? matchedProd.title : reviewProductTitle) && 
                r.orderCode === cleanedCode
              );
              if (alreadyReviewed) {
                setReviewToast('Anda sudah memberikan ulasan untuk produk ini pada pesanan ini.');
                setTimeout(() => setReviewToast(''), 3000);
                return;
              }

              // Verify completed order
              const hasCompletedOrder = orderHistory.some(order => 
                order.orderId.replace('#', '') === cleanedCode && 
                order.status === 'Selesai' && 
                order.items.some(item => item.title === (matchedProd ? matchedProd.title : reviewProductTitle))
              );
              const isSeedReview = cleanedCode.toLowerCase() === 'seed' || cleanedCode === 'LIT-839201' || cleanedCode === 'rev-1' || cleanedCode === 'rev-2';

              if (!hasCompletedOrder && !isSeedReview) {
                setReviewToast('Anda hanya dapat mengulas produk yang sudah dibeli dan status pesanan selesai.');
                setTimeout(() => setReviewToast(''), 4000);
                return;
              }

              setIsReviewSubmitting(true);
              
              // Google Form submission
              const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfX8U8qfL1G6T5eQj9G77r3kR2b1pUvD00qT-yL9O_hX_yF1Q/formResponse";
              const formData = new FormData();
              formData.append("entry.123456789", reviewCode);
              formData.append("entry.987654321", reviewName);
              formData.append("entry.111213141", String(reviewStars));
              formData.append("entry.222324252", reviewComment);
              
              try {
                await fetch(formUrl, { method: "POST", mode: "no-cors", body: formData });
              } catch (err) { console.log(err); }

              const newReview = {
                id: `rev-${Date.now()}`,
                name: reviewName,
                orderCode: cleanedCode,
                productTitle: matchedProd ? matchedProd.title : reviewProductTitle,
                stars: reviewStars,
                comment: reviewComment,
                photo: reviewPhoto,
                date: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
              };

              setLocalReviews(prev => [newReview, ...prev]);
              setIsReviewSubmitting(false);
              setShowReviewModal(false);
              setReviewComment('');
              setReviewPhoto(null);
            }} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-none">

              {/* Toast notification (#8) */}
              {reviewToast && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-bold text-rose-600 dark:text-rose-400 text-center animate-in fade-in">
                  {reviewToast}
                </div>
              )}
              
              {/* Order ID - read only */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">ID Pesanan</label>
                <div className="bg-slate-100/80 dark:bg-black/25 border border-teal-500/10 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-teal-100/80">
                  {reviewCode || '-'}
                </div>
              </div>

              {/* Name - auto from profile (#5) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Nama Pembeli</label>
                <div className="bg-slate-100/80 dark:bg-black/25 border border-teal-500/10 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-teal-100/80 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] text-emerald-500">person</span>
                  {reviewName || '-'}
                </div>
              </div>

              {/* Product - auto from order (#6) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Produk yang Diulas</label>
                <div className="bg-slate-100/80 dark:bg-black/25 border border-teal-500/10 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-teal-100/80 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] text-primary">inventory_2</span>
                  {reviewProductTitle || 'Produk'}
                </div>
              </div>

              {/* Star Rating selector */}
              <div className="space-y-1.5 text-center">
                <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider block text-left">Peringkat Bintang *</label>
                <div className="flex justify-center gap-1 py-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewStars(star)}
                      className="border-0 bg-transparent cursor-pointer p-1 text-2xl"
                    >
                      <span className={`material-symbols-outlined text-3xl transition-all ${
                        star <= reviewStars ? 'text-amber-400 font-fill scale-110' : 'text-slate-300'
                      }`}>
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Komentar / Ulasan Anda *</label>
                <textarea 
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Ceritakan pengalaman Anda membeli produk ini..."
                  required
                  rows="3"
                  className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Photo upload (#7) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Foto Produk (Opsional)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary dark:text-[#4edea3] text-[10px] font-bold rounded-lg border border-primary/20 cursor-pointer transition-all">
                    <span className="material-symbols-outlined text-[14px]">add_a_photo</span>
                    {reviewPhoto ? 'Ganti Foto' : 'Upload Foto'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && file.size < 2 * 1024 * 1024) {
                          const reader = new FileReader();
                          reader.onloadend = () => setReviewPhoto(reader.result);
                          reader.readAsDataURL(file);
                        } else if (file) {
                          setReviewToast('Ukuran foto maksimal 2 MB');
                          setTimeout(() => setReviewToast(''), 3000);
                        }
                      }}
                    />
                  </label>
                  {reviewPhoto && (
                    <button type="button" onClick={() => setReviewPhoto(null)} className="text-[9px] text-rose-500 font-bold border-0 bg-transparent cursor-pointer">Hapus</button>
                  )}
                </div>
                {reviewPhoto && (
                  <img src={reviewPhoto} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-teal-500/10 mt-1" />
                )}
              </div>

              <div className="p-4 bg-white/50 dark:bg-black/20 border-t border-teal-500/10 flex gap-2 pt-5">
                <button 
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-teal-200/80 bg-slate-100 dark:bg-teal-950/40 rounded-xl hover:bg-slate-200 border-0 cursor-pointer"
                >
                  Kembali
                </button>
                <button 
                  type="submit"
                  disabled={isReviewSubmitting}
                  className="flex-[2] py-3 text-xs font-black text-white bg-primary hover:bg-primary-hover rounded-xl flex items-center justify-center gap-1 border-0 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isReviewSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

            </section>

      {/* User Authentication Modal (Login / Register) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#051411] border border-teal-500/20 w-full max-w-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            
            <div className="p-5 border-b border-teal-500/10 text-center bg-teal-500/5 dark:bg-teal-500/10 relative">
              <h3 className="text-base font-black text-primary dark:text-[#4edea3]">
                {authMode === 'login' ? 'Masuk ke Tokolitera' : 'Daftar Akun'}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-teal-200/60 mt-1">
                {authMode === 'login' 
                  ? 'Masuk menggunakan username & password Anda.' 
                  : 'Lengkapi formulir untuk membuat akun baru.'}
              </p>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-200 dark:hover:bg-teal-950/60 rounded-full border-0 cursor-pointer text-slate-400"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-none">
              {authMode === 'login' ? (
                /* LOGIN FORM */
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setLoginLoading(true);
                  try {
                    // Check locally created accounts from localStorage
                    const localAccounts = JSON.parse(localStorage.getItem('tokolitera_accounts') || '[]');
                    const matched = localAccounts.find(acc => acc.username.trim().toLowerCase() === loginUsername.trim().toLowerCase() && acc.password === loginPassword);
                    
                    // Default admin mock account
                    if (loginUsername.trim().toLowerCase() === 'admin' && loginPassword === 'admin') {
                      const adminUser = { fullName: 'Relawan Admin', phoneNumber: '08123456789', email: 'admin@sukabumi.literasi', username: 'admin' };
                      setCurrentUser(adminUser);
                      localStorage.setItem('tokolitera_user', JSON.stringify(adminUser));
                      setShowAuthModal(false);
                      customAlert("Berhasil masuk sebagai Relawan Admin.");
                      setLoginLoading(false);
                      return;
                    }

                    if (matched) {
                      setCurrentUser(matched);
                      localStorage.setItem('tokolitera_user', JSON.stringify(matched));
                      setShowAuthModal(false);
                      customAlert(`Selamat datang kembali, ${matched.fullName}!`);
                      setLoginLoading(false);
                    } else {
                      // Fallback: fetch from Google Sheets spreadsheet
                      let sheetUser = null;
                      try {
                        const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ACCOUNTS}/gviz/tq?tqx=out:json&t=${Date.now()}`);
                        if (res.ok) {
                          const text = await res.text();
                          const jsonStart = text.indexOf('google.visualization.Query.setResponse(');
                          if (jsonStart !== -1) {
                            const rawJson = text.substring(jsonStart + 'google.visualization.Query.setResponse('.length, text.length - 2);
                            const parsed = JSON.parse(rawJson);
                            const rows = parsed.table?.rows || [];
                            for (const row of rows) {
                              if (!row || !row.c) continue;
                              const sheetUsername = String(row.c[4]?.v || '').trim();
                              const sheetPassword = String(row.c[5]?.v || '').trim();
                              if (sheetUsername.toLowerCase() === loginUsername.trim().toLowerCase() && sheetPassword === loginPassword) {
                                sheetUser = {
                                  fullName: String(row.c[1]?.v || '').trim(),
                                  phoneNumber: String(row.c[2]?.v || '').trim(),
                                  email: String(row.c[3]?.v || '').trim(),
                                  username: sheetUsername,
                                  password: sheetPassword,
                                  address: String(row.c[6]?.v || '').trim(),
                                  kodePos: row.c[7]?.v ? String(row.c[7]?.f || row.c[7]?.v || '').trim() : '',
                                  provinsi: String(row.c[9]?.v || '').trim(),
                                  kota: String(row.c[10]?.v || '').trim(),
                                  kecamatan: String(row.c[11]?.v || '').trim(),
                                  kelurahan: String(row.c[12]?.v || '').trim(),
                                  patokan: String(row.c[13]?.v || '').trim(),
                                  googleMapsUrl: String(row.c[14]?.v || '').trim()
                                };
                                break;
                              }
                            }
                          }
                        }
                      } catch (fetchErr) {
                        console.error('Failed to fetch accounts from Google Sheets:', fetchErr);
                      }

                      if (sheetUser) {
                        // Save to localStorage for faster future logins
                        const updatedAccounts = [...localAccounts];
                        if (!updatedAccounts.some(acc => acc.username.trim().toLowerCase() === sheetUser.username.toLowerCase())) {
                          updatedAccounts.push(sheetUser);
                          localStorage.setItem('tokolitera_accounts', JSON.stringify(updatedAccounts));
                        }
                        setCurrentUser(sheetUser);
                        localStorage.setItem('tokolitera_user', JSON.stringify(sheetUser));
                        setShowAuthModal(false);
                        customAlert(`Selamat datang kembali, ${sheetUser.fullName}!`);
                      } else {
                        // Check if username exists (locally or on sheet) but password is wrong
                        const userExistsLocal = localAccounts.some(acc => acc.username.trim().toLowerCase() === loginUsername.trim().toLowerCase());
                        if (userExistsLocal) {
                          customAlert("Password (kata sandi) salah! Harap periksa kembali password Anda.");
                        } else {
                          // Try to check if username exists on sheet (password mismatch case)
                          let usernameExistsOnSheet = false;
                          try {
                            const res2 = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ACCOUNTS}/gviz/tq?tqx=out:json&t=${Date.now()}`);
                            if (res2.ok) {
                              const text2 = await res2.text();
                              const jsonStart2 = text2.indexOf('google.visualization.Query.setResponse(');
                              if (jsonStart2 !== -1) {
                                const rawJson2 = text2.substring(jsonStart2 + 'google.visualization.Query.setResponse('.length, text2.length - 2);
                                const parsed2 = JSON.parse(rawJson2);
                                const rows2 = parsed2.table?.rows || [];
                                usernameExistsOnSheet = rows2.some(row => row?.c && String(row.c[4]?.v || '').trim().toLowerCase() === loginUsername.trim().toLowerCase());
                              }
                            }
                          } catch (_e) { /* ignore */ }

                          if (usernameExistsOnSheet) {
                            customAlert("Password (kata sandi) salah! Harap periksa kembali password Anda.");
                          } else {
                            customAlert("Username tidak terdaftar! Harap periksa kembali username Anda atau silakan klik Daftar Akun baru.");
                          }
                        }
                      }
                      setLoginLoading(false);
                    }
                  } catch (err) {
                    console.error('Login error:', err);
                    customAlert("Terjadi kesalahan saat login. Silakan coba lagi.");
                    setLoginLoading(false);
                  }
                }} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Username</label>
                    <input 
                      type="text" 
                      value={loginUsername}
                      onChange={e => setLoginUsername(e.target.value)}
                      placeholder="Masukkan username Anda..."
                      required
                      className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Password</label>
                    <input 
                      type="password" 
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Masukkan password Anda..."
                      required
                      className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs border-0 cursor-pointer shadow-md mt-2 transition-all disabled:opacity-60"
                  >
                    {loginLoading ? 'Memverifikasi...' : 'Masuk'}
                  </button>

                  <p className="text-[10px] text-center text-slate-500 dark:text-teal-200/40">
                    Belum punya akun?{' '}
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('register')} 
                      className="text-primary dark:text-[#4edea3] hover:underline font-bold border-0 bg-transparent cursor-pointer"
                    >
                      Daftar Sekarang
                    </button>
                  </p>
                </form>
              ) : (
                /* REGISTRATION FORM */
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!regFullName.trim() || !regPhone.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
                    customAlert("Harap isi semua kolom pendaftaran!");
                    return;
                  }

                  if (regPassword !== regConfirmPassword) {
                    customAlert("Konfirmasi password tidak cocok! Harap periksa kembali.");
                    return;
                  }

                  const localAccounts = JSON.parse(localStorage.getItem('tokolitera_accounts') || '[]');

                  // 1. Validasi Username Unik (Case-insensitive & Trimmed)
                  const uNameLower = regUsername.trim().toLowerCase();
                  if (localAccounts.some(acc => acc.username.trim().toLowerCase() === uNameLower)) {
                    customAlert("Username sudah digunakan! Harap gunakan username lain.");
                    return;
                  }

                  // 2. Validasi Maksimal 2 Pendaftaran per Email
                  const emailLower = regEmail.trim().toLowerCase();
                  const emailCount = localAccounts.filter(acc => acc.email.trim().toLowerCase() === emailLower).length;
                  if (emailCount >= 2) {
                    customAlert("Email ini sudah digunakan untuk 2 kali pendaftaran! Harap gunakan email lain.");
                    return;
                  }

                  // 3. Validasi Maksimal 2 Pendaftaran per Nomor HP
                  const phoneTrim = regPhone.trim();
                  const phoneCount = localAccounts.filter(acc => acc.phoneNumber.trim() === phoneTrim).length;
                  if (phoneCount >= 2) {
                    customAlert("Nomor HP ini sudah digunakan untuk 2 kali pendaftaran! Harap gunakan nomor HP lain.");
                    return;
                  }

                  // 4. Kirim ke Google Form secara Asinkron (Non-blocking)
                  const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeyu-We_MgKuQxb3cYdXmyyxXoaAjVEirfrymHcktFY235yaQ/formResponse";
                  const formData = new FormData();
                  formData.append("entry.1452784474", regFullName);
                  formData.append("entry.2048515314", regPhone);
                  formData.append("entry.1741289339", regEmail);
                  formData.append("entry.1215985509", regUsername);
                  formData.append("entry.44066238", regPassword);

                  fetch(formUrl, {
                    method: "POST",
                    mode: "no-cors",
                    body: formData
                  }).catch(err => {
                    console.log("Form submission notice:", err);
                  });

                  // 5. Simpan Akun secara Lokal
                  const newUser = {
                    fullName: regFullName,
                    phoneNumber: regPhone,
                    email: regEmail,
                    username: regUsername,
                    password: regPassword
                  };

                  localAccounts.push(newUser);
                  localStorage.setItem('tokolitera_accounts', JSON.stringify(localAccounts));

                  // Auto login
                  setCurrentUser(newUser);
                  localStorage.setItem('tokolitera_user', JSON.stringify(newUser));

                  // Reset inputs
                  setRegFullName('');
                  setRegPhone('');
                  setRegEmail('');
                  setRegUsername('');
                  setRegPassword('');
                  setRegConfirmPassword('');
                  
                  setShowAuthModal(false);
                  customAlert(`Pendaftaran Akun Berhasil! Selamat datang, ${newUser.fullName}.`);
                }} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda..."
                      required
                      className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">No. HP Aktif</label>
                    <input 
                      type="tel" 
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      placeholder="Contoh: 08123456789..."
                      required
                      className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {regPhone.trim() && localAccountsList.filter(acc => acc.phoneNumber.trim() === regPhone.trim()).length >= 2 && (
                      <p className="text-[10px] text-rose-500 font-extrabold animate-pulse mt-0.5">⚠️ Nomor HP ini sudah terdaftar 2 kali!</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Email</label>
                    <input 
                      type="email" 
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="Contoh: nama@domain.com..."
                      required
                      className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {regEmail.trim() && localAccountsList.filter(acc => acc.email.trim().toLowerCase() === regEmail.trim().toLowerCase()).length >= 2 && (
                      <p className="text-[10px] text-rose-500 font-extrabold animate-pulse mt-0.5">⚠️ Email ini sudah terdaftar 2 kali!</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Buat Username</label>
                    <input 
                      type="text" 
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      placeholder="Pilih username unik..."
                      required
                      className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {regUsername.trim() && localAccountsList.some(acc => acc.username.trim().toLowerCase() === regUsername.trim().toLowerCase()) && (
                      <p className="text-[10px] text-rose-500 font-extrabold animate-pulse mt-0.5">⚠️ Username sudah terdaftar! Gunakan nama lain.</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Buat Password</label>
                    <input 
                      type="password" 
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Buat password aman..."
                      required
                      className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Konfirmasi Password</label>
                    <input 
                      type="password" 
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      placeholder="Ulangi password Anda..."
                      required
                      className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {regConfirmPassword && regPassword !== regConfirmPassword && (
                      <p className="text-[10px] text-rose-500 font-extrabold animate-pulse mt-0.5">⚠️ Konfirmasi password tidak cocok!</p>
                    )}
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs border-0 cursor-pointer shadow-md mt-2 transition-all"
                  >
                    Daftar Akun
                  </button>

                  <p className="text-[10px] text-center text-slate-500 dark:text-teal-200/40">
                    Sudah punya akun?{' '}
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('login')} 
                      className="text-primary dark:text-[#4edea3] hover:underline font-bold border-0 bg-transparent cursor-pointer"
                    >
                      Masuk
                    </button>
                  </p>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* User Account Settings Modal (Profile, Likes, Order History) */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#051411] border border-teal-500/20 w-full max-w-[480px] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[85vh] animate-in zoom-in duration-300">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-teal-500/10 bg-teal-500/5 dark:bg-teal-500/10 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-primary dark:text-[#4edea3] uppercase tracking-wider">Pengaturan Akun</h3>
                <p className="text-[10px] text-slate-500 dark:text-teal-200/50">Kelola profil, produk disukai, & riwayat pesanan Anda.</p>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-teal-950/60 rounded-full border-0 cursor-pointer text-slate-400"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-teal-500/10 bg-slate-50 dark:bg-black/10">
              {[
                { id: 'info', label: 'Profil', icon: 'person' },
                { id: 'likes', label: 'Disukai', icon: 'favorite' },
                { id: 'orders', label: 'Status Pesanan', icon: 'receipt_long' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setProfileTab(tab.id)}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1 border-0 border-b-2 cursor-pointer transition-all ${
                    profileTab === tab.id 
                      ? 'border-primary text-primary dark:text-[#4edea3] bg-white dark:bg-[#051411]/50' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tabs Content */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-none space-y-4">
              
              {/* TAB 1: PROFILE INFO & EDIT */}
              {profileTab === 'info' && !isEditingProfile && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Profile Header Card */}
                  <div className="p-5 bg-gradient-to-tr from-teal-500/10 to-emerald-500/5 dark:from-teal-950/30 dark:to-emerald-950/10 rounded-3xl border border-teal-500/15 flex flex-col items-center text-center space-y-3">
                    {currentUser.profilePhoto ? (
                      <img src={currentUser.profilePhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-inner" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/20 text-primary dark:text-[#4edea3] flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-3xl font-fill">person</span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-black text-sm text-slate-800 dark:text-[#eafaf6]">{currentUser.fullName}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-teal-200/50 font-bold">@ {currentUser.username}</p>
                    </div>
                  </div>

                  {/* Profile Details List */}
                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-50 dark:bg-black/10 rounded-2xl border border-teal-500/5 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-slate-400 dark:text-teal-200/30 uppercase tracking-wider">Email</span>
                        <div className="text-xs font-bold text-slate-700 dark:text-[#eafaf6]">{currentUser.email || '-'}</div>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 dark:text-teal-200/10 text-sm">mail</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-black/10 rounded-2xl border border-teal-500/5 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-slate-400 dark:text-teal-200/30 uppercase tracking-wider">Nomor HP Aktif</span>
                        <div className="text-xs font-bold text-slate-700 dark:text-[#eafaf6]">{currentUser.phoneNumber || '-'}</div>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 dark:text-teal-200/10 text-sm">call</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-black/10 rounded-2xl border border-teal-500/5 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 dark:text-teal-200/30 uppercase tracking-wider">Alamat Lengkap Pengiriman</span>
                        <span className="material-symbols-outlined text-slate-300 dark:text-teal-200/10 text-sm">local_shipping</span>
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-[#eafaf6] leading-relaxed break-words">
                        {[
                          currentUser.address,
                          currentUser.kelurahan ? `Kel. ${currentUser.kelurahan}` : '',
                          currentUser.kecamatan ? `Kec. ${currentUser.kecamatan}` : '',
                          currentUser.kota,
                          currentUser.provinsi,
                          currentUser.kodePos
                        ].filter(Boolean).join(', ') || '-'}
                        {currentUser.patokan && (
                          <div className="text-[10px] text-slate-500 dark:text-teal-200/50 mt-1 italic">
                            Patokan: {currentUser.patokan}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Google Maps Link */}
                  {currentUser.googleMapsUrl && (
                    <div className="p-3.5 bg-slate-50 dark:bg-black/10 rounded-2xl border border-teal-500/5 flex justify-between items-center">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[9px] font-black text-slate-400 dark:text-teal-200/30 uppercase tracking-wider">Link Google Maps</span>
                        <a 
                          href={currentUser.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-primary dark:text-[#4edea3] hover:underline flex items-center gap-1 truncate block"
                        >
                          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          Lihat di Google Maps
                        </a>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 dark:text-teal-200/10 text-sm">location_on</span>
                    </div>
                  )}

                  {/* Buku Alamat */}
                  <div className="pt-2 border-t border-teal-500/10">
                    <h5 className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider mb-3">Buku Alamat Pengiriman (Maks. 3)</h5>
                    <div className="space-y-3">
                      {savedAddresses.map((addr, idx) => (
                        <div key={idx} className="bg-white/80 dark:bg-black/20 p-3 rounded-2xl border border-teal-500/10 shadow-sm relative">
                          {idx !== 0 && (
                            <div className="absolute top-2 right-2 flex gap-1">
                              <button
                                onClick={() => handleEditAddress(idx)}
                                className="p-1.5 bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-500/20 cursor-pointer border-0"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(idx)}
                                className="p-1.5 bg-rose-500/10 text-rose-600 rounded-lg hover:bg-rose-500/20 cursor-pointer border-0"
                              >
                                <span className="material-symbols-outlined text-xs">delete</span>
                              </button>
                            </div>
                          )}
                          <div className="text-[9px] font-black text-primary uppercase tracking-wider mb-1">
                            {addr.label || `Alamat ${idx + 1}`}
                            {idx === 0 && <span className="ml-2 bg-primary/10 px-1.5 py-0.5 rounded text-[8px]">Utama</span>}
                          </div>
                          <div className="text-xs text-slate-700 dark:text-teal-100/90 font-medium leading-relaxed">
                            {addr.address}
                          </div>
                          {addr.patokan && (
                            <div className="text-[10px] text-slate-500 dark:text-teal-200/60 mt-1 italic">
                              Patokan: {addr.patokan}
                            </div>
                          )}
                        </div>
                      ))}

                      {savedAddresses.length < 3 && !isAddingAddress && (
                        <button
                          onClick={() => {
                            setEditingAddressIdx(null);
                            setNewAddressLabel('');
                            setNewAddressRecipientName('');
                            setNewAddressRecipientPhone('');
                            setNewAddressText('');
                            setNewAddressPatokan('');
                            setNewAddressMapsUrl('');
                            setIsAddingAddress(true);
                          }}
                          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider border border-dashed border-slate-300 dark:border-slate-600 cursor-pointer flex items-center justify-center gap-1 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          Tambah Alamat Baru
                        </button>
                      )}

                      {isAddingAddress && (
                        <div className="bg-slate-50 dark:bg-black/10 p-3.5 rounded-2xl border border-teal-500/15 space-y-3 animate-in slide-in-from-top-2">
                          <h6 className="text-[10px] font-black text-slate-600 dark:text-teal-200/80">{editingAddressIdx !== null ? 'Edit Alamat' : 'Tambah Alamat Baru'}</h6>
                          <div className="space-y-2">
                            <input 
                              type="text" 
                              value={newAddressLabel}
                              onChange={e => setNewAddressLabel(e.target.value)}
                              placeholder="Label (Contoh: Rumah, Kantor)"
                              className="bg-white/60 dark:bg-black/35 border border-teal-500/10 rounded-xl px-3 py-2 w-full text-xs focus:ring-1 focus:ring-primary"
                            />
                            <input 
                              type="text" 
                              value={newAddressRecipientName}
                              onChange={e => setNewAddressRecipientName(e.target.value)}
                              placeholder="Nama Penerima"
                              className="bg-white/60 dark:bg-black/35 border border-teal-500/10 rounded-xl px-3 py-2 w-full text-xs focus:ring-1 focus:ring-primary"
                            />
                            <input 
                              type="text" 
                              value={newAddressRecipientPhone}
                              onChange={e => setNewAddressRecipientPhone(e.target.value)}
                              placeholder="No. WhatsApp Penerima"
                              className="bg-white/60 dark:bg-black/35 border border-teal-500/10 rounded-xl px-3 py-2 w-full text-xs focus:ring-1 focus:ring-primary"
                            />
                            <textarea 
                              value={newAddressText}
                              onChange={e => setNewAddressText(e.target.value)}
                              placeholder="Alamat lengkap (Jalan, RT/RW, Desa, Kec, Kab) *"
                              rows="2"
                              className="bg-white/60 dark:bg-black/35 border border-teal-500/10 rounded-xl px-3 py-2 w-full text-xs focus:ring-1 focus:ring-primary resize-none"
                            />
                            <input 
                              type="text" 
                              value={newAddressPatokan}
                              onChange={e => setNewAddressPatokan(e.target.value)}
                              placeholder="Patokan *"
                              className="bg-white/60 dark:bg-black/35 border border-teal-500/10 rounded-xl px-3 py-2 w-full text-xs focus:ring-1 focus:ring-primary"
                            />
                            <div className="flex gap-2">
                              <input 
                                type="url" 
                                value={newAddressMapsUrl}
                                onChange={e => setNewAddressMapsUrl(e.target.value)}
                                placeholder="Link Google Maps *"
                                className="bg-white/60 dark:bg-black/35 border border-teal-500/10 rounded-xl px-3 py-2 flex-1 text-xs focus:ring-1 focus:ring-primary"
                              />
                              <button
                                type="button"
                                onClick={() => handleGetGpsForProfile(setNewAddressMapsUrl)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 min-w-max transition-colors"
                                disabled={gpsLoading}
                              >
                                <span className="material-symbols-outlined text-[14px]">my_location</span>
                                {gpsLoading ? 'Memuat...' : 'Lokasi Saat Ini'}
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={handleAddAddress}
                              className="flex-1 bg-primary text-white text-[10px] font-bold uppercase py-2 rounded-xl cursor-pointer"
                            >
                              Simpan
                            </button>
                            <button 
                              onClick={() => setIsAddingAddress(false)}
                              className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase py-2 rounded-xl cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        // Pre-fill states from current user before editing
                        setProfileFullName(currentUser.fullName || '');
                        setProfilePhone(currentUser.phoneNumber || '');
                        setProfileEmail(currentUser.email || '');
                        setProfileAddress(currentUser.address || '');
                        setProfileProv(currentUser.provinsi || '');
                        setProfileCity(currentUser.kota || '');
                        setProfileDist(currentUser.kecamatan || '');
                        setProfileSubDist(currentUser.kelurahan || '');
                        setProfilePatokan(currentUser.patokan || '');
                        setProfilePostalCode(currentUser.kodePos || '');
                        setProfileGoogleMapsUrl(currentUser.googleMapsUrl || '');
                        setIsEditingProfile(true);
                      }}
                      className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs border-0 cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span className="material-symbols-outlined text-xs">edit</span>
                      Edit Profil
                    </button>
                    
                    <a
                      href="https://docs.google.com/forms/d/e/1FAIpQLSdnL_b13RfPC7cTheaImcxZy5p8C0mpEp2gqjIveHhdQRE51g/viewform?usp=publish-editor"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all text-center no-underline border border-emerald-500/20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">storefront</span>
                      Gabung Mitra Penjual (Merchant)
                    </a>
                  </div>
                </div>
              )}

              {profileTab === 'info' && isEditingProfile && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!profileFullName.trim() || !profilePhone.trim() || !profileEmail.trim() || !profilePatokan.trim() || !profileGoogleMapsUrl.trim()) {
                    customAlert("Harap lengkapi nama, no HP, email, patokan, dan link Google Maps!");
                    return;
                  }

                  const updatedUser = {
                    ...currentUser,
                    fullName: profileFullName,
                    phoneNumber: profilePhone,
                    email: profileEmail,
                    address: profileAddress,
                    provinsi: profileProv,
                    kota: profileCity,
                    kecamatan: profileDist,
                    kelurahan: profileSubDist,
                    patokan: profilePatokan,
                    kodePos: profilePostalCode,
                    googleMapsUrl: profileGoogleMapsUrl,
                    profilePhoto: profilePhoto
                  };

                  // Kirim data pendaftaran & profil terbaru ke Google Form secara asinkron
                  const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeyu-We_MgKuQxb3cYdXmyyxXoaAjVEirfrymHcktFY235yaQ/formResponse";
                  const formData = new FormData();
                  formData.append("entry.1452784474", profileFullName);
                  formData.append("entry.2048515314", profilePhone);
                  formData.append("entry.1741289339", profileEmail);
                  formData.append("entry.1215985509", currentUser.username);
                  formData.append("entry.44066238", currentUser.password || "");
                  formData.append("entry.404451431", profileAddress || "");
                  formData.append("entry.547372547", profileProv || "");
                  formData.append("entry.1272967028", profileCity || "");
                  formData.append("entry.929168018", profileDist || "");
                  formData.append("entry.435119944", profileSubDist || "");
                  formData.append("entry.705964701", profilePatokan || "");
                  formData.append("entry.6765382", profilePostalCode || "");
                  formData.append("entry.1670501860", profileGoogleMapsUrl || "");

                  fetch(formUrl, {
                    method: "POST",
                    mode: "no-cors",
                    body: formData
                  }).catch(err => {
                    console.log("Profile update submission notice:", err);
                  });

                  // Update accounts list
                  const localAccounts = JSON.parse(localStorage.getItem('tokolitera_accounts') || '[]');
                  const updatedAccounts = localAccounts.map(acc => {
                    if (acc.username.trim().toLowerCase() === currentUser.username.trim().toLowerCase()) {
                      return updatedUser;
                    }
                    return acc;
                  });

                  localStorage.setItem('tokolitera_accounts', JSON.stringify(updatedAccounts));
                  localStorage.setItem('tokolitera_user', JSON.stringify(updatedUser));
                  setCurrentUser(updatedUser);

                  // Update primary address (Alamat Utama) in savedAddresses
                  const updatedPrimaryAddressText = [
                    profileAddress,
                    profileSubDist ? `Kel. ${profileSubDist}` : '',
                    profileDist ? `Kec. ${profileDist}` : '',
                    profileCity,
                    profileProv,
                    profilePostalCode
                  ].filter(Boolean).join(', ');

                  const updatedSavedAddresses = [...savedAddresses];
                  if (updatedSavedAddresses.length > 0) {
                    updatedSavedAddresses[0] = {
                      ...updatedSavedAddresses[0],
                      recipientName: profileFullName,
                      recipientPhone: profilePhone,
                      address: updatedPrimaryAddressText,
                      patokan: profilePatokan || '',
                      mapsUrl: profileGoogleMapsUrl || ''
                    };
                  } else {
                    updatedSavedAddresses.push({
                      label: 'Alamat Utama',
                      recipientName: profileFullName,
                      recipientPhone: profilePhone,
                      address: updatedPrimaryAddressText,
                      patokan: profilePatokan || '',
                      mapsUrl: profileGoogleMapsUrl || ''
                    });
                  }
                  setSavedAddresses(updatedSavedAddresses);
                  localStorage.setItem(`tokolitera_addresses_${currentUser.username}`, JSON.stringify(updatedSavedAddresses));

                  setIsEditingProfile(false);
                  customAlert("Profil Anda berhasil diperbarui dan tersinkronisasi!");
                }} className="space-y-4 animate-in slide-in-from-right duration-200">
                  
                  <div className="flex flex-col items-center mb-6 relative w-fit mx-auto">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl font-fill">person</span>
                      </div>
                    )}
                    <label className="absolute bottom-0 -right-2 bg-primary text-white p-1.5 rounded-full cursor-pointer shadow-md hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                      <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={handleProfilePhotoUpload} />
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={profileFullName}
                      onChange={e => setProfileFullName(e.target.value)}
                      required
                      className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Nomor HP Aktif</label>
                    <input 
                      type="tel" 
                      value={profilePhone}
                      onChange={e => setProfilePhone(e.target.value)}
                      required
                      className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Email</label>
                    <input 
                      type="email" 
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      required
                      className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Alamat Lengkap (Jalan/No. Rumah/RT/RW)</label>
                    <textarea 
                      value={profileAddress}
                      onChange={e => setProfileAddress(e.target.value)}
                      placeholder="Contoh: Jl. Diponegoro No. 15, RT 02/RW 05..."
                      rows="2"
                      className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Provinsi</label>
                      <input 
                        type="text" 
                        value={profileProv}
                        onChange={e => setProfileProv(e.target.value)}
                        placeholder="Jawa Barat"
                        className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Kota/Kabupaten</label>
                      <input 
                        type="text" 
                        value={profileCity}
                        onChange={e => setProfileCity(e.target.value)}
                        placeholder="Kota Sukabumi"
                        className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Kecamatan</label>
                      <input 
                        type="text" 
                        value={profileDist}
                        onChange={e => setProfileDist(e.target.value)}
                        placeholder="Cikole"
                        className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Desa/Kelurahan</label>
                      <input 
                        type="text" 
                        value={profileSubDist}
                        onChange={e => setProfileSubDist(e.target.value)}
                        placeholder="Selabatu"
                        className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Detail/Patokan Alamat</label>
                      <input 
                        type="text" 
                        value={profilePatokan}
                        onChange={e => setProfilePatokan(e.target.value)}
                        placeholder="Samping Masjid Al-Ikhlas"
                        className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Kode Pos</label>
                      <input 
                        type="text" 
                        value={profilePostalCode}
                        onChange={e => setProfilePostalCode(e.target.value)}
                        placeholder="43114"
                        className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 w-full text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-teal-200/50 uppercase tracking-wider">Link Google Maps Alamat Anda</label>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        value={profileGoogleMapsUrl}
                        onChange={e => setProfileGoogleMapsUrl(e.target.value)}
                        placeholder="https://maps.google.com/..."
                        className="bg-white/60 dark:bg-black/35 border border-teal-500/10 dark:border-teal-500/20 rounded-xl px-4 py-2.5 flex-1 text-slate-800 dark:text-[#eafaf6] text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => handleGetGpsForProfile(setProfileGoogleMapsUrl)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 min-w-max transition-colors"
                        disabled={gpsLoading}
                      >
                        <span className="material-symbols-outlined text-[16px]">my_location</span>
                        {gpsLoading ? 'Memuat...' : 'Ambil Lokasi'}
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-400 dark:text-teal-200/30 font-semibold mt-1">
                      Gunakan tombol <strong>Ambil Lokasi</strong> atau paste link dari aplikasi Google Maps.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-teal-200/80 bg-slate-100 dark:bg-teal-950/40 rounded-xl hover:bg-slate-200 dark:hover:bg-teal-950/60 transition-all border-0 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs border-0 cursor-pointer shadow-md transition-all"
                    >
                      Simpan Perubahan
                    </button>
                  </div>

                </form>
              )}

              {/* TAB 2: LIKED PRODUCTS (WISHLIST) */}
              {profileTab === 'likes' && (
                <div className="space-y-3">
                  {likedProductIds.length === 0 ? (
                    <div className="text-center py-10 opacity-60">
                      <span className="material-symbols-outlined text-4xl text-rose-500/50">favorite</span>
                      <p className="text-xs font-semibold mt-2">Belum ada produk yang Anda sukai.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {parsedProducts.filter(p => likedProductIds.includes(p.id)).map(p => (
                        <div 
                          key={p.id}
                          onClick={() => {
                            setSelectedProduct(p);
                            setShowProfileModal(false);
                          }}
                          className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-black/25 border border-teal-500/5 hover:border-teal-500/10 rounded-2xl cursor-pointer transition-all"
                        >
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.title} className="w-12 h-12 object-cover rounded-xl border border-teal-500/10 shrink-0" />
                          ) : (
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.bgGradient} flex items-center justify-center shrink-0`}>
                              <span className="material-symbols-outlined text-xl text-teal-800 dark:text-teal-200">{p.imageIcon}</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-[#eafaf6] truncate">{p.title}</h4>
                            <p className="text-[10px] text-primary dark:text-[#4edea3] font-black mt-0.5">{formatPrice(p.price)}</p>
                          </div>
                          <button
                            onClick={(e) => handleToggleLikeProduct(p.id, e)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-teal-950/60 rounded-full border-0 cursor-pointer text-rose-500 shrink-0"
                          >
                            <span className="material-symbols-outlined text-lg font-fill">favorite</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ORDER HISTORY & STATUS STEPS */}
              {profileTab === 'orders' && (
                <div className="space-y-4">
                  {orderHistory.length === 0 ? (
                    <div className="text-center py-10 opacity-60">
                      <span className="material-symbols-outlined text-4xl text-slate-400">receipt_long</span>
                      <p className="text-xs font-semibold mt-2">Belum ada riwayat pesanan Anda.</p>
                    </div>
                  ) : (
                    orderHistory.map(order => (
                      <div key={order.orderId} className="p-4 bg-slate-50 dark:bg-black/20 border border-teal-500/10 rounded-2xl space-y-3 shadow-sm">
                        
                        {/* Order Header */}
                        <div className="flex justify-between items-start gap-2 border-b border-teal-500/5 pb-2">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ID Pesanan</span>
                            <span className="text-xs font-black text-primary dark:text-[#4edea3]">#{order.orderId}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-slate-400 block">{order.date}</span>
                            
                            {/* Dynamic Status Badge */}
                            <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full mt-0.5 uppercase tracking-wide ${
                              order.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#4edea3]' 
                              : order.status === 'Sedang Diantar' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                              : order.status === 'Sedang Dikemas' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300'
                              : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Order Items List */}
                        <div className="space-y-2">
                          {order.items.map(item => {
                            const itemKey = item.productId + (item.variant ? `-${item.variant}` : '');
                            return (
                              <div key={itemKey} className="flex justify-between items-center gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-700 dark:text-[#eafaf6] truncate">
                                    {item.title}{item.variant && <span className="text-[10px] text-slate-400 font-normal"> ({item.variant})</span>}
                                  </p>
                                  <p className="text-[9px] text-slate-400">{item.quantity} x {formatPrice(item.price)}</p>
                                </div>
                              
                              {/* Enforced Completed Review Button */}
                              {order.status === 'Selesai' && (
                                <button
                                  onClick={() => {
    const isReviewed = localReviews.some(r => r.orderCode === order.orderId && r.productTitle === item.title);
    if (isReviewed) {
      customAlert('Kamu sudah mengulas produk ini.');
      return;
    }
    setReviewCode(order.orderId);
    setReviewProductId(item.productId);
    setReviewProductTitle(item.title);
    setReviewName(currentUser.fullName);
    setReviewStars(5);
    setReviewComment('');
    setShowProfileModal(false);
    setShowReviewModal(true);
  }}
                                  className="px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-[#4edea3] rounded-lg border border-teal-500/25 cursor-pointer text-[9px] font-black flex items-center gap-0.5 shrink-0 transition-all"
                                >
                                  <span className="material-symbols-outlined text-[10px] font-fill">grade</span>
                                  Beri Penilaian
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                        {/* Order Summary */}
                        <div className="pt-2 border-t border-dashed border-teal-500/10 flex justify-between items-center text-xs font-extrabold">
                          <span className="text-slate-400 text-[10px]">Total Pembayaran</span>
                          <span className="text-slate-800 dark:text-[#eafaf6]">{formatPrice(order.grandTotal)}</span>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-teal-500/10 bg-slate-50 dark:bg-black/20 flex gap-2">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs border-0 cursor-pointer shadow-md text-center transition-all"
              >
                Kembali ke Toko
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#051411] border border-teal-500/20 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-primary dark:text-[#4edea3]">
              <span className="material-symbols-outlined text-2xl font-bold">info</span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-[#eafaf6] leading-relaxed whitespace-pre-line">
              {alertMessage}
            </p>
            <button
              onClick={() => setAlertMessage('')}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs border-0 cursor-pointer shadow-md transition-all active:scale-[0.98]"
            >
              OK
            </button>
          </div>
        </div>
      )}

    </>
  );
}
