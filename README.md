# SaveIt - Online Video, Audio & Media Downloader

<p align="center">
  <img src="public/logo192.png" width="80" height="80" alt="SaveIt Logo" />
</p>

SaveIt is a fast, modern, and reliable online media downloader inspired by SSYouTube. It enables users to download high-definition videos (up to 4K), extract high-bitrate MP3 audio (up to 320 kbps), and download photos and slideshows from various social platforms with zero ads or paywalls.

---

## ✨ Features

- **Multi-Platform Support**: Download from **YouTube** (Videos, Shorts, Music), **TikTok** (Without watermark & Photo mode), **Facebook** (Reels & Videos), **Instagram** (Posts & Reels), **Twitter/X**, and direct media links.
- **Dynamic Format Selection**:
  - **Video**: 4K (2160p), 2K (1440p), 1080p Full HD, 720p HD, 480p, 360p (MP4).
  - **Audio**: MP3 320 kbps (High Quality), 192 kbps (Standard), 128 kbps (Compact), and Source Audio.
  - **Photos**: Direct high-res photo downloads and TikTok/Instagram slideshow extractions.
- **SSYouTube-Inspired UI**:
  - Clean light theme by default with a built-in Dark Mode toggle.
  - One-click clipboard **Paste** button.
  - Responsive layout optimized for smartphones, tablets, and desktops.
  - Step-by-step guide, supported platform badges, and interactive FAQ accordion.
- **Resilient Engine**:
  - Standalone `yt-dlp` integration with automatic binary management.
  - Non-blocking asynchronous child process execution.
  - Automatic `ffmpeg` stream transcoding and container merging.
  - Automatic transient temp file cleanup.

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

### 2. `GET /api/download?url=<media_url>&quality=<quality>&mode=<video|audio>`
Downloads and streams the combined MP4 video or transcoded MP3 audio file.

### 3. `GET /api/download-image?url=<image_url>&filename=<filename>`
Fetches and downloads photos, slideshows, or high-res thumbnails with sanitized Content-Disposition headers.

---

## 📄 Privacy & Legal

SaveIt processes media URLs ephemerally in real-time. Media files are delivered directly from third-party host servers and are **not** hosted or permanently stored on our infrastructure. All temporary files are immediately purged after download completion.

See our [Privacy Policy](src/PrivacyPolicy.js) and [Terms of Service](src/TermsOfService.js) for full details.

---

## 📜 License
MIT License © 2026 SaveIt.
