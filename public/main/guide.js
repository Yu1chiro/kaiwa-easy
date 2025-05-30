document.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/');
    const category = pathParts[pathParts.length - 1];
    const categoryNames = {
        'konbini': 'Konbini',
        'ramen': 'Ramen Shop',
        'souvenir': 'Toko Souvenir',
        'pakaian': 'Toko Pakaian',
        'stasiun': 'Stasiun',
    };
    
    // Update title and description
    document.getElementById('guide-title').textContent = getCategoryDescription(category);
    displayCategoryImage(category);

    // Generate button click handler
    document.getElementById('generate-btn').addEventListener('click', () => {
        // Hapus localStorage sebelum generate dialog baru
        clearStoredDialog(category);
        generateDialog(category);
    });

    // Cek apakah ada dialog tersimpan, jika tidak ada baru generate baru
    loadStoredDialog(category) || generateDialog(category);
        // Add play all audio button functionality
    const playAllButton = document.getElementById('playall-audio');
    if (playAllButton) {
        playAllButton.addEventListener('click', playAllAudiosWithScroll);
    }
        window.speechSynthesis.getVoices();

});
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔍 Testing proxy server connection...');
    console.log('📡 Server URL:', PROXY_SERVER_URL);
    
    const isConnected = await testProxyConnection();
    
    if (isConnected) {
        console.log('✅ Proxy server connection successful');
    } else {
        console.log('❌ Proxy server connection failed');
        console.log('🔄 TTS akan menggunakan Web Speech API sebagai fallback');
        
        // Test juga endpoint TTS secara langsung
        try {
            const testUrl = encodeURIComponent('https://code.responsivevoice.org/getvoice.php?t=test&tl=ja');
            const ttsResponse = await fetch(`${PROXY_SERVER_URL}/tts?url=${testUrl}`);
            
            if (ttsResponse.ok) {
                console.log('✅ TTS endpoint working despite main endpoint issues');
            } else {
                console.log('❌ TTS endpoint also not working:', ttsResponse.status);
            }
        } catch (e) {
            console.log('❌ TTS endpoint test failed:', e.message);
        }
    }
});
let currentPlayingIndex = 0;
let audioElements = [];

function playAllAudiosWithScroll() {
    // Reset state
    currentPlayingIndex = 0;
    audioElements = [];
    
    // Get all audio buttons in the dialog
    const audioButtons = document.querySelectorAll('#dialog-container button[onclick^="speakFromButton"]');
    if (audioButtons.length === 0) return;
    
    // Store all elements for scrolling
    audioElements = Array.from(audioButtons).map(button => {
        return {
            button: button,
            element: button.closest('.flex.items-start') || button.closest('.text-center')
        };
    });
    
    // Start playing the first audio
    playNextAudio();
}

function playNextAudio() {
    if (currentPlayingIndex >= audioElements.length) {
        // All audios have been played
        return;
    }
    
    const currentItem = audioElements[currentPlayingIndex];
    
    // Scroll to the current element
    gsap.to(window, {
        duration: 1, // INI DURASI SCROLL (dalam detik) - bisa disesuaikan (1.5 detik cukup lambat)
        scrollTo: {
            y: currentItem.element,
            offsetY: 100, // Jarak dari atas viewport setelah scroll
            autoKill: true
        },
        ease: "power2.inOut", // Efek easing untuk scroll yang halus
        onComplete: () => {
            // Highlight the current element
            gsap.to(currentItem.element, {
                duration: 0.5, // Durasi animasi highlight
                scale: 1.02,
                boxShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
                onComplete: () => {
                    // Play the audio
                    speakFromButton(currentItem.button);
                    
                    // Remove highlight after audio plays
                    setTimeout(() => {
                        gsap.to(currentItem.element, {
                            duration: 0.5, // Durasi animasi menghilangkan highlight
                            scale: 1,
                            boxShadow: "none"
                        });
                        
                        // Move to next audio after a delay
                        setTimeout(() => {
                            currentPlayingIndex++;
                            playNextAudio();
                        }, 4500); // INI DELAY ANTAR AUDIO (dalam milidetik) - bisa disesuaikan (2000ms = 2 detik)
                    }, 1000); // Durasi highlight tetap muncul (1000ms = 1 detik)
                }
            });
        }
    });
}
function getCategoryImagePath(category) {
    const imageMap = {
        'konbini': '/img/konbini.png',
        'ramen': '/img/resutoran.png',
        'souvenir': '/img/omiyage.png',
        'pakaian': '/img/shatsu.png',
        'stasiun': '/img/eki.png',
        'reservasi': '/img/hotel.png',
        'kaisha': '/img/kaisha.png',
        'gakkou': '/img/gakkou.png',

    };
    return imageMap[category] || '/img/default.png'; // Fallback image
}

