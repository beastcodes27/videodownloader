const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const ffmpegPath = require('ffmpeg-static');

// Locate yt-dlp binary: local server/bin first, then global PATH
function getYtDlpPath() {
  const localBin = path.join(__dirname, 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  if (fs.existsSync(localBin)) {
    return localBin;
  }
  return 'yt-dlp';
}

function downloadBinary(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBinary(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download binary: HTTP ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(() => {
          try {
            fs.chmodSync(dest, 0o755);
          } catch {}
          resolve(dest);
        });
      });
      fileStream.on('error', (err) => {
        try { fs.unlinkSync(dest); } catch {}
        reject(err);
      });
    }).on('error', reject);
  });
}

async function ensureYtDlpBinary() {
  const binDir = path.join(__dirname, 'bin');
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }
  const isWin = process.platform === 'win32';
  const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
  const targetPath = path.join(binDir, binName);

  if (fs.existsSync(targetPath)) {
    return targetPath;
  }

  const downloadUrl = isWin
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

  try {
    console.log('Downloading yt-dlp binary...');
    await downloadBinary(downloadUrl, targetPath);
    console.log('yt-dlp binary downloaded successfully.');
    return targetPath;
  } catch (err) {
    console.warn('Could not auto-download yt-dlp binary:', err.message);
    return getYtDlpPath();
  }
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Common resilient arguments for yt-dlp
function getBaseArgs() {
  const args = [
    '--no-warnings',
    '--no-playlist',
    '--no-check-certificates',
    '--retries', '5',
    '--fragment-retries', '5',
    '--socket-timeout', '20',
    '--user-agent', DEFAULT_USER_AGENT,
    '--extractor-args', 'youtube:player_client=ios,web,android;player_skip=js',
  ];

  if (ffmpegPath && fs.existsSync(ffmpegPath)) {
    args.push('--ffmpeg-location', ffmpegPath);
  }

  return args;
}

// Clean and normalize URLs to avoid extraction quirks
function sanitizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  try {
    const parsed = new URL(url);
    // Remove known tracking params that can break extractors or produce redirects
    ['si', 'feature', 'utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'].forEach(param => {
      parsed.searchParams.delete(param);
    });
    return parsed.toString();
  } catch {
    return url;
  }
}

const IMAGE_EXT_REGEX = /\.(jpg|jpeg|png|webp|gif|svg|bmp|tiff|avif)(\?.*)?$/i;

function isDirectImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return IMAGE_EXT_REGEX.test(url.trim());
}

