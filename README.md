# AM Preset Player & WebGL Runtime (Clone)

Clone lengkap dari website **Alight Motion Preset Player & WebGL Runtime Engine** (`https://alight-web-editor.pages.dev/runtime/preset.html`) sampai ke akar-akarnya, siap dijalankan secara lokal maupun di-deploy ke **Cloudflare Pages**.

---

## 📁 Struktur Project

```text
├── index.html                   # Halaman Landing Page AM Web
├── runtime/
│   ├── preset.html              # Aplikasi Utama AM Preset Player
│   ├── preview.html             # AM WebGL Effect Previewer
│   ├── about.html               # Halaman Tentang & Tim
│   ├── amprem.html              # Halaman AM Premium / Tutorial
│   ├── docs.html                # Dokumentasi Engine AM
│   ├── ngehayal.html            # Halaman Playground / Animasi
│   ├── effect-index.json        # Indeks Definisi Efek & Shader
│   ├── shape-index.json         # Indeks Definisi Shape Vektor
│   └── assets/
│       ├── preset-DRWJZI25.js   # Bundle Runtime Player & Timeline
│       ├── preview-KTFK5DWK.js  # Bundle WebGL Effect Preview
│       └── chunk-3M6AIOHK.js    # Shared Rendering Engine & Math
├── functions/                   # Cloudflare Pages Functions (Edge Backend API)
│   └── api/
│       ├── presets.js           # API Daftar Preset bawaan (/api/presets)
│       ├── drive-xml.js         # API Pengunduh XML dari Google Drive (/api/drive-xml)
│       ├── drive-media.js       # API Proxy Audio/Media Google Drive (/api/drive-media)
│       ├── tiktok.js            # API Pengunduh Audio dari TikTok (/api/tiktok)
│       └── project-xml.js       # API Resolver Share Link Alight Motion (/api/project-xml)
├── preset/                      # Direktori Contoh Preset XML & Audio/Video Bawaan
│   ├── Beraksi.xml
│   ├── TestVideo.xml
│   ├── SharedPreset.xml
│   ├── Audio Preset.mp3
│   └── ... (semua preset & media bawaan)
├── _headers                     # Konfigurasi Header CORS & Cache Cloudflare Pages
├── wrangler.toml                # Konfigurasi Cloudflare Wrangler
├── server.js                    # Server HTTP Node.js Mandiri untuk Local Testing
└── package.json                 # Konfigurasi NPM Scripts
```

---

## 🚀 Cara Menjalankan di Lokal (Localhost)

1. Pastikan **Node.js** (v18 ke atas) sudah terinstall.
2. Jalankan perintah:
   ```bash
   npm start
   # atau
   node server.js
   ```
3. Buka browser di:
   - **Preset Player**: [http://localhost:3000/runtime/preset.html](http://localhost:3000/runtime/preset.html)
   - **Landing Page**: [http://localhost:3000/](http://localhost:3000/)
   - **WebGL Preview**: [http://localhost:3000/runtime/preview.html](http://localhost:3000/runtime/preview.html)

---

## ☁️ Cara Deploy ke Cloudflare Pages

### Metode 1: Menggunakan Wrangler CLI (Paling Cepat)

1. Login ke akun Cloudflare Anda melalui terminal:
   ```bash
   npx wrangler login
   ```
2. Deploy langsung project ke Cloudflare Pages:
   ```bash
   npx wrangler pages deploy . --project-name=am-preset-player
   ```
3. Website Anda langsung live dengan domain `https://am-preset-player.pages.dev`!

---

### Metode 2: Menggunakan Git / Cloudflare Dashboard

1. Push repository/folder ini ke **GitHub** atau **GitLab**.
2. Masuk ke **Cloudflare Dashboard** -> **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Pilih repository project Anda.
4. Pada **Build settings**:
   - **Framework preset**: `None`
   - **Build command**: *(kosongkan)*
   - **Build output directory**: `.` *(titik / root)*
5. Klik **Save and Deploy**. Cloudflare Pages akan otomatis mengenali folder `functions/` sebagai Edge Serverless API dan seluruh aset statisnya.

---

## ✨ Fitur-Fitur Lengkap

1. **Preset XML Player & WebGL Rendering**:
   - Membaca, mengurai, dan merender XML Alight Motion langsung di browser menggunakan WebGL Canvas.
   - Mendukung layer shape, gambar, video, keyframe animasi, transformasi 2D/3D, opacity, easing curve, dan efek visual shader.
2. **Interactive Timeline**:
   - Timeline multi-track ala Alight Motion asli dengan indikator keyframe, bookmark merah, zoom in/out, dan penanda playhead.
3. **Impor Presets & Media Fleksibel**:
   - **File Lokal**: Unggah file `.xml`, foto, video, atau audio dari perangkat.
   - **Alight Motion Share Link**: Masukkan tautan share Alight Motion untuk mengunduh XML dan media terkait.
   - **Google Drive**: Impor XML dan Audio langsung dari link Google Drive publik.
   - **TikTok Audio**: Ekstrak sound audio dari link video TikTok.
4. **Ekspor Video MP4**:
   - Merender hasil animasi langsung ke format `.mp4` menggunakan WebCodecs / MediaBunny muxer di sisi browser klien.
5. **Full Responsive Design**:
   - Dioptimalkan untuk tampilan HP (portrait & landscape) maupun Desktop dengan layout dock timeline adaptif.