// Function to display the category image
function displayCategoryImage(category) {
    const imageContainer = document.querySelector('#category-image-container');
    if (!imageContainer) return;
    
    const imagePath = getCategoryImagePath(category);
    const altText = `${category} illustration`;
    
    imageContainer.innerHTML = `
        <img src="${imagePath}" 
             alt="${altText}" 
             class="w-full h-auto object-contain max-w-full"
             style="max-height: 500px"
             onerror="this.src='/img/default.png'">
    `;
}
function getCategoryDescription(category) {
    const descriptions = {
        'konbini': 'Menanyakan & Membeli Barang di Konbini',
        'ramen': 'Memesan & Menikmati Ramen',
        'souvenir': 'Menanyakan & Membeli Souvenir',
        'pakaian': 'Membeli & Mencoba Pakaian',
        'stasiun': 'Menanyakan & Membeli Tiket di Stasiun',
        'kaisha': 'Berkomunikasi dengan karyawan terkait pekerjaan',
        'reservasi': 'Cara melakukan reservasi hotel di jepang',
        'gakkou': 'Dialog sederhana guru dan siswa di sekolah',
    };
    return descriptions[category] || 'Belajar dialog praktis untuk pemula';
}

async function generateDialog(category) {
    const loader = document.getElementById('loader');
    const dialogContainer = document.getElementById('dialog-container');
    const errorContainer = document.getElementById('error-container');
    const generateBtn = document.getElementById('generate-btn');
    
    // Reset UI
    loader.classList.remove('hidden');
    errorContainer.classList.add('hidden');
    dialogContainer.innerHTML = '';
    generateBtn.disabled = true;
    
    try {
        const response = await fetch('/api/dialog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ category })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal memuat dialog');
        }
        
        const data = await response.json();
        
        // Simpan dialog ke localStorage setelah berhasil fetch
        saveDialogToStorage(category, data);
        
        displayDialog(data.dialog, data.category);
        
    } catch (error) {
        console.error('Error:', error);
        errorContainer.classList.remove('hidden');
        document.getElementById('error-message').textContent = error.message;
    } finally {
        loader.classList.add('hidden');
        generateBtn.disabled = false;
    }
}

// Fungsi untuk menyimpan dialog ke localStorage
function saveDialogToStorage(category, dialogData) {
    try {
        const storageKey = `dialog_${category}`;
        const dataWithTimestamp = {
            ...dialogData,
            timestamp: Date.now(),
            category: category
        };
        localStorage.setItem(storageKey, JSON.stringify(dataWithTimestamp));
        console.log('Dialog berhasil disimpan ke localStorage');
    } catch (error) {
        console.warn('Gagal menyimpan dialog ke localStorage:', error);
    }
}


