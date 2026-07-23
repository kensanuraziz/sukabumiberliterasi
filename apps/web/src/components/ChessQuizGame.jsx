import React, { useState, useEffect } from 'react';

// ==========================================================
// LARGE BANK OF QUESTIONS (28 True/False + 16 Short Answer per Game)
// ==========================================================
const GAME_QUESTION_SETS = {
  // GAME 1 (Attempt 0)
  0: {
    trueFalse: [
      { id: 101, category: "Sains", question: "Matahari memutari Bumi dalam waktu 365 hari penuh.", answer: false, explanation: "Salah. Bumi yang memutari Matahari (Revolusi Bumi)." },
      { id: 102, category: "Sains", question: "Es batu akan mencair jika diletakkan di luar ruangan di bawah terik matahari.", answer: true, explanation: "Benar. Suhu panas mencairkan es batu." },
      { id: 103, category: "Digital", question: "Kata sandi boleh dibagikan ke orang asing di internet.", answer: false, explanation: "Salah. Kata sandi harus dijaga kerahasiannya." },
      { id: 104, category: "Digital", question: "Sopan santun di media sosial mencerminkan kepribadian kita.", answer: true, explanation: "Benar. Menjaga ketertiban di internet adalah hal wajib." },
      { id: 105, category: "Numerasi", question: "Jika ada 3 apel dibagi ke 3 anak, masing-masing dapat setengah.", answer: false, explanation: "Salah. Tiap anak mendapat 1 buah apel utuh." },
      { id: 106, category: "Numerasi", question: "Uang Rp 5.000 lebih besar nilainya dari dua lembar Rp 2.000.", answer: true, explanation: "Benar. Dua lembar Rp 2.000 hanya bernilai Rp 4.000." },
      { id: 107, category: "Budaya", question: "Mengikuti upacara bendera adalah salah satu bentuk cinta tanah air.", answer: true, explanation: "Benar. Upacara bendera melatih nasionalisme kita." },
      { id: 108, category: "Budaya", question: "Toleransi berarti menghormati perbedaan agama orang lain.", answer: true, explanation: "Benar. Toleransi menjaga perdamaian bangsa." },
      { id: 109, category: "Finansial", question: "Menabung uang sisa jajan di celengan lebih baik daripada boros.", answer: true, explanation: "Benar. Menabung membantu mempersiapkan masa depan." },
      { id: 110, category: "Finansial", question: "Membeli mainan mahal yang tidak terlalu perlu adalah kebutuhan pokok.", answer: false, explanation: "Salah. Mainan adalah keinginan (sekunder/tersier)." },
      { id: 111, category: "Sains", question: "Air laut rasanya tawar karena terkena air hujan setiap hari.", answer: false, explanation: "Salah. Air laut rasanya asin karena mineral garam dari daratan." },
      { id: 112, category: "Sains", question: "Bumi berbentuk datar seperti piringan besar.", answer: false, explanation: "Salah. Bumi berbentuk bulat/elips." },
      { id: 113, category: "Digital", question: "Membuka link asing di pesan WhatsApp berbahaya bagi HP kita.", answer: true, explanation: "Benar. Link asing bisa mengandung virus." },
      { id: 114, category: "Digital", question: "Kita boleh meniru karya orang lain di internet tanpa izin.", answer: false, explanation: "Salah. Kita harus menghargai hak cipta orang lain." },
      { id: 115, category: "Numerasi", question: "1 jam terdiri dari 60 menit.", answer: true, explanation: "Benar. 1 jam sama dengan 60 menit." },
      { id: 116, category: "Numerasi", question: "Jumlah dari 5 + 5 adalah 11.", answer: false, explanation: "Salah. 5 + 5 sama dengan 10." },
      { id: 117, category: "Budaya", question: "Lagu kebangsaan Indonesia Raya dinyanyikan dengan sikap tegap.", answer: true, explanation: "Benar. Sikap tegap menghormati lagu kebangsaan." },
      { id: 118, category: "Budaya", question: "Batik adalah warisan budaya asli dari Indonesia.", answer: true, explanation: "Benar. Batik diakui dunia sebagai budaya Indonesia." },
      { id: 119, category: "Finansial", question: "Bank adalah tempat yang aman untuk menabung uang dalam jumlah besar.", answer: true, explanation: "Benar. Bank memiliki keamanan terpercaya." },
      { id: 120, category: "Finansial", question: "Kita harus menghabiskan seluruh uang saku kita hari ini juga.", answer: false, explanation: "Salah. Sebagian uang jajan sebaiknya disisihkan untuk tabungan." },
      { id: 121, category: "Sains", question: "Semua hewan bernapas menggunakan paru-paru.", answer: false, explanation: "Salah. Ikan bernapas menggunakan insang." },
      { id: 122, category: "Sains", question: "Pelangi terbentuk karena pembiasan cahaya oleh butiran air hujan.", answer: true, explanation: "Benar. Cahaya matahari dibiaskan oleh tetesan air hujan." },
      { id: 123, category: "Digital", question: "Internet memudahkan kita mencari informasi belajar di sekolah.", answer: true, explanation: "Benar. Internet adalah sumber belajar yang luas." },
      { id: 124, category: "Digital", question: "Semua berita yang ada di internet pasti benar dan asli.", answer: false, explanation: "Salah. Banyak kabar bohong (hoax) di internet." },
      { id: 125, category: "Numerasi", question: "Angka genap selalu habis dibagi 2.", answer: true, explanation: "Benar. Contoh angka genap adalah 2, 4, 6, dan 8." },
      { id: 126, category: "Numerasi", question: "Mengukur panjang meja menggunakan jengkal tangan selalu menghasilkan ukuran yang sama untuk setiap orang.", answer: false, explanation: "Salah. Ukuran jengkal tangan setiap orang berbeda-beda." },
      { id: 127, category: "Budaya", question: "Lambang negara Indonesia adalah Burung Garuda.", answer: true, explanation: "Benar. Garuda Pancasila adalah lambang negara kita." },
      { id: 128, category: "Finansial", question: "Barang bekas yang masih layak bisa didaur ulang untuk menghemat uang.", answer: true, explanation: "Benar. Daur ulang membantu penghematan biaya dan menjaga lingkungan." }
    ],
    shortAnswer: [
      { id: 129, category: "Baca Tulis", question: "Lawan kata atau antonim dari kata 'RAJIN' adalah...", answer: "malas", explanation: "Lawan kata rajin adalah malas." },
      { id: 130, category: "Numerasi", question: "Andi memiliki 5 pensil. Dia memberikan 2 pensil ke adiknya. Sisa pensil Andi sekarang adalah...", answer: "3", explanation: "5 dikurangi 2 adalah 3." },
      { id: 131, category: "Sains", question: "Zat cair yang keluar dari kulit tubuh kita saat kepanasan atau berolahraga disebut...", answer: "keringat", explanation: "Keringat keluar untuk menstabilkan suhu tubuh." },
      { id: 132, category: "Digital", question: "Nama aplikasi kirim pesan berwarna hijau yang paling populer digunakan saat ini adalah...", answer: "whatsapp", explanation: "WhatsApp adalah aplikasi komunikasi pesan instan hijau." },
      { id: 133, category: "Budaya", question: "Lagu kebangsaan negara Republik Indonesia berjudul Indonesia...", answer: "raya", explanation: "Lagu kebangsaan kita adalah Indonesia Raya." },
      { id: 134, category: "Finansial", question: "Tempat resmi yang aman untuk menabung uang dalam jumlah besar adalah...", answer: "bank", explanation: "Bank adalah lembaga keuangan resmi untuk menyimpan uang." },
      { id: 135, category: "Numerasi", question: "Berapakah setengah dari angka 10?", answer: "5", explanation: "10 dibagi 2 adalah 5." },
      { id: 136, category: "Sains", question: "Hewan pemakan tumbuhan seperti sapi dan kambing disebut kelompok...", answer: "herbivora", explanation: "Herbivora adalah pemakan tumbuh-tumbuhan." },
      { id: 137, category: "Digital", question: "Tombol pada keyboard yang digunakan untuk menghapus satu huruf di sebelah kiri kursor adalah...", answer: "backspace", explanation: "Backspace menghapus huruf ke arah kiri." },
      { id: 138, category: "Finansial", question: "Mendapatkan barang dengan menyerahkan uang sebagai alat pembayaran disebut kegiatan...", answer: "membeli", explanation: "Membeli/belanja adalah pertukaran barang dengan uang." },
      { id: 139, category: "Baca Tulis", question: "Buku yang berisi arti dari kosakata bahasa Indonesia disebut Kamus Besar Bahasa...", answer: "indonesia", explanation: "KBBI singkatan dari Kamus Besar Bahasa Indonesia." },
      { id: 140, category: "Numerasi", question: "Jika kamu melangkah maju 3 langkah lalu mundur 2 langkah, kamu berada ... langkah di depan posisi awal.", answer: "1", explanation: "3 dikurangi 2 adalah 1." },
      { id: 141, category: "Sains", question: "Pusat tata surya yang dikelilingi oleh planet-planet adalah...", answer: "matahari", explanation: "Matahari adalah bintang induk tata surya kita." },
      { id: 142, category: "Digital", question: "Alat elektronik genggam untuk menelpon dan mengakses internet secara nirkabel disebut...", answer: "hp", explanation: "Handphone atau biasa disingkat HP." },
      { id: 143, category: "Budaya", question: "Semboyan negara Indonesia adalah Bhinneka Tunggal...", answer: "ika", explanation: "Bhinneka Tunggal Ika artinya berbeda-beda tetapi tetap satu." },
      { id: 144, category: "Finansial", question: "Alat pembayaran yang sah untuk transaksi sehari-hari di negara kita adalah...", answer: "rupiah", explanation: "Rupiah adalah mata uang resmi Indonesia." }
    ]
  },
  // GAME 2 (Attempt 1)
  1: {
    trueFalse: [
      { id: 201, category: "Digital", question: "Berita hoax di internet wajib kita sebarkan ke semua teman.", answer: false, explanation: "Salah. Kita harus menyaring informasi sebelum membagikannya." },
      { id: 202, category: "Budaya", question: "Membantu tetangga tanpa membedakan suku adalah perbuatan terpuji.", answer: true, explanation: "Benar. Sikap saling menolong adalah budaya terpuji Indonesia." },
      { id: 203, category: "Finansial", question: "Membeli barang mewah yang tidak terlalu penting adalah kebutuhan pokok.", answer: false, explanation: "Salah. Itu kebutuhan sekunder atau tersier." },
      { id: 204, category: "Sains", question: "Bumi mengelilingi matahari dalam sistem tata surya kita.", answer: true, explanation: "Benar. Ini disebut dengan peristiwa revolusi bumi." },
      { id: 205, category: "Baca Tulis", question: "Membaca buku di tempat gelap baik untuk kesehatan mata kita.", answer: false, explanation: "Salah. Membaca di tempat redup/gelap bisa merusak mata." },
      { id: 206, category: "Numerasi", question: "1 jam sama dengan 60 menit.", answer: true, explanation: "Benar. Konversi waktu 1 jam adalah 60 menit." },
      { id: 207, category: "Digital", question: "Kita harus sopan berkomentar di media sosial.", answer: true, explanation: "Benar. Sopan santun digital sangat penting." },
      { id: 208, category: "Sains", question: "Air mendidih pada suhu 100 derajat Celcius.", answer: true, explanation: "Benar. Titik didih air murni adalah 100 derajat Celcius." },
      { id: 209, category: "Budaya", question: "Tari kecak adalah tari tradisional yang berasal dari Bali.", answer: true, explanation: "Benar. Tari kecak sangat terkenal dari daerah Bali." },
      { id: 210, category: "Finansial", question: "Membeli jajan berlebihan hingga sisa makanan terbuang adalah tindakan hemat.", answer: false, explanation: "Salah. Membuang makanan adalah tindakan boros." },
      { id: 211, category: "Numerasi", question: "Segitiga memiliki 3 buah sudut di dalamnya.", answer: true, explanation: "Benar. Sesuai namanya, segitiga dibatasi oleh 3 sisi dan 3 sudut." },
      { id: 212, category: "Sains", question: "Kelelawar aktif mencari makanan di siang hari.", answer: false, explanation: "Salah. Kelelawar adalah hewan nokturnal yang aktif mencari makan di malam hari." },
      { id: 213, category: "Digital", question: "Kita boleh mengunggah foto pribadi orang lain tanpa izin di internet.", answer: false, explanation: "Salah. Kita harus menjaga privasi orang lain." },
      { id: 214, category: "Finansial", question: "Uang saku sekolah yang tidak habis sebaiknya disimpan untuk masa depan.", answer: true, explanation: "Benar. Uang simpanan sisa jajan melatih kebiasaan menabung." },
      { id: 215, category: "Budaya", question: "Rumah adat joglo berasal dari daerah Jawa Tengah.", answer: true, explanation: "Benar. Joglo adalah rumah adat khas Jawa Tengah." },
      { id: 216, category: "Sains", question: "Manusia menghirup gas oksigen saat bernapas.", answer: true, explanation: "Benar. Oksigen digunakan sel tubuh untuk membakar energi." },
      { id: 217, category: "Numerasi", question: "Setiap bilangan jika dikalikan angka 0 hasilnya adalah angka itu sendiri.", answer: false, explanation: "Salah. Semua bilangan jika dikalikan 0 hasilnya adalah 0." },
      { id: 218, category: "Digital", question: "E-mail adalah singkatan dari Electronic Mail.", answer: true, explanation: "Benar. E-mail adalah surat elektronik dalam dunia digital." },
      { id: 219, category: "Finansial", question: "Kita bisa membedakan keinginan dan kebutuhan dengan membuat prioritas belanja.", answer: true, explanation: "Benar. Prioritas belanja mengutamakan kebutuhan pokok terlebih dahulu." },
      { id: 220, category: "Budaya", question: "Monas terletak di kota Bandung.", answer: false, explanation: "Salah. Monumen Nasional (Monas) terletak di Jakarta." },
      { id: 221, category: "Sains", question: "Garam dapur diproduksi dari air laut yang dikeringkan.", answer: true, explanation: "Benar. Petani garam menguapkan air laut di tambak." },
      { id: 222, category: "Numerasi", question: "Angka 100 lebih kecil nilainya dari angka 99.", answer: false, explanation: "Salah. 100 nilainya lebih besar dari 99." },
      { id: 223, category: "Digital", question: "Menggunakan internet berlebihan hingga lupa waktu belajar baik untuk anak-anak.", answer: false, explanation: "Salah. Kecanduan internet dapat mengganggu prestasi sekolah." },
      { id: 224, category: "Finansial", question: "Uang kembalian belanja boleh dibuang begitu saja karena receh.", answer: false, explanation: "Salah. Setiap pecahan uang receh tetap berharga dan bisa ditabung." },
      { id: 225, category: "Budaya", question: "Wayang kulit adalah kesenian tradisional daerah.", answer: true, explanation: "Benar. Wayang kulit merupakan kesenian tradisional Jawa." },
      { id: 226, category: "Sains", question: "Matahari terbit dari sebelah barat di pagi hari.", answer: false, explanation: "Salah. Matahari terbit dari sebelah timur." },
      { id: 227, category: "Numerasi", question: "Satu minggu terdiri atas 7 hari.", answer: true, explanation: "Benar. Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu." },
      { id: 228, category: "Digital", question: "Antivirus dipasang di komputer agar aman dari serangan program jahat.", answer: true, explanation: "Benar. Antivirus menjaga sistem operasi dari kerusakan file." }
    ],
    shortAnswer: [
      { id: 229, category: "Budaya", question: "Alat musik bambu tradisional Jawa Barat digoyang adalah...", answer: "angklung", explanation: "Angklung adalah alat musik Sunda legendaris." },
      { id: 230, category: "Finansial", question: "Uang yang disimpan di celengan disebut uang...", answer: "tabungan", explanation: "Uang tabungan disisihkan untuk kebutuhan mendatang." },
      { id: 231, category: "Sains", question: "Planet terdekat dari matahari adalah planet...", answer: "merkurius", explanation: "Merkurius berjarak paling dekat dengan matahari." },
      { id: 232, category: "Baca Tulis", question: "Persamaan kata atau sinonim dari kata 'PINTAR' adalah...", answer: "cerdas", explanation: "Pintar sinonimnya cerdas/pandai." },
      { id: 233, category: "Numerasi", question: "Berapakah hasil dari 4 ditambah 5?", answer: "9", explanation: "4 + 5 = 9." },
      { id: 234, category: "Sains", question: "Hewan yang hidup di air dan di darat seperti katak disebut hewan...", answer: "amfibi", explanation: "Amfibi mampu hidup di dua alam." },
      { id: 235, category: "Digital", question: "Layar monitor komputer berfungsi sebagai alat...", answer: "output", explanation: "Monitor menampilkan gambar keluaran (output)." },
      { id: 236, category: "Finansial", question: "Mata uang resmi negara Indonesia adalah...", answer: "rupiah", explanation: "Rupiah disingkat Rp adalah mata uang resmi kita." },
      { id: 237, category: "Budaya", question: "Nama rumah adat khas Papua yang atapnya bulat jerami adalah...", answer: "honai", explanation: "Honai adalah rumah adat suku Dani di Papua." },
      { id: 238, category: "Baca Tulis", question: "Tanda baca yang diletakkan di akhir kalimat tanya adalah tanda...", answer: "tanya", explanation: "Kalimat tanya selalu diakhiri dengan tanda tanya." },
      { id: 239, category: "Numerasi", question: "Berapakah jumlah jari pada dua tangan manusia normal?", answer: "10", explanation: "Tiap tangan memiliki 5 jari, totalnya 10 jari." },
      { id: 240, category: "Sains", question: "Daun yang mengandung zat hijau daun menggunakan zat tersebut untuk membuat makanan. Nama zat hijau daun adalah...", answer: "klorofil", explanation: "Klorofil sangat krusial dalam fotosintesis." },
      { id: 241, category: "Digital", question: "Kabel yang menghubungkan komputer ke colokan listrik disebut kabel...", answer: "power", explanation: "Kabel power menyalurkan energi listrik." },
      { id: 242, category: "Finansial", question: "Orang yang bekerja melayani transaksi pembayaran di kasir disebut...", answer: "kasir", explanation: "Kasir bertugas menerima uang pembelian di toko." },
      { id: 243, category: "Budaya", question: "Suku asli yang berasal dari daerah DKI Jakarta adalah suku...", answer: "betawi", explanation: "Betawi adalah suku asli ibu kota Jakarta." },
      { id: 244, category: "Numerasi", question: "Hasil dari 3 dikali 3 adalah...", answer: "9", explanation: "Tiga kali tiga sama dengan sembilan." }
    ]
  },
  // GAME 3 (Attempt 2)
  2: {
    trueFalse: [
      { id: 301, category: "Sains", question: "Bintang bersinar karena memantulkan cahaya bulan.", answer: false, explanation: "Salah. Bintang memancarkan cahayanya sendiri." },
      { id: 302, category: "Finansial", question: "Membuat daftar belanja membantu agar tidak boros.", answer: true, explanation: "Benar. Belanja menjadi terarah dan terencana." },
      { id: 303, category: "Baca Tulis", question: "Menulis email adalah bentuk literasi baca tulis modern.", answer: true, explanation: "Benar. Email menggunakan teks digital." },
      { id: 304, category: "Numerasi", question: "Bilangan genap dibagi 2 bersisa 1.", answer: false, explanation: "Salah. Bilangan genap habis dibagi 2." },
      { id: 305, category: "Digital", question: "Boleh unduh aplikasi sembarangan tanpa izin orang tua.", answer: false, explanation: "Salah. Unduhan liar bisa merusak perangkat." },
      { id: 306, category: "Budaya", question: "Pancasila dasar negara Indonesia.", answer: true, explanation: "Benar. Pancasila adalah pedoman dasar negara kita." },
      { id: 307, category: "Sains", question: "Tumbuhan bernapas menggunakan daun dan akar.", answer: true, explanation: "Benar. Stomata pada daun dan lentisel pada akar." },
      { id: 308, category: "Finansial", question: "Investasi emas adalah cara menyimpan kekayaan yang baik.", answer: true, explanation: "Benar. Nilai emas cenderung stabil naik." },
      { id: 309, category: "Digital", question: "Kita boleh menulis kata-kata kasar di kolom komentar YouTube.", answer: false, explanation: "Salah. Kita harus tetap sopan bersosialisasi di dunia maya." },
      { id: 310, category: "Budaya", question: "Reog Ponorogo adalah kesenian khas dari Jawa Timur.", answer: true, explanation: "Benar. Reog berasal dari kabupaten Ponorogo, Jawa Timur." },
      { id: 311, category: "Numerasi", question: "Setengah lingkaran memiliki sudut dalam sebesar 180 derajat.", answer: true, explanation: "Benar. Sudut lingkaran penuh adalah 360 derajat." },
      { id: 312, category: "Sains", question: "Es akan mengapung di atas air murni.", answer: true, explanation: "Benar. Massa jenis es lebih kecil dari air cair." },
      { id: 313, category: "Digital", question: "Mengklik iklan pop-up hadiah gratis aman dilakukan.", answer: false, explanation: "Salah. Iklan palsu seringkali merupakan jebakan penipuan." },
      { id: 314, category: "Finansial", question: "Membeli barang bekas yang masih bagus adalah tindakan boros.", answer: false, explanation: "Salah. Ini tindakan hemat yang mengurangi limbah." },
      { id: 315, category: "Budaya", question: "Rendang adalah kuliner khas dari Padang, Sumatera Barat.", answer: true, explanation: "Benar. Rendang dinobatkan sebagai salah satu makanan terlezat di dunia." },
      { id: 316, category: "Sains", question: "Awan putih di langit terbentuk dari uap air yang mengembun.", answer: true, explanation: "Benar. Siklus air membentuk pengembunan awan." },
      { id: 317, category: "Numerasi", question: "Segi empat memiliki keliling yang dihitung dengan menambah panjang ke-4 sisinya.", answer: true, explanation: "Benar. Keliling didapat dengan menjumlahkan seluruh sisi luar." },
      { id: 318, category: "Digital", question: "Kamera web (webcam) digunakan untuk mengirim gambar video langsung lewat internet.", answer: true, explanation: "Benar. Webcam merekam gambar untuk konferensi video online." },
      { id: 319, category: "Finansial", question: "Meminjamkan uang tanpa batas kemampuan finansial kita adalah tindakan bijak.", answer: false, explanation: "Salah. Kita harus mengukur kemampuan diri sendiri sebelum membantu orang lain." },
      { id: 320, category: "Budaya", question: "Candi Prambanan adalah candi Buddha terbesar di Indonesia.", answer: false, explanation: "Salah. Prambanan adalah candi Hindu. Borobudur yang merupakan candi Buddha terbesar." },
      { id: 321, category: "Sains", question: "Hewan reptil seperti buaya dan ular bertelur untuk berkembang biak.", answer: true, explanation: "Benar. Reptil berkembang biak secara ovipar." },
      { id: 322, category: "Numerasi", question: "Angka 1.000 memiliki jumlah angka nol sebanyak empat buah.", answer: false, explanation: "Salah. Angka 1.000 memiliki tiga buah angka nol." },
      { id: 323, category: "Digital", question: "Menyebarkan foto dokumen rapor sekolah milik teman di medsos boleh dilakukan.", answer: false, explanation: "Salah. Dokumen nilai sekolah adalah privasi yang harus dijaga." },
      { id: 324, category: "Finansial", question: "Belanja menggunakan kartu debit langsung memotong saldo rekening tabungan kita.", answer: true, explanation: "Benar. Kartu debit terhubung ke saldo bank kita." },
      { id: 325, category: "Budaya", question: "Tari piring berasal dari Sumatera Barat.", answer: true, explanation: "Benar. Tari piring merupakan tari khas Minangkabau." },
      { id: 326, category: "Sains", question: "Bulan menghasilkan cahayanya sendiri seperti matahari.", answer: false, explanation: "Salah. Bulan bersinar karena memantulkan cahaya matahari." },
      { id: 327, category: "Numerasi", question: "Persegi panjang memiliki dua pasang sisi yang sama panjang.", answer: true, explanation: "Benar. Sesi berhadapan memiliki ukuran panjang yang sama." },
      { id: 328, category: "Digital", question: "Aplikasi browser digunakan untuk menjelajah internet.", answer: true, explanation: "Benar. Contoh browser adalah Google Chrome, Safari, dan Firefox." }
    ],
    shortAnswer: [
      { id: 329, category: "Numerasi", question: "Hasil penjumlahan dari 7 ditambah 8 adalah...", answer: "15", explanation: "7 + 8 = 15." },
      { id: 330, category: "Sains", question: "Hewan pemakan daging seperti harimau dan singa disebut...", answer: "karnivora", explanation: "Karnivora adalah hewan karnivor pemakan daging." },
      { id: 331, category: "Digital", question: "Alat elektronik genggam layarnya disentuh menelpon disebut...", answer: "hp", explanation: "HP/handphone merupakan telepon genggam pintar." },
      { id: 332, category: "Baca Tulis", question: "Lawan kata atau antonim dari kata 'SEDAT' atau 'CEPAT' adalah...", answer: "lambat", explanation: "Lawan kata cepat adalah lambat." },
      { id: 333, category: "Numerasi", question: "Berapakah hasil dari 2 dikali 5?", answer: "10", explanation: "Dua kali lima sama dengan sepuluh." },
      { id: 334, category: "Sains", question: "Benda langit yang mengelilingi matahari dan memiliki orbit elips disebut...", answer: "planet", explanation: "Planet berputar mengitari bintang induknya." },
      { id: 335, category: "Digital", question: "Perangkat keras komputer untuk mengetik huruf adalah...", answer: "keyboard", explanation: "Keyboard adalah papan ketik komputer." },
      { id: 336, category: "Finansial", question: "Menyisihkan sebagian pendapatan untuk disimpan di masa depan disebut...", answer: "menabung", explanation: "Menabung adalah kunci hidup hemat." },
      { id: 337, category: "Budaya", question: "Pahlawan nasional wanita yang berasal dari Jepara adalah Kartini. Apa nama depannya?", answer: "raden ajeng", explanation: "R.A. Kartini terkenal dengan perjuangan emansipasi wanita." },
      { id: 338, category: "Baca Tulis", question: "Tanda baca yang digunakan untuk mengakhiri kalimat berita adalah tanda...", answer: "titik", explanation: "Titik diletakkan di akhir kalimat berita." },
      { id: 339, category: "Numerasi", question: "Jika kamu membeli barang seharga Rp 3.000 dengan uang Rp 5.000, berapa rupiah uang kembalianmu?", answer: "2000", explanation: "5.000 dikurangi 3.000 adalah 2.000." },
      { id: 340, category: "Sains", question: "Tumbuhan hijau menghasilkan makanannya sendiri melalui proses...", answer: "fotosintesis", explanation: "Fotosintesis menghasilkan zat gula dan oksigen." },
      { id: 341, category: "Digital", question: "Aplikasi kirim surat digital disebut...", answer: "email", explanation: "Email adalah singkatan dari electronic mail." },
      { id: 342, category: "Finansial", question: "Pemberian dana dari orang tua kepada anak secara berkala untuk jajan disebut uang...", answer: "saku", explanation: "Biasa juga disebut dengan uang jajan." },
      { id: 343, category: "Budaya", question: "Makanan khas daerah Yogyakarta yang terbuat dari nangka muda adalah...", answer: "gudeg", explanation: "Gudeg adalah makanan manis gurih khas Jogja." },
      { id: 344, category: "Numerasi", question: "Berapakah jumlah sudut pada bangun datar persegi?", answer: "4", explanation: "Persegi memiliki 4 titik sudut siku-siku." }
    ]
  }
};