function handleDirectImage(url) {
  const cleanUrl = sanitizeUrl(url);
  try {
    const parsed = new URL(cleanUrl);
    const pathname = parsed.pathname;
    const extMatch = pathname.match(/\.(jpg|jpeg|png|webp|gif|svg|bmp|avif)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const baseName = path.basename(pathname) || 'image';

    return {
      title: decodeURIComponent(baseName).replace(/\.[^/.]+$/, '') || 'Photo',
      thumbnail: cleanUrl,
      duration: 0,
      author: parsed.hostname,
      platform: 'image',
      videoFormats: [],
      audioOptions: [],
      images: [
        {
          url: cleanUrl,
          label: `Original Image (${ext.toUpperCase()})`,
          ext,
        }
      ],
      originalUrl: cleanUrl,
      isImageOnly: true,
    };
  } catch {
    return {
      title: 'Photo',
      thumbnail: cleanUrl,
      duration: 0,
      author: 'Direct Link',
      platform: 'image',
      videoFormats: [],
      audioOptions: [],
      images: [
        {
          url: cleanUrl,
          label: 'Original Image',
          ext: 'jpg',
        }
      ],
      originalUrl: cleanUrl,
      isImageOnly: true,
    };
  }
}

// Identify video platform
function detectPlatform(url) {
  const u = url.toLowerCase();
  if (isDirectImageUrl(url)) return 'image';
  if (/youtube\.com|youtu\.be/i.test(u)) return 'youtube';
  if (/tiktok\.com|vm\.tiktok|vt\.tiktok/i.test(u)) return 'tiktok';
  if (/facebook\.com|fb\.watch|fb\.com|fb\.gg/i.test(u)) return 'facebook';
  if (/instagram\.com/i.test(u)) return 'instagram';
  if (/twitter\.com|x\.com/i.test(u)) return 'twitter';
  if (/reddit\.com/i.test(u)) return 'reddit';
  if (/vimeo\.com/i.test(u)) return 'vimeo';
  return 'generic';
}

/**
 * Fetch video metadata and available formats safely and asynchronously
 */
function fetchInfo(url, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const cleanUrl = sanitizeUrl(url);

    // If direct image URL, resolve directly
    if (isDirectImageUrl(cleanUrl)) {
      return resolve(handleDirectImage(cleanUrl));
    }

    const ytDlp = getYtDlpPath();

    const args = [
      ...getBaseArgs(),
      '--dump-json',
      '--no-download',
      cleanUrl,
    ];

    const proc = spawn(ytDlp, args);

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
      reject(new Error('Fetching video info timed out (45s)'));
    }, timeoutMs);

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to execute yt-dlp: ${err.message}`));
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) return;

      if (code !== 0) {
        const cleanErr = stderr
          .split('\n')
          .filter(l => l.includes('ERROR:') || l.includes('Error:') || l.includes('Sign in'))
          .join(' ') || stderr.slice(-300);
        return reject(new Error(cleanErr || `yt-dlp exited with code ${code}`));
      }

      try {
        const data = JSON.parse(stdout);
        const platform = detectPlatform(cleanUrl);

        // Normalize available formats
        const rawFormats = data.formats || [];
        
        // Find available video resolutions
        const videoFormats = [];
        const seenHeights = new Set();
        
        // Filter video streams with height or format note (Facebook HD / SD)
        const validVideoStreams = rawFormats
          .filter(f => {
            const hasVideo = f.vcodec && f.vcodec !== 'none';
            const hasDirectVideo = !f.vcodec && f.ext === 'mp4' && !f.format_id?.includes('audio');
            return hasVideo || hasDirectVideo || f.height || f.resolution;
          })
          .sort((a, b) => (b.height || 0) - (a.height || 0));

        for (const f of validVideoStreams) {
          let height = f.height || (f.resolution ? parseInt(f.resolution, 10) : null);
          const note = ((f.format_note || '') + ' ' + (f.format_id || '')).toLowerCase();

          if (!height) {
            if (note.includes('hd') || note.includes('1080') || note.includes('720')) {
              height = note.includes('1080') ? 1080 : 720;
            } else if (note.includes('sd') || note.includes('480') || note.includes('360')) {
              height = note.includes('360') ? 360 : 480;
            }
          }

          if (height && !seenHeights.has(height)) {
            seenHeights.add(height);
            let label = `${height}p`;
            if (height >= 2160) label = '4K (2160p)';
            else if (height >= 1440) label = '2K (1440p)';
            else if (height >= 1080) label = '1080p Full HD';
            else if (height >= 720) label = '720p HD';
            else if (height >= 480) label = '480p SD';
            else if (height >= 360) label = '360p';

            videoFormats.push({
              height,
              quality: `${height}p`,
              label,
              ext: 'mp4',
              filesize: f.filesize || f.filesize_approx || null,
              tbr: f.tbr || null,
              fps: f.fps || null,
            });
          }
        }

        // If no distinct video streams found (e.g. direct Facebook SD/HD or direct URL)
        if (videoFormats.length === 0) {
          videoFormats.push({
            height: 720,
            quality: 'best',
            label: 'HD / Best Quality',
            ext: 'mp4',
            filesize: data.filesize || data.filesize_approx || null,
            tbr: null,
            fps: null,
          });
        }

        // Sort videoFormats descending by height
        videoFormats.sort((a, b) => b.height - a.height);

        // Audio options
        const audioOptions = [
          {
            formatId: 'mp3_320',
            label: 'MP3 - High Quality (320 kbps)',
            ext: 'mp3',
            quality: '320kbps',
            isMp3: true,
          },
          {
            formatId: 'mp3_192',
            label: 'MP3 - Standard Quality (192 kbps)',
            ext: 'mp3',
            quality: '192kbps',
            isMp3: true,
          },
          {
            formatId: 'mp3_128',
            label: 'MP3 - Compact (128 kbps)',
            ext: 'mp3',
            quality: '128kbps',
            isMp3: true,
          },
        ];

        // Also add direct audio stream if available
        const bestSourceAudio = rawFormats
          .filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
          .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

        if (bestSourceAudio) {
          audioOptions.push({
            formatId: 'source_audio',
            rawFormatId: bestSourceAudio.format_id,
            label: `Source Audio (${bestSourceAudio.ext.toUpperCase()} ${bestSourceAudio.abr ? Math.round(bestSourceAudio.abr) + 'kbps' : ''})`,
            ext: bestSourceAudio.ext,
            quality: bestSourceAudio.abr ? `${Math.round(bestSourceAudio.abr)}kbps` : 'Source',
            filesize: bestSourceAudio.filesize || bestSourceAudio.filesize_approx || null,
            isMp3: false,
          });
        }

        // Extract photo slideshows, carousel images, and high-res cover photos
        const images = [];
        const seenImageUrls = new Set();

        // 1. Slideshow / carousel entries (e.g. TikTok photos, multi-image posts)
        if (Array.isArray(data.entries) && data.entries.length > 0) {
          data.entries.forEach((entry, idx) => {
            const imgUrl = entry.url || entry.thumbnail || (entry.thumbnails && entry.thumbnails[entry.thumbnails.length - 1]?.url);
            if (imgUrl && !seenImageUrls.has(imgUrl)) {
              seenImageUrls.add(imgUrl);
              images.push({
                url: imgUrl,
                label: `Photo ${idx + 1}`,
                ext: 'jpg',
                width: entry.width || null,
                height: entry.height || null,
              });
            }
          });
        }

        // 2. High resolution thumbnails / covers
        if (Array.isArray(data.thumbnails)) {
          const sortedThumbs = [...data.thumbnails].reverse();
          for (const t of sortedThumbs) {
            if (t.url && !seenImageUrls.has(t.url)) {
              seenImageUrls.add(t.url);
              const resLabel = t.height && t.width ? `${t.width}x${t.height}` : (t.resolution || 'High Quality');
              images.push({
                url: t.url,
                label: `Cover Image (${resLabel})`,
                ext: 'jpg',
                width: t.width || null,
                height: t.height || null,
              });
            }
          }
        } else if (data.thumbnail && !seenImageUrls.has(data.thumbnail)) {
          seenImageUrls.add(data.thumbnail);
          images.push({
            url: data.thumbnail,
            label: 'Cover Image (Original)',
            ext: 'jpg',
            width: null,
            height: null,
          });
        }

        resolve({
          title: data.title || 'video',
          thumbnail: data.thumbnail || (data.thumbnails && data.thumbnails[0] ? data.thumbnails[0].url : ''),
          duration: Math.round(data.duration || 0),
          author: data.uploader || data.channel || data.creator || data.uploader_id || 'Unknown',
          platform,
          videoFormats,
          audioOptions,
          images,
          originalUrl: cleanUrl,
        });
      } catch (parseErr) {
        reject(new Error(`Failed to parse video info: ${parseErr.message}`));
      }
    });
  });
}

/**
 * Build yt-dlp arguments for downloading video or audio
 */
function buildDownloadArgs({ url, mode, quality, formatId, outTmpl }) {
  const cleanUrl = sanitizeUrl(url);
  const args = [...getBaseArgs(), '-o', outTmpl, '--no-part', '--no-progress'];

  if (mode === 'audio') {
    // Audio extraction
    if (formatId === 'mp3_320') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '320K');
    } else if (formatId === 'mp3_192') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '192K');
    } else if (formatId === 'mp3_128') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '128K');
    } else if (formatId === 'source_audio') {
      args.push('-f', 'bestaudio/best', '-x');
    } else {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    }
  } else {
    // Video download
    let heightNum = null;
    if (quality && quality !== 'best') {
      const match = quality.match(/(\d+)/);
      if (match) heightNum = parseInt(match[1], 10);
    }

    if (heightNum) {
      args.push(
        '-f',
        `bestvideo[height<=${heightNum}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${heightNum}]+bestaudio/best[height<=${heightNum}]/best`,
        '--merge-output-format',
        'mp4'
      );
    } else {
      args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best', '--merge-output-format', 'mp4');
    }
  }

  args.push(cleanUrl);
  return args;
}

module.exports = {
  getYtDlpPath,
  ensureYtDlpBinary,
  fetchInfo,
  buildDownloadArgs,
  sanitizeUrl,
  detectPlatform,
  isDirectImageUrl,
};