// Fungsi untuk memuat dialog dari localStorage
function loadStoredDialog(category) {
    try {
        const storageKey = `dialog_${category}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
            const dialogData = JSON.parse(storedData);
            console.log('Dialog ditemukan di localStorage, memuat...');
            
            // Tampilkan dialog yang tersimpan
            displayDialog(dialogData.dialog, dialogData.category);
            
            // Tambahkan indikator bahwa ini dari cache
            showCacheIndicator();
            
            return true; // Berhasil memuat dari storage
        }
        return false; // Tidak ada data tersimpan
    } catch (error) {
        console.warn('Gagal memuat dialog dari localStorage:', error);
        return false;
    }
}

// Fungsi untuk menghapus dialog dari localStorage
function clearStoredDialog(category) {
    try {
        const storageKey = `dialog_${category}`;
        localStorage.removeItem(storageKey);
        console.log('Dialog dihapus dari localStorage');
        
        // Sembunyikan indikator cache jika ada
        hideCacheIndicator();
    } catch (error) {
        console.warn('Gagal menghapus dialog dari localStorage:', error);
    }
}

// Fungsi untuk menampilkan indikator bahwa dialog dari cache
function showCacheIndicator() {
    // Tambahkan indikator visual bahwa ini dari cache
    const indicator = document.createElement('div');
    indicator.id = 'cache-indicator';
    indicator.className = 'fixed top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg z-50 animate-fade-in';
    indicator.innerHTML = '💾 Dialog dimuat dari localstorage';
    
    // Hapus indikator lama jika ada
    const existing = document.getElementById('cache-indicator');
    if (existing) existing.remove();
    
    document.body.appendChild(indicator);
    
    // Auto hide setelah 3 detik
    setTimeout(() => {
        if (indicator && indicator.parentNode) {
            indicator.remove();
        }
    }, 3000);
}

// Fungsi untuk menyembunyikan indikator cache
function hideCacheIndicator() {
    const indicator = document.getElementById('cache-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function displayDialog(dialogText, category) {
    const dialogContainer = document.getElementById('dialog-container');
    
    const lines = dialogText.split('\n').filter(line => line.trim() !== '');
    let htmlContent = '<div class="p-4 md:p-8 lg:p-12 min-h-full">';
    
    htmlContent += `
        <div class="text-center mb-8 md:mb-12 lg:mb-16">
            <h2 class="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-4 lg:mb-6 tracking-tight">💬 ${getCategoryDescription(category)}</h2>
            <p class="text-white/80 text-sm md:text-lg lg:text-xl font-medium">Pelajari percakapan praktis dalam bahasa Jepang</p>
        </div>
        
        <div class="space-y-4 md:space-y-6 lg:space-y-8 max-w-5xl mx-auto">
    `;

    lines.forEach((line, index) => {
        const isKaryawan = line.startsWith('K:');
        const isTuris = line.startsWith('T:');
        const speaker = isKaryawan ? 'Karyawan' : isTuris ? 'Turis' : '';
        const textOnly = line.replace(/^K:|^T:/, '').trim();

        if (isKaryawan) {
            htmlContent += `
            <div class="flex items-start space-x-3 md:space-x-4 lg:space-x-6 animate-fade-in" style="animation-delay: ${index * 0.3}s">
                <div class="flex-shrink-0">
                    <img src="/img/女性.png" alt="Karyawan" class="h-10 w-10 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-full border-2 md:border-3 border-white/20 shadow-lg">
                </div>
                <div class="max-w-[70%] md:max-w-lg lg:max-w-2xl">
                    <div class="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl md:rounded-2xl lg:rounded-3xl rounded-tl-sm p-4 md:p-6 lg:p-8 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02]">
                        <div class="flex items-center mb-2 md:mb-3 lg:mb-4">
                         <span class="mr-2 md:mr-3 px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 bg-white/20 text-white text-xs md:text-sm lg:text-base rounded-full font-semibold">Suzuki</span>
                            <span class="font-bold text-white text-sm md:text-lg lg:text-xl">鈴木</span>
                        </div>
                        ${processDialogLine(textOnly)}
                        <button onclick="speakFromButton(this)" data-jp="${textOnly}" class="mt-2 text-white hover:underline text-sm">🔊 Dengarkan</button>
                    </div>
                </div>
            </div>
            `;
        } else if (isTuris) {
            htmlContent += `
            <div class="flex items-start space-x-3 md:space-x-4 lg:space-x-6 flex-row-reverse animate-fade-in" style="animation-delay: ${index * 0.3}s">
                <div class="flex-shrink-0">
                    <img src="/img/男.png" alt="Turis" class="h-10 w-10 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-full border-2 md:border-3 border-white/20 shadow-lg">
                </div>
                <div class="max-w-[70%] md:max-w-lg lg:max-w-2xl">
                    <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl md:rounded-2xl lg:rounded-3xl rounded-tr-sm p-4 md:p-6 lg:p-8 shadow-lg text-white transition-all duration-200 hover:shadow-xl hover:scale-[1.02]">
                        <div class="flex items-center mb-2 md:mb-3 lg:mb-4 justify-end">
                            <span class="mr-2 md:mr-3 px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 bg-white/20 text-white text-xs md:text-sm lg:text-base rounded-full font-semibold">Mike</span>
                            <span class="font-bold text-white text-sm md:text-lg lg:text-xl">マイク</span>
                        </div>
                        ${processDialogLine(textOnly, true)}
                        <button onclick="speakFromButton(this)" data-jp="${textOnly}" class="mt-2 text-white hover:underline text-sm">🔊 Dengarkan</button>
                    </div>
                </div>
            </div>
            `;
        } else {
            htmlContent += `
            <div class="text-center py-3 md:py-4 lg:py-6 animate-fade-in" style="animation-delay: ${index * 0.3}s">
                <div class="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4 rounded-full border border-white/20 shadow-lg">
                    <span class="text-white/90 text-sm md:text-lg lg:text-xl font-medium">💡 ${line.trim()}</span>
                </div>
            </div>
            `;
        }
    });

    htmlContent += `
        </div>
        <div class="mt-8 md:mt-12 lg:mt-16 text-center">
            <div class="inline-flex items-center space-x-2 md:space-x-3 lg:space-x-4 bg-white/10 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4 rounded-full border border-white/20 shadow-lg">
                <span class="text-white/90 text-sm md:text-lg lg:text-xl font-semibold">✅ Dialog selesai</span>
            </div>
        </div>
    </div>
    `;

    dialogContainer.innerHTML = htmlContent;
}

// Konfigurasi URL server proxy Anda
const PROXY_SERVER_URL = 'https://kaiwa-shiyou.vercel.app';

function speakFromButton(button) {
    return new Promise((resolve) => {
        if (!button) {
            console.error('No button element provided');
            return resolve();
        }

        const originalHTML = button.innerHTML;
        const text = button.getAttribute('data-jp');
        
        if (!text) {
            console.error('No text data found on button');
            return resolve();
        }

        // Set loading state
        button.disabled = true;
        button.innerHTML = '<span class="animate-pulse">🔊 Memuat...</span>';
        
        // Create a queue system to prevent overlapping speech
        if (!window.speechQueue) {
            window.speechQueue = [];
            window.isSpeaking = false;
        }

        const speakTask = async () => {
            window.isSpeaking = true;
            try {
                // Panggil speakJapanese dan tunggu sampai benar-benar selesai
                await speakJapanese(text, button, originalHTML);
                
            } catch (e) {
                console.error('Speech error:', e);
                button.innerHTML = originalHTML;
                button.disabled = false;
            } finally {
                window.isSpeaking = false;
                
                // Process next in queue if exists
                if (window.speechQueue.length > 0) {
                    const nextTask = window.speechQueue.shift();
                    nextTask();
                }
                resolve();
            }
        };

        // Add to queue or execute immediately
        if (window.isSpeaking) {
            window.speechQueue.push(speakTask);
        } else {
            speakTask();
        }
    });
}

async function speakJapanese(text, button, originalHTML) {
    // Cancel any ongoing speech first
    if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio = null;
    }
    
    try {
        // Menggunakan proxy server untuk ResponsiveVoice
        await speakWithProxy(text, button, originalHTML);
    } catch (error) {
        console.error('Proxy speech error:', error);
        // Update button untuk fallback
        if (button) {
            button.innerHTML = '<span class="animate-pulse">🎤 Fallback...</span>';
        }
        // Fallback ke Web Speech API jika proxy gagal
        await fallbackSpeech(text, button, originalHTML);
    }
}

async function speakWithProxy(text, button, originalHTML) {
    try {
        // Buat URL ResponsiveVoice dengan parameter yang dibutuhkan
        const responsiveVoiceUrl = `https://code.responsivevoice.org/getvoice.php?t=${encodeURIComponent(text)}&tl=ja&sv=g1&vn=&pitch=0.5&rate=0.5&vol=1&gender=female`;
        
        // Encode URL untuk dikirim ke proxy
        const encodedUrl = encodeURIComponent(responsiveVoiceUrl);
        
        // Panggil proxy server Anda
        const proxyUrl = `${PROXY_SERVER_URL}/tts?url=${encodedUrl}`;
        
        console.log('🔊 Memutar audio via proxy...');
        
        // Buat audio element dan mainkan
        const audio = new Audio(proxyUrl);
        window.currentAudio = audio;
        
        // Promise untuk menunggu audio selesai
        return new Promise((resolve, reject) => {
            let hasResolved = false;
            let isPlaying = false;
            
            audio.onloadstart = () => {
                console.log('📡 Loading audio...');
                if (button) {
                    button.innerHTML = '<span class="animate-pulse">📡 Loading...</span>';
                }
            };
            
            audio.oncanplay = () => {
                console.log('✅ Audio ready');
                if (button) {
                    button.innerHTML = '<span class="animate-pulse">⏳ Ready...</span>';
                }
            };
            
            audio.onplay = () => {
                console.log('▶️ Playing audio');
                isPlaying = true;
                if (button) {
                    button.innerHTML = '<span class="animate-pulse">🔊 Playing...</span>';
                }
            };
            
            audio.onended = () => {
                if (!hasResolved) {
                    console.log('✅ Audio finished');
                    window.currentAudio = null;
                    hasResolved = true;
                    
                    // Reset button setelah audio benar-benar selesai
                    if (button && originalHTML) {
                        button.innerHTML = originalHTML;
                        button.disabled = false;
                    }
                    
                    resolve();
                }
            };
            
            // Error handling yang lebih toleran
            audio.onerror = (e) => {
                // Jangan langsung reject jika audio sudah mulai diputar
                if (audio.currentTime > 0 || audio.readyState >= 2 || isPlaying) {
                    console.log('⚠️ Minor audio error ignored (audio still playing)');
                    return;
                }
                
                if (!hasResolved) {
                    console.log('❌ Audio error - switching to fallback');
                    window.currentAudio = null;
                    hasResolved = true;
                    reject(new Error('Audio failed'));
                }
            };
            
            // Mulai putar audio dengan error handling yang lebih baik
            audio.play().catch(e => {
                if (!hasResolved) {
                    console.log('❌ Play failed - switching to fallback');
                    hasResolved = true;
                    reject(e);
                }
            });
            
            // Timeout sebagai backup jika audio terlalu lama loading
            setTimeout(() => {
                if (!hasResolved && !isPlaying && audio.currentTime === 0) {
                    console.log('⏰ Audio timeout - switching to fallback');
                    hasResolved = true;
                    reject(new Error('Audio timeout'));
                }
            }, 8000); // Timeout lebih lama untuk loading
            
            // Tambahan timeout untuk memastikan button reset meski ada masalah
            setTimeout(() => {
                if (!hasResolved) {
                    console.log('🔄 Force finishing audio task');
                    hasResolved = true;
                    window.currentAudio = null;
                    
                    if (button && originalHTML) {
                        button.innerHTML = originalHTML;
                        button.disabled = false;
                    }
                    
                    resolve();
                }
            }, Math.max(text.length * 200, 10000)); // Backup timeout berdasarkan panjang teks
        });
        
    } catch (error) {
        console.log('❌ Proxy error - switching to fallback');
        throw error;
    }
}

