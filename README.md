# SaveIt - Online Video, Audio & Media Downloader

<p align="center">
  <img src="public/logo192.png" width="80" height="80" alt="SaveIt Logo" />
</p>

**SaveIt** is a fast, modern, and reliable online media downloader inspired by SSYouTube. It enables users to download high-definition videos (up to 4K), extract high-bitrate MP3 audio (up to 320 kbps), and download photos and slideshows from multiple social platforms with zero ads or paywalls.

---

## ✨ Features & Capabilities

- **Universal Multi-Platform Downloader**:
  - **YouTube**: Standard videos, Shorts, Playlists & YouTube Music streams.
  - **TikTok**: HD videos without watermark & Photo Slideshow extractions.
  - **Facebook**: HD/SD reels, timeline videos & photos.
  - **Instagram**: Reels, posts & photo carousels.
  - **Twitter / X**: Video clips and direct GIFs.
  - **Direct Links**: MP4, WebM, MP3, JPG, PNG URLs.

- **Interactive Media Player Modal**: In-app preview modal allowing users to inspect video and audio metadata, duration, and cover before downloading.
- **Download History & Bookmarks System**: Built-in client-side history drawer allowing users to bookmark favorite links, view timestamps, and 1-click re-download without retyping.
- **Cross-Device Mobile QR Code Transfer**: Generate real-time QR codes on desktop so mobile devices can scan and instantly download media.
- **High-Fidelity Audio Bitrate Customizer**: Instant bitrate preset switcher for MP3 conversions: 320 kbps (Studio Master), 256 kbps (High Fidelity), 192 kbps (Standard HQ), and 128 kbps (Compact/Fast).
- **Batch Multi-Link Downloader**: Bulk queue processing that fetches metadata for multiple URLs concurrently and provides 1-click batch downloading.
- **Live Download Progress & Network Speed Indicator**: Real-time simulated stream progress card with live transfer speed, progress bar, and status updates.
- **Dynamic Accent Color Picker**: Choose between 5 theme accent palettes (Emerald, Cyber Blue, Royal Violet, Sunset Orange, Ruby Rose) with Dark/Light mode support.
- **One-Click Clean Link Copy & Social Share**: Strip tracking parameters (`utm_`, `fbclid`, `si`) with 1-click clipboard copy and native Web Share integration.
- **Power-User Keyboard Shortcuts**: Full hotkey navigation (`/` to focus, `Alt+H` for history, `Alt+B` for batch, `Alt+T` for theme toggle, `?` for cheatsheet, `Esc` to close).
- **Progressive Web App (PWA) & Offline Shell**: Service worker caching and offline fallback for ultra-fast startup.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or newer)
- [npm](https://www.npmjs.com/)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/beastcodes27/videodownloader.git
cd videodownloader

# Install dependencies
npm install
```

### 3. Run Development Server
```bash
# Start frontend React development server (runs on port 3000)
npm start

# In a separate terminal, start backend Express API server (runs on port 4000)
node server/index.js
```

### 4. Build for Production
```bash
# Compile optimized React production bundle
npm run build

# Run the complete production server (serves build assets & API on port 4000)
node server/index.js
```

---

## 📡 API Endpoints

### 1. `GET /api/info?url=<media_url>`
Extracts metadata, available video resolutions, audio bitrates, and photo streams.
```json
{
  "title": "Example Video Title",
  "thumbnail": "https://...",
  "duration": 215,
  "author": "Creator Name",
  "platform": "youtube",
  "videoFormats": [
    { "quality": "1080p", "label": "1080p Full HD", "ext": "mp4", "filesize": 45123000 }
  ],
  "audioOptions": [
    { "formatId": "mp3_320", "label": "MP3 - High Quality (320 kbps)", "quality": "320kbps" }
  ],
  "images": [
    { "url": "https://...", "label": "Cover Image (Original)", "ext": "jpg" }
  ]
}
```

### 2. `GET /api/download?url=<media_url>&quality=<quality>&mode=<video|audio>&bitrate=<320k|256k|192k|128k>`
Downloads and streams the combined MP4 video or transcoded MP3 audio file with custom bitrates.

### 3. `GET /api/download-image?url=<image_url>&filename=<filename>`
Fetches and downloads photos, slideshows, or high-res thumbnails with sanitized Content-Disposition headers.

---

## 📄 Privacy & Legal

SaveIt processes media URLs ephemerally in real-time. Media files are delivered directly from third-party host servers and are **not** hosted or permanently stored on our infrastructure. All temporary files are immediately purged after download completion.

See our [Privacy Policy](src/PrivacyPolicy.js) and [Terms of Service](src/TermsOfService.js) for full details.

---

## 📜 License
MIT License © 2026 SaveIt.
