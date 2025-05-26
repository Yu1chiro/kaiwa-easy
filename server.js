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
    usage: 'GET /tts?url=ENCODED_URL' 
  });
});

// Proxy endpoint untuk ResponsiveVoice
app.get('/tts', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'Parameter url diperlukan' });
    }

    console.log('Proxying:', decodeURIComponent(targetUrl));
    
    // Fetch dari ResponsiveVoice
    const response = await fetch(decodeURIComponent(targetUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Set headers untuk audio
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
        specificInstructions = `Fokuskan dialog pada proses membeli tiket kereta di stasiun. 
        Contoh: turis menanyakan dimana membeli tiket, staff menanyakan tujuan pergi, turis menanyakan harga tiket, cara membeli, waktu keberangkatan, dan nomor kereta.`;
        break;
    case 'konbini':
        specificInstructions = `Fokuskan dialog pada proses membeli barang di minimarket seperti makanan ringan, minuman, atau kebutuhan sehari-hari.`;
        break;
    case 'ramen':
        specificInstructions = `Fokuskan dialog pada proses memesan makanan dan minuman di restoran ramen Jepang. Termasuk menanyakan menu, rekomendasi, dan membayar.`;
        break;
}

const prompt = `
Buatkan contoh dialog sederhana antara turis (T) dan karyawan (K) saat berbelanja atau melakukan transaksi di ${category} Jepang.

${specificInstructions}

Gunakan format berikut untuk setiap percakapan:

K: [Kalimat dalam bahasa Jepang]
(Romaji: [pelafalan])
(Arti: [Terjemahan Indonesia])

T: [Kalimat dalam bahasa Jepang]
(Romaji: [pelafalan])
(Arti: [Terjemahan Indonesia])

Instruksi gaya bahasa:
- Turis (T): gunakan gaya kasual atau pola desu/masu bukan kasual dan (hindari keigo).
- Karyawan (K): gunakan keigo atau bentuk sopan yang sesuai dengan budaya pelayanan di Jepang.

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