// Web Speech API fallback dengan button sync
function fallbackSpeech(text, button, originalHTML) {
    return new Promise((resolve) => {
        console.log('🔄 Switching to Web Speech API fallback');
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.rate = 1;
            
            // Try to find a Japanese voice
            const voices = window.speechSynthesis.getVoices();
            const japaneseVoice = voices.find(voice => voice.lang === 'ja-JP' || voice.lang.startsWith('ja-'));
            
            if (japaneseVoice) {
                utterance.voice = japaneseVoice;
            }
            
            utterance.onstart = () => {
                console.log('🎤 Web Speech API playing');
                if (button) {
                    button.innerHTML = '<span class="animate-pulse">🎤 Speaking...</span>';
                }
            };
            
            utterance.onend = () => {
                console.log('✅ Web Speech API finished');
                if (button && originalHTML) {
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                }
                resolve();
            };
            
            utterance.onerror = (e) => {
                console.log('⚠️ Web Speech API error:', e.error);
                if (button && originalHTML) {
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                }
                resolve();
            };
            
            window.speechSynthesis.speak(utterance);
            
            // Backup timeout untuk Web Speech API juga
            setTimeout(() => {
                if (button && button.disabled && originalHTML) {
                    console.log('🔄 Force reset Web Speech API button');
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                    resolve();
                }
            }, Math.max(text.length * 150, 8000));
            
        } else {
            console.log('❌ Speech synthesis not supported in this browser');
            if (button && originalHTML) {
                button.innerHTML = originalHTML;
                button.disabled = false;
            }
            resolve();
        }
    });
}

