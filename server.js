require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Routes
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