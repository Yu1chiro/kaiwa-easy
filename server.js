require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: 'https://kaiwa-shiyou.vercel.app', // ganti dengan domain frontend kamu
  methods: ['GET', 'POST'],
}));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'CORS Proxy Active', 
    usage: 'GET /tts?url=ENCODED_URL',
    timestamp: new Date().toISOString()
  });
});

app.get('/tts', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'url not found' });
    }

    console.log('Proxying:', decodeURIComponent(targetUrl));
    
    const response = await fetch(decodeURIComponent(targetUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    res.set({
      'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cache-Control': 'public, max-age=3600'
    });

    // Stream audio ke client
    response.body.pipe(res);

  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ 
      error: 'Gagal mengambil audio', 
      details: error.message 
    });
  }
});

app.get('/guide/:category', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'guide.html'));
});

app.post('/api/dialog', async (req, res) => {
    try {
        const { category } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let specificInstructions = '';

switch (category.toLowerCase()) {
    case 'stasiun':
        specificInstructions = `Buatlah dialog yang lengkap dan mengalir secara alami antara turis (T) dan petugas stasiun (K).
Turis sedang berada di stasiun dan ingin membeli tiket kereta.
Mulai dari turis menanyakan lokasi pembelian tiket, menanyakan jadwal kereta, harga tiket, dan cara pembayarannya.
Petugas menggunakan bahasa formal yang sopan (desu/masu).
Pastikan percakapan berlangsung sampai proses pembelian tiket selesai dan turis mengucapkan terima kasih.`;
        break;

    case 'konbini':
        specificInstructions = `Buatlah dialog alami dan menyeluruh antara pelanggan (T) dan pegawai konbini (K) di Jepang.
Fokuskan pada proses membeli beberapa barang seperti makanan ringan, minuman, atau kebutuhan sehari-hari.
Dialog dimulai dari saat pelanggan masuk ke toko, menanyakan produk tertentu, hingga proses pembayaran di kasir.
Pegawai menggunakan bahasa sopan (desu/masu), dan pelanggan juga berbicara sopan.`;
        break;

    case 'ramen':
        specificInstructions = `Buatlah dialog alami dan lengkap antara pelanggan (T) dan pelayan restoran ramen (K).
Pelanggan masuk ke restoran, menanyakan menu, meminta rekomendasi, memesan makanan dan minuman, serta menyelesaikan pembayaran.
Pastikan dialog mengalir dari awal (salam pembuka) sampai pelanggan selesai makan dan keluar dari restoran.
Pelayan menggunakan bahasa sopan (desu/masu), dan pelanggan juga sopan.`;
        break;

    case 'souvenir':
        specificInstructions = `Buatlah dialog yang mengalir dan menyeluruh antara turis (T) dan pegawai toko souvenir (K) di department store.
Mulai dari turis masuk, melihat-lihat barang, menanyakan rekomendasi, menanyakan harga dan stok barang, hingga proses pembayaran.
Gunakan gaya percakapan yang sopan dan alami.
Pegawai menggunakan bahasa sopan (desu/masu), dan turis juga sopan.`;
        break;

    case 'reservasi':
        specificInstructions = `Buatlah dialog yang lengkap dan alami antara turis (T) dan karyawan hotel (K) di Jepang.
Gunakan data dummy untuk nama hotel, misalnya "Hotel Sakura", dan nama karyawan seperti "Tanaka-san".
Mulai dari saat turis datang ke resepsionis untuk melakukan reservasi hotel.
Dialog mencakup pertanyaan tentang ketersediaan kamar, harga, fasilitas hotel, mengisi formulir reservasi, hingga proses pembayaran.
Karyawan hotel harus menggunakan bahasa keigo sesuai standar pelayanan profesional di Jepang.
Turis menggunakan bahasa sopan (desu/masu).
Pastikan percakapan selesai dengan salam penutup.`;
        break;

    case 'kaisha':
        specificInstructions = `Buatlah dialog profesional dan lengkap di lingkungan kantor Jepang antara tamu (T) dan staf perusahaan (K).
Gunakan data dummy untuk nama kantor seperti "Yamamoto Corporation", dan nama staf seperti "Sato-san" atau "Kobayashi-san".
Topik mencakup prosedur pengurusan dokumen perusahaan, meminta izin bertemu direktur, atau bertanya mengenai aturan internal perusahaan.
Staf kantor (K) menggunakan keigo yang tepat sesuai budaya kerja Jepang.
Tamu (T) juga menggunakan keigo dalam konteks komunikasi formal di dunia kerja.
Pastikan dialog memiliki alur yang jelas dari pembukaan, inti pembicaraan, hingga penutup.`;
        break;

    case 'gakkou':
        specificInstructions = `Buatlah dialog alami dan tidak terlalu formal antara guru (Sensei) dan murid (Gakusei) di lingkungan sekolah Jepang.
Fokuskan pada topik terkait tugas sekolah, seperti murid menanyakan tentang isi tugas, cara membuat tugas, tenggat waktu, dan boleh atau tidaknya bekerja sama dengan teman.
Sensei berbicara dengan gaya lembut dan membimbing, tidak kaku atau terlalu formal (tidak perlu keigo berat, cukup sopan).
Gakusei menggunakan gaya sopan seperti desu/masu, dengan nada penasaran atau sedikit bingung layaknya siswa yang ingin memahami instruksi.
Pastikan dialog mengalir secara alami dari awal salam sampai penutup (seperti terima kasih atau pamit).`;
        break;
}

// Prompt akhir untuk Gemini
const prompt = `
Buatkan contoh dialog sederhana berdasarkan kategori "${category}" di Jepang.

${specificInstructions}

Gunakan format berikut untuk setiap percakapan :

K: [Kalimat bahasa jepang kanji]
(Romaji: [pelafalan])
(Arti: [Terjemahan Indonesia])

T: [Kalimat dalam bahasa jepang kanji]
(Romaji: [pelafalan])
(Arti: [Terjemahan Indonesia])

Buat 3–4 percakapan timbal balik singkat.  
Judul dialog: "${category}"
`;


        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Membersihkan respons dari karakter markdown
        const cleanedText = text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
        
        res.json({ 
            dialog: cleanedText,
            category: category 
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate dialog',
            details: error.message 
        });
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});