// Fungsi tambahan untuk testing koneksi ke proxy server
async function testProxyConnection() {
    try {
        const response = await fetch(`${PROXY_SERVER_URL}/`);
        
        // Check if response is OK first
        if (!response.ok) {
            console.log(`⚠️ Proxy server responded with status ${response.status}`);
            return false;
        }
        
        // Check content type to avoid JSON parsing HTML
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('✅ Proxy server status:', data);
            return true;
        } else {
            // If not JSON, just read as text to see what we got
            const text = await response.text();
            console.log('⚠️ Proxy server returned non-JSON response:', text.substring(0, 100) + '...');
            
            // If it's HTML error page, server might not be configured correctly
            if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
                console.log('❌ Server mengembalikan HTML error page - periksa konfigurasi server');
                return false;
            }
            
            return false;
        }
    } catch (error) {
        console.error('❌ Tidak dapat terhubung ke proxy server:', error.message);
        console.log('🔍 Kemungkinan penyebab:');
        console.log('   - Server belum deploy atau tidak aktif');
        console.log('   - URL server salah');
        console.log('   - CORS tidak dikonfigurasi dengan benar');
        console.log('   - Network/firewall blocking request');
        return false;
    }
}


// Alternatif jika ingin menggunakan fetch dengan async/await yang lebih robust
async function speakWithProxyAlternative(text, button, originalHTML) {
    try {
        const responsiveVoiceUrl = `https://code.responsivevoice.org/getvoice.php?t=${encodeURIComponent(text)}&tl=ja&sv=g1&vn=&pitch=0.5&rate=0.5&vol=1&gender=female`;
        const encodedUrl = encodeURIComponent(responsiveVoiceUrl);
        const proxyUrl = `${PROXY_SERVER_URL}/tts?url=${encodedUrl}`;
        
        if (button) {
            button.innerHTML = '<span class="animate-pulse">📡 Fetching...</span>';
        }
        
        // Fetch audio data
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (button) {
            button.innerHTML = '<span class="animate-pulse">🔄 Processing...</span>';
        }
        
        // Convert response to blob
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create and play audio
        const audio = new Audio(audioUrl);
        window.currentAudio = audio;
        
        return new Promise((resolve, reject) => {
            audio.onplay = () => {
                if (button) {
                    button.innerHTML = '<span class="animate-pulse">🔊 Playing...</span>';
                }
            };
            
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl); // Cleanup
                window.currentAudio = null;
                
                if (button && originalHTML) {
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                }
                
                resolve();
            };
            
            audio.onerror = (e) => {
                URL.revokeObjectURL(audioUrl); // Cleanup
                window.currentAudio = null;
                
                if (button && originalHTML) {
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                }
                
                reject(new Error('Gagal memutar audio'));
            };
            
            audio.play().catch(reject);
        });
        
    } catch (error) {
        console.error('Error dalam speakWithProxyAlternative:', error);
        throw error;
    }
}