// ==========================================
// 2. POSISI AWAL BIDAK CATUR 4 ORANG (14x14)
// ==========================================
const initialBidakSetup = [
  // --- PLAYER 1 (Putih - Bottom) ---
  { id: 'p1-r1', player: 1, type: 'Benteng', row: 13, col: 3, label: '♜' },
  { id: 'p1-n1', player: 1, type: 'Kuda', row: 13, col: 4, label: '♞' },
  { id: 'p1-b1', player: 1, type: 'Gajah', row: 13, col: 5, label: '♝' },
  { id: 'p1-q', player: 1, type: 'Ratu', row: 13, col: 6, label: '♛' },
  { id: 'p1-k', player: 1, type: 'Raja', row: 13, col: 7, label: '♚' },
  { id: 'p1-b2', player: 1, type: 'Gajah', row: 13, col: 8, label: '♝' },
  { id: 'p1-n2', player: 1, type: 'Kuda', row: 13, col: 9, label: '♞' },
  { id: 'p1-r2', player: 1, type: 'Benteng', row: 13, col: 10, label: '♜' },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `p1-p${i}`, player: 1, type: 'Pion', row: 12, col: 3 + i, label: '♟'
  })),

  // --- PLAYER 2 (Biru - Left) ---
  { id: 'p2-r1', player: 2, type: 'Benteng', row: 3, col: 0, label: '♜' },
  { id: 'p2-n1', player: 2, type: 'Kuda', row: 4, col: 0, label: '♞' },
  { id: 'p2-b1', player: 2, type: 'Gajah', row: 5, col: 0, label: '♝' },
  { id: 'p2-k', player: 2, type: 'Raja', row: 6, col: 0, label: '♚' },
  { id: 'p2-q', player: 2, type: 'Ratu', row: 7, col: 0, label: '♛' },
  { id: 'p2-b2', player: 2, type: 'Gajah', row: 8, col: 0, label: '♝' },
  { id: 'p2-n2', player: 2, type: 'Kuda', row: 9, col: 0, label: '♞' },
  { id: 'p2-r2', player: 2, type: 'Benteng', row: 10, col: 0, label: '♜' },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `p2-p${i}`, player: 2, type: 'Pion', row: 3 + i, col: 1, label: '♟'
  })),

  // --- PLAYER 3 (Hijau - Top) ---
  { id: 'p3-r1', player: 3, type: 'Benteng', row: 0, col: 3, label: '♜' },
  { id: 'p3-n1', player: 3, type: 'Kuda', row: 0, col: 4, label: '♞' },
  { id: 'p3-b1', player: 3, type: 'Gajah', row: 0, col: 5, label: '♝' },
  { id: 'p3-k', player: 3, type: 'Raja', row: 0, col: 6, label: '♚' },
  { id: 'p3-q', player: 3, type: 'Ratu', row: 0, col: 7, label: '♛' },
  { id: 'p3-b2', player: 3, type: 'Gajah', row: 0, col: 8, label: '♝' },
  { id: 'p3-n2', player: 3, type: 'Kuda', row: 0, col: 9, label: '♞' },
  { id: 'p3-r2', player: 3, type: 'Benteng', row: 0, col: 10, label: '♜' },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `p3-p${i}`, player: 3, type: 'Pion', row: 1, col: 3 + i, label: '♟'
  })),

  // --- PLAYER 4 (Merah - Right) ---
  { id: 'p4-r1', player: 4, type: 'Benteng', row: 3, col: 13, label: '♜' },
  { id: 'p4-n1', player: 4, type: 'Kuda', row: 4, col: 13, label: '♞' },
  { id: 'p4-b1', player: 4, type: 'Gajah', row: 5, col: 13, label: '♝' },
  { id: 'p4-q', player: 4, type: 'Ratu', row: 6, col: 13, label: '♛' },
  { id: 'p4-k', player: 4, type: 'Raja', row: 7, col: 13, label: '♚' },
  { id: 'p4-b2', player: 4, type: 'Gajah', row: 8, col: 13, label: '♝' },
  { id: 'p4-n2', player: 4, type: 'Kuda', row: 9, col: 13, label: '♞' },
  { id: 'p4-r2', player: 4, type: 'Benteng', row: 10, col: 13, label: '♜' },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `p4-p${i}`, player: 4, type: 'Pion', row: 3 + i, col: 12, label: '♟'
  }))
];