function processDialogLine(line, isTourist = false) {
    // Process romaji and translation with improved typography
    let result = line;
    const textColor = isTourist ? 'text-white' : 'text-white';
    const romajiColor = isTourist ? 'text-white/75' : 'text-white';
    const translationColor = isTourist ? 'text-white/90' : 'text-white';
    
    // Handle romaji with improved styling
    result = result.replace(/\(\s*(.*?)\)/g, 
        `<div class="mt-2 md:mt-3 lg:mt-4 ${romajiColor} italic text-sm md:text-lg lg:text-xl font-medium leading-relaxed">$1</div>`);
    
    // Handle translation with improved styling
    result = result.replace(/\(\s*(.*?)\)/g, 
        `<div class="mt-2 md:mt-3 lg:mt-4 ${translationColor} text-sm md:text-lg lg:text-xl font-medium leading-relaxed">$1</div>`);
    
    // Extract main Japanese text and format it properly
    const lines = result.split('\n');
    const mainText = lines[0];
    const additionalContent = lines.slice(1).join('\n');
    
    // Enhanced main text formatting with better typography
    const formattedMain = `<div class="font-bold ${textColor} text-base md:text-xl lg:text-2xl leading-relaxed md:leading-relaxed lg:leading-loose tracking-wide">${mainText}</div>`;
    
    return formattedMain + additionalContent;
}