export default function ChessQuizGame() {
  const [playCount, setPlayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfig, setShowConfig] = useState(false); // New Cover State
  const [difficulty, setDifficulty] = useState('mudah'); // New Difficulty State
  const [pieces, setPieces] = useState(initialBidakSetup);
  const [activePlayer, setActivePlayer] = useState(1); // 1 to 4
  const [playerTypes, setPlayerTypes] = useState(['human', 'bot', 'bot', 'bot']);
  const [totalStepCount, setTotalStepCount] = useState(0);
  const [roundCount, setRoundCount] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState('');

  // Selected piece & valid moves
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  // Question States
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null); // for True/False
  const [typedAnswer, setTypedAnswer] = useState(''); // for short answer
  const [quizMoveData, setQuizMoveData] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null); // 'correct' or 'wrong'
  const [usedQuestionIds, setUsedQuestionIds] = useState([]); // Track used questions to prevent repetition

  // Score metrics
  const [scoreTrueFalse, setScoreTrueFalse] = useState(0);
  const [scoreShortAnswer, setScoreShortAnswer] = useState(0);

  useEffect(() => {
    const savedCount = parseInt(localStorage.getItem('chess_quiz_plays') || '0', 10);
    setPlayCount(savedCount);
  }, []);

  useEffect(() => {
    const calculatedRound = Math.floor(totalStepCount / 4) + 1;
    setRoundCount(calculatedRound);
  }, [totalStepCount]);

  // Bot move triggers
  useEffect(() => {
    if (!isPlaying || isGameOver || showQuiz) return;

    const currentController = playerTypes[activePlayer - 1];
    if (currentController === 'bot') {
      const timer = setTimeout(() => {
        makeBotMove();
      }, 700);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, activePlayer, pieces, isGameOver, showQuiz]);

  const handleStartGame = () => {
    if (playCount >= 3) return;

    setIsPlaying(true);
    setTotalStepCount(0);
    setActivePlayer(1);
    setIsGameOver(false);
    setGameResult('');
    setSelectedPiece(null);
    setValidMoves([]);
    setShowQuiz(false);
    setPieces(initialBidakSetup);
    setScoreTrueFalse(0);
    setScoreShortAnswer(0);
    setTypedAnswer('');
    setQuizFeedback(null);
    setUsedQuestionIds([]);
  };

  const isPlayableSquare = (r, c) => {
    if (r < 0 || r > 13 || c < 0 || c > 13) return false;
    if (r < 3 && c < 3) return false;
    if (r < 3 && c > 10) return false;
    if (r > 10 && c < 3) return false;
    if (r > 10 && c > 10) return false;
    return true;
  };

  const calculateValidMoves = (piece) => {
    const moves = [];
    const directions = {
      Raja: [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1]
      ],
      Kuda: [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ],
      Benteng: [
        [-1, 0], [1, 0], [0, -1], [0, 1]
      ],
      Gajah: [
        [-1, -1], [-1, 1], [1, -1], [1, 1]
      ],
      Ratu: [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1]
      ]
    };

    if (piece.type === 'Pion') {
      let dirRow = 0;
      let dirCol = 0;
      let startRow = -1;
      let startCol = -1;

      if (piece.player === 1) { dirRow = -1; startRow = 12; }
      else if (piece.player === 2) { dirCol = 1; startCol = 1; }
      else if (piece.player === 3) { dirRow = 1; startRow = 1; }
      else if (piece.player === 4) { dirCol = -1; startCol = 12; }

      // Forward 1
      const f1Row = piece.row + dirRow;
      const f1Col = piece.col + dirCol;
      if (isPlayableSquare(f1Row, f1Col) && !pieces.find(p => p.row === f1Row && p.col === f1Col)) {
        moves.push({ row: f1Row, col: f1Col });

        // Forward 2
        const f2Row = f1Row + dirRow;
        const f2Col = f1Col + dirCol;
        if ((piece.row === startRow || piece.col === startCol) && isPlayableSquare(f2Row, f2Col) && !pieces.find(p => p.row === f2Row && p.col === f2Col)) {
          moves.push({ row: f2Row, col: f2Col });
        }
      }

      // Capture diagonals
      const diagonals = piece.player === 1 || piece.player === 3
        ? [[dirRow, -1], [dirRow, 1]]
        : [[-1, dirCol], [1, dirCol]];

      diagonals.forEach(([dr, dc]) => {
        const targetRow = piece.row + dr;
        const targetCol = piece.col + dc;
        if (isPlayableSquare(targetRow, targetCol)) {
          const target = pieces.find(p => p.row === targetRow && p.col === targetCol);
          if (target && target.player !== piece.player) {
            moves.push({ row: targetRow, col: targetCol });
          }
        }
      });

    } else if (piece.type === 'Kuda' || piece.type === 'Raja') {
      directions[piece.type].forEach(([dr, dc]) => {
        const targetRow = piece.row + dr;
        const targetCol = piece.col + dc;
        if (isPlayableSquare(targetRow, targetCol)) {
          const target = pieces.find(p => p.row === targetRow && p.col === targetCol);
          if (!target || target.player !== piece.player) {
            moves.push({ row: targetRow, col: targetCol });
          }
        }
      });
    } else {
      directions[piece.type].forEach(([dr, dc]) => {
        let step = 1;
        while (true) {
          const targetRow = piece.row + dr * step;
          const targetCol = piece.col + dc * step;
          if (!isPlayableSquare(targetRow, targetCol)) break;

          const target = pieces.find(p => p.row === targetRow && p.col === targetCol);
          if (!target) {
            moves.push({ row: targetRow, col: targetCol });
          } else {
            if (target.player !== piece.player) {
              moves.push({ row: targetRow, col: targetCol });
            }
            break;
          }
          step++;
        }
      });
    }

    return moves;
  };

  const handleSelectPiece = (piece) => {
    if (playerTypes[activePlayer - 1] !== 'human') return;
    if (piece.player !== activePlayer) return;

    setSelectedPiece(piece);
    setValidMoves(calculateValidMoves(piece));
  };

  const executeMove = (pieceId, targetRow, targetCol) => {
    const targetPiece = pieces.find(p => p.row === targetRow && p.col === targetCol);
    const updated = pieces
      .filter(p => p.row !== targetRow || p.col !== targetCol || p.id === pieceId)
      .map(p => p.id === pieceId ? { ...p, row: targetRow, col: targetCol } : p);

    setPieces(updated);
    setSelectedPiece(null);
    setValidMoves([]);

    if (targetPiece && targetPiece.type === 'Raja') {
      setIsGameOver(true);
      setGameResult(`Pemain ${activePlayer} Menang dengan menangkap Raja!`);
      const newPlays = playCount + 1;
      setPlayCount(newPlays);
      localStorage.setItem('chess_quiz_plays', newPlays.toString());
      return;
    }

    // Next turn
    const nextPlayer = (activePlayer % 4) + 1;
    setActivePlayer(nextPlayer);
    setTotalStepCount(prev => prev + 1);
  };

  const handleSquareClick = (r, c) => {
    if (!selectedPiece) return;

    const isValid = validMoves.some(m => m.row === r && m.col === c);
    if (!isValid) return;

    // Get current play set (fallback to Set A if index out of bounds)
    const currentSet = GAME_QUESTION_SETS[playCount] || GAME_QUESTION_SETS[0];

    // Putaran 6-12 (7 Putaran): Benar/Salah
    if (roundCount >= 6 && roundCount <= 12) {
      setQuizMoveData({ pieceId: selectedPiece.id, targetRow: r, targetCol: c });
      setTypedAnswer('');
      setSelectedOption(null);
      setQuizFeedback(null);

      const available = currentSet.trueFalse.filter(q => !usedQuestionIds.includes(q.id));
      const selected = available.length > 0 
        ? available[Math.floor(Math.random() * available.length)] 
        : currentSet.trueFalse[(roundCount - 6) % currentSet.trueFalse.length];
      
      setCurrentQuestion(selected);
      setShowQuiz(true);
    } 
    // Putaran 13-16 (4 Putaran): Jawaban Singkat
    else if (roundCount >= 13 && roundCount <= 16) {
      setQuizMoveData({ pieceId: selectedPiece.id, targetRow: r, targetCol: c });
      setTypedAnswer('');
      setSelectedOption(null);
      setQuizFeedback(null);

      const available = currentSet.shortAnswer.filter(q => !usedQuestionIds.includes(q.id));
      const selected = available.length > 0 
        ? available[Math.floor(Math.random() * available.length)] 
        : currentSet.shortAnswer[(roundCount - 13) % currentSet.shortAnswer.length];
      
      setCurrentQuestion(selected);
      setShowQuiz(true);
    } 
    else {
      // Putaran 1-5 & Putaran 17+: Langsung melangkah tanpa soal
      executeMove(selectedPiece.id, r, c);
    }
  };

  const handleTrueFalseAnswer = (answerValue) => {
    setSelectedOption(answerValue);
    const correct = answerValue === currentQuestion.answer;
    setQuizFeedback(correct ? 'correct' : 'wrong');
    if (correct) {
      setScoreTrueFalse(prev => prev + 1);
    }
  };

  const handleShortAnswerSubmit = () => {
    const cleanAnswer = typedAnswer.trim().toLowerCase();
    const correct = cleanAnswer === currentQuestion.answer.toLowerCase();
    setQuizFeedback(correct ? 'correct' : 'wrong');
    if (correct) {
      setScoreShortAnswer(prev => prev + 1);
    }
  };

  const handleQuizConfirm = () => {
    const isCorrect = quizFeedback === 'correct';
    setShowQuiz(false);

    if (currentQuestion) {
      setUsedQuestionIds(prev => [...prev, currentQuestion.id]);
    }

    if (isCorrect) {
      executeMove(quizMoveData.pieceId, quizMoveData.targetRow, quizMoveData.targetCol);
    } else {
      // Skip turn
      setSelectedPiece(null);
      setValidMoves([]);
      const nextPlayer = (activePlayer % 4) + 1;
      setActivePlayer(nextPlayer);
      setTotalStepCount(prev => prev + 1);
    }
    setQuizMoveData(null);
  };

  const makeBotMove = () => {
    const botPieces = pieces.filter(p => p.player === activePlayer);
    const playableMoves = [];

    botPieces.forEach(p => {
      const moves = calculateValidMoves(p);
      moves.forEach(m => {
        playableMoves.push({ piece: p, move: m });
      });
    });

    if (playableMoves.length > 0) {
      // Find capture moves
      const captureMoves = playableMoves.filter(pm => {
        const target = pieces.find(p => p.row === pm.move.row && p.col === pm.move.col);
        return target && target.player !== activePlayer;
      });

      // King capture priority
      const kingCapture = playableMoves.find(pm => {
        const target = pieces.find(p => p.row === pm.move.row && p.col === pm.move.col);
        return target && target.type === 'Raja';
      });

      let selected = null;
      if (kingCapture) {
        selected = kingCapture;
      } else if (difficulty === 'sulit' && captureMoves.length > 0 && Math.random() < 0.9) {
        selected = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      } else if (difficulty === 'cukup sulit' && captureMoves.length > 0 && Math.random() < 0.5) {
        selected = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      } else {
        selected = playableMoves[Math.floor(Math.random() * playableMoves.length)];
      }

      executeMove(selected.piece.id, selected.move.row, selected.move.col);
    } else {
      const nextPlayer = (activePlayer % 4) + 1;
      setActivePlayer(nextPlayer);
      setTotalStepCount(prev => prev + 1);
    }
  };

  if (playCount >= 3 && !isPlaying) {
    return (
      <div className="bg-gradient-to-br from-amber-500/10 to-teal-500/10 border border-teal-500/20 rounded-[2.2rem] p-6 text-center space-y-4 animate-in fade-in">
        <img 
          src="/c3-logo.png" 
          alt="C3 Logo" 
          className="w-24 h-24 object-contain mx-auto" 
        />
        <h3 className="text-xl font-bold text-slate-800 dark:text-[#eafaf6]">Batas Uji Coba Gratis Habis</h3>
        <p className="text-xs text-slate-600 dark:text-teal-200/85 leading-relaxed max-w-sm mx-auto">
          Anda telah mencoba sebanyak 3 kali permainan gratis. 
          Silakan beli versi lengkap aplikasi kami untuk menikmati fitur premium:
        </p>
        <ul className="text-left text-xs space-y-1.5 max-w-xs mx-auto text-slate-700 dark:text-teal-200/90 list-disc list-inside bg-white/40 dark:bg-black/20 p-3.5 rounded-xl border border-teal-500/10">
          <li>Bermain sepuasnya tanpa batas berkali-kali.</li>
          <li>Bebas request & sesuaikan tema soal kuis sepuasnya.</li>
          <li>Mendukung permainan untuk <b>2, 3, 4, bahkan 5 orang sekaligus</b>!</li>
        </ul>
        <p className="text-[11px] font-semibold text-primary dark:text-inverse-primary">
          Pembelian dapat dilakukan melalui link di bio Instagram kami.
        </p>
        <a 
          href="https://instagram.com/catur3dimensi" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-lg transition-all hover:scale-105 w-full"
        >
          <span>Hubungi Bio Instagram @catur3dimensi</span>
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </a>

        {/* Reset button visible only on localhost for testing */}
        {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
          <button 
            onClick={() => {
              localStorage.removeItem('chess_quiz_plays');
              setPlayCount(0);
            }}
            className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-bold text-xs transition-all shadow-md"
          >
            Reset Batas Uji Coba (Dev Mode Only)
          </button>
        )}
      </div>
    );
  }

  const playerColors = ['Putih', 'Biru', 'Hijau', 'Merah'];

  return (
    <div className="bg-white/60 dark:bg-black/25 backdrop-blur-md border border-teal-500/10 dark:border-teal-500/20 rounded-[2.2rem] p-4 md:p-5 space-y-4 animate-in fade-in">
      
      {/* 1. COVER SCREEN (State: Not playing & Config is closed) */}
      {!isPlaying && !showConfig ? (
        <div className="bg-[#23211f] text-white rounded-3xl p-5 text-center flex flex-col items-center justify-center space-y-5 shadow-2xl relative overflow-hidden select-none border border-[#3e3935]">
          <h2 className="text-sm md:text-base font-extrabold tracking-widest text-[#f0e7d5] font-title uppercase">
            Catur Cerdas Cermat
          </h2>

          {/* Mini CSS board visualization replicating the board layout */}
          <div className="w-[160px] h-[160px] grid grid-cols-6 gap-0.5 bg-[#4a423b] p-1.5 rounded-xl shadow-lg border border-[#6b5c53]">
            {Array.from({ length: 36 }).map((_, i) => {
              const r = Math.floor(i / 6);
              const c = i % 6;
              const isCorner = (r < 1 && c < 1) || (r < 1 && c > 4) || (r > 4 && c < 1) || (r > 4 && c > 4);
              const isDark = (r + c) % 2 === 1;
              return (
                <div 
                  key={i} 
                  className={`w-full aspect-square flex items-center justify-center text-[10px] rounded-sm ${
                    isCorner 
                      ? 'bg-transparent' 
                      : isDark ? 'bg-[#5c4a3c] text-amber-200' : 'bg-[#e5d5c5] text-amber-900'
                  }`}
                >
                  {!isCorner && i === 8 && '♞\uFE0E'}
                  {!isCorner && i === 15 && '♟\uFE0E'}
                  {!isCorner && i === 20 && '♜\uFE0E'}
                  {!isCorner && i === 27 && '♚\uFE0E'}
                </div>
              );
            })}
          </div>

          <div className="space-y-3 w-full">
            <h3 className="text-xs md:text-sm font-bold tracking-widest text-[#f5ecd7]">
              UJI COBA GRATIS
            </h3>
            
            <button 
              onClick={() => setShowConfig(true)}
              className="w-full max-w-[260px] bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 hover:from-orange-600 hover:to-red-600 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs tracking-wider uppercase shadow-[0_4px_15px_rgba(239,68,68,0.4)] transition-all hover:scale-105 flex items-center justify-center gap-1.5 mx-auto border-b-2 border-red-700"
            >
              <span>Ayo Mainkan!</span>
              <span className="material-symbols-outlined text-xs animate-bounce">grade</span>
            </button>
          </div>
        </div>
      ) : !isPlaying && showConfig ? (
        // 2. CONFIGURATION SCREEN
        <div className="space-y-4 py-2">
          <div className="flex justify-between items-center border-b border-teal-500/10 pb-3">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-[#eafaf6]">
              Pengaturan Permainan Catur
            </h3>
            <button 
              onClick={() => setShowConfig(false)}
              className="text-xs font-semibold text-slate-500 hover:text-primary"
            >
              Kembali
            </button>
          </div>

          {/* Difficulty Level Option */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-teal-200/70 uppercase">
              Tingkat Kesulitan AI:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['mudah', 'cukup sulit', 'sulit'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`py-2 rounded-xl text-[10px] font-extrabold uppercase transition-all border ${
                    difficulty === lvl 
                      ? 'bg-primary border-primary text-white shadow-md' 
                      : 'bg-white dark:bg-zinc-900 border-slate-200 text-slate-600 dark:text-teal-200/60'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-teal-200/70 uppercase">
              Konfigurasi Kontrol Pemain:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {playerColors.map((color, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-slate-100/50 dark:bg-black/20 rounded-xl">
                  <span className="font-semibold">{color}</span>
                  <select 
                    value={playerTypes[idx]}
                    onChange={(e) => {
                      const copy = [...playerTypes];
                      copy[idx] = e.target.value;
                      setPlayerTypes(copy);
                    }}
                    className="bg-white dark:bg-zinc-900 text-[10px] p-1 rounded border border-slate-200 outline-none"
                  >
                    <option value="human">Manusia</option>
                    <option value="bot">Bot/AI</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center space-y-3 pt-2">
            <p className="text-xs text-slate-600 dark:text-teal-200/80 leading-relaxed">
              Aturan: **5 putaran awal & putaran 17+ bebas melangkah**. Putaran 6-12 (Benar/Salah) & Putaran 13-16 (Isian Singkat) wajib menjawab kuis!
            </p>
            <button 
              onClick={handleStartGame}
              className="bg-primary text-white px-5 py-3.5 rounded-xl font-bold text-xs hover:scale-105 transition-all shadow-md w-full"
            >
              Mulai Permainan
            </button>
          </div>
        </div>
      ) : isGameOver ? (
        // 3. GAME OVER SCREEN
        <div className="text-center space-y-4 py-4 animate-in fade-in">
          <span className="text-5xl">🏆</span>
          <h4 className="text-lg font-bold text-slate-800 dark:text-[#eafaf6]">{gameResult}</h4>
          
          <div className="bg-primary/5 dark:bg-teal-950/20 p-4 rounded-2xl border border-teal-500/10 space-y-3 max-w-sm mx-auto text-left text-xs">
            <h5 className="font-extrabold text-slate-700 dark:text-[#eafaf6] border-b pb-1.5 mb-1.5 uppercase tracking-wider text-[10px]">
              Laporan Evaluasi Belajar Catur
            </h5>
            <p><strong>Benar/Salah (Putaran 6-12):</strong> {scoreTrueFalse} / 7 Soal</p>
            <p><strong>Isian Singkat (Putaran 13-16):</strong> {scoreShortAnswer} / 4 Soal</p>
            
            <div className="border-t border-teal-500/10 pt-2.5 mt-2">
              <span className="font-bold text-[10px] text-primary dark:text-inverse-primary block mb-1">
                INGIN BERMAIN TANPA BATAS?
              </span>
              <p className="text-[10px] text-slate-600 dark:text-teal-200/70 leading-relaxed">
                Beli aplikasi lengkap untuk bermain berkali-kali tanpa batas, request soal kuis sepuasnya, serta dukungan main 2, 3, 4, hingga 5 orang sekaligus!
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-center w-full max-w-sm mx-auto">
            <button 
              onClick={() => {
                setIsPlaying(false);
                setShowConfig(false); // Back to cover banner
              }}
              className="flex-1 bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-[#eafaf6] py-3 rounded-xl font-bold text-xs transition-all"
            >
              Menu Utama
            </button>
            <a 
              href="https://instagram.com/catur3dimensi" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-xs transition-all hover:scale-105 text-center flex items-center justify-center gap-1"
            >
              <span>Beli Aplikasi</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>
          </div>
        </div>
      ) : showQuiz ? (
        // 4. QUIZ DISPLAY SCREEN
        <div className="bg-slate-100/80 dark:bg-black/35 p-4 rounded-2xl border border-teal-500/10 space-y-3 animate-in fade-in">
          <div className="flex justify-between items-center text-[9px] font-black text-slate-500">
            <span className="bg-primary/10 text-primary dark:text-inverse-primary px-2 py-0.5 rounded">
              {currentQuestion.category}
            </span>
            <span>PUTARAN {roundCount}</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-[#eafaf6] font-bold leading-relaxed">
            {currentQuestion.question}
          </p>

          {/* Render Form depends on round type */}
          {roundCount <= 12 ? (
            // True / False (Round 6-12)
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button 
                disabled={quizFeedback !== null}
                onClick={() => handleTrueFalseAnswer(true)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedOption === true ? 'bg-teal-600 text-white' : 'bg-white dark:bg-zinc-900 border border-slate-200 text-slate-800 dark:text-white'
                }`}
              >
                Benar
              </button>
              <button 
                disabled={quizFeedback !== null}
                onClick={() => handleTrueFalseAnswer(false)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedOption === false ? 'bg-red-600 text-white' : 'bg-white dark:bg-zinc-900 border border-slate-200 text-slate-800 dark:text-white'
                }`}
              >
                Salah
              </button>
            </div>
          ) : (
            // Short Answer (Round 13-16)
            <div className="space-y-2 pt-1">
              <input 
                type="text"
                disabled={quizFeedback !== null}
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Ketik jawaban di sini (huruf kecil)..."
                className="w-full text-xs bg-white dark:bg-zinc-950 border border-teal-500/20 p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
              />
              {quizFeedback === null && (
                <button
                  onClick={handleShortAnswerSubmit}
                  className="w-full bg-primary text-white py-2 rounded-xl text-xs font-bold"
                >
                  Kirim Jawaban
                </button>
              )}
            </div>
          )}

          {quizFeedback && (
            <div className="pt-2 animate-in fade-in space-y-3 border-t border-teal-500/10">
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-base ${quizFeedback === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {quizFeedback === 'correct' ? 'check_circle' : 'cancel'}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wide">
                  {quizFeedback === 'correct' ? 'Jawaban Benar!' : 'Jawaban Salah (Langkah Dilewat!)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-teal-200/60 leading-relaxed">
                {currentQuestion.explanation}
              </p>
              <button
                onClick={handleQuizConfirm}
                className="w-full bg-slate-800 dark:bg-teal-950 text-white py-2 rounded-xl text-xs font-bold"
              >
                Lanjutkan
              </button>
            </div>
          )}
        </div>
      ) : (
        // 5. ACTIVE CHESS BOARD PLAY SCREEN
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold">Putaran ke: <strong className="text-primary">{roundCount}</strong></span>
            <span className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-full ${
                activePlayer === 1 ? 'bg-white border border-slate-400 animate-pulse' :
                activePlayer === 2 ? 'bg-cyan-400' :
                activePlayer === 3 ? 'bg-emerald-400' : 'bg-red-400'
              }`}></span>
              Giliran: <strong>{playerColors[activePlayer - 1]}</strong> ({playerTypes[activePlayer - 1] === 'bot' ? 'AI' : 'Manusia'})
            </span>
          </div>

          {/* 14x14 cross board representation */}
          <div 
            style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
            className="grid gap-0.5 max-w-[340px] mx-auto bg-slate-200 dark:bg-zinc-800 p-1 rounded-xl shadow-inner select-none overflow-x-auto"
          >
            {Array.from({ length: 14 }).map((_, r) =>
              Array.from({ length: 14 }).map((_, c) => {
                const playable = isPlayableSquare(r, c);
                const isDark = (r + c) % 2 === 1;
                const piece = pieces.find(p => p.row === r && p.col === c);
                const isSelected = selectedPiece && selectedPiece.row === r && selectedPiece.col === c;
                const isValid = validMoves.some(m => m.row === r && m.col === c);

                let colorClass = !playable 
                  ? 'bg-transparent' 
                  : isDark 
                    ? 'bg-teal-800/80 dark:bg-[#071f1a]' 
                    : 'bg-teal-50/90 dark:bg-[#113a30]';

                if (isSelected) colorClass = 'bg-yellow-400/80 dark:bg-yellow-600/80';
                else if (isValid) colorClass = 'bg-emerald-400/85 dark:bg-emerald-600/85 cursor-pointer scale-95';

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => {
                      if (playable) {
                        if (isValid) handleSquareClick(r, c);
                        else if (piece) handleSelectPiece(piece);
                      }
                    }}
                    className={`aspect-square flex items-center justify-center text-[10px] rounded-sm transition-all ${colorClass} ${playable && piece && piece.player === activePlayer ? 'cursor-pointer' : ''}`}
                  >
                    {playable && piece && (
                      <span className={`text-base font-bold leading-none select-none ${
                        piece.player === 1 ? 'text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]' :
                        piece.player === 2 ? 'text-cyan-300' :
                        piece.player === 3 ? 'text-emerald-300' : 'text-red-400'
                      }`}>
                        {piece.label + '\uFE0E'}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-teal-200/50">
            <span>*Pilih bidak & petak hijau untuk melangkah</span>
            {roundCount < 6 ? (
              <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-extrabold uppercase">
                Bebas Melangkah
              </span>
            ) : roundCount <= 12 ? (
              <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-extrabold uppercase animate-pulse">
                Kuis B/S (7 Putaran)
              </span>
            ) : roundCount <= 16 ? (
              <span className="bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full font-extrabold uppercase animate-pulse">
                Kuis Isian (4 Putaran)
              </span>
            ) : (
              <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-extrabold uppercase">
                Bebas Melangkah (17+)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
