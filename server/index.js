const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const {
  getYtDlpPath,
  ensureYtDlpBinary,
  fetchInfo,
  buildDownloadArgs,
  sanitizeUrl,
} = require('./ytdlp');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Clean up any stale temp directories on startup
try {
  const serverDir = __dirname;
  const entries = fs.readdirSync(serverDir);
  for (const entry of entries) {
    if (entry.startsWith('dl-')) {
      const fullPath = path.join(serverDir, entry);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
} catch (e) {
  console.warn('Initial temp cleanup warning:', e.message);
}

// Serve static build files
app.use(express.static(path.join(__dirname, '..', 'build')));

// API: Fetch video & audio info
app.get('/api/info', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const info = await fetchInfo(url);
    res.json(info);
  } catch (err) {
    console.error('Info extraction error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch video info' });
  }
});

// API: Download video or audio
app.get('/api/download', async (req, res) => {
  let tmpDir = null;
  let proc = null;

  try {
    const { url, quality, formatId, mode } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const isAudioMode = mode === 'audio' || Boolean(formatId && formatId.startsWith('mp3_')) || formatId === 'source_audio';
    const downloadMode = isAudioMode ? 'audio' : 'video';

    // Create unique temporary directory
    tmpDir = fs.mkdtempSync(path.join(__dirname, 'dl-'));
    const outTmpl = path.join(tmpDir, '%(title).100B.%(ext)s');

    const ytDlp = getYtDlpPath();
    const args = buildDownloadArgs({
      url,
      mode: downloadMode,
      quality,
      formatId,
      outTmpl,
    });

    proc = spawn(ytDlp, args);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    // Handle client disconnect / cancellation
    req.on('close', () => {
      if (proc && !proc.killed) {
        try {
          proc.kill('SIGKILL');
        } catch {}
      }
      setTimeout(() => {
        if (tmpDir && fs.existsSync(tmpDir)) {
          try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
          } catch {}
        }
      }, 3000);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        if (tmpDir && fs.existsSync(tmpDir)) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        const cleanErr = stderr
          .split('\n')
          .filter(l => l.includes('ERROR:') || l.includes('Error:'))
          .join(' ') || stderr.slice(-300);
        return res.status(500).json({ error: `Download failed: ${cleanErr || 'Process exited with code ' + code}` });
      }

      const files = fs.readdirSync(tmpDir);
      if (files.length === 0) {
        if (tmpDir && fs.existsSync(tmpDir)) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        return res.status(500).json({ error: 'Downloaded file not found' });
      }

      const fileName = files[0];
      const filePath = path.join(tmpDir, fileName);

      // Safe ASCII fallback name and RFC 5987 encoded name
      const safeAsciiName = fileName.replace(/[^\w\d._-]/g, '_');
      const encodedName = encodeURIComponent(fileName).replace(/['()]/g, escape).replace(/\*/g, '%2A');

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`
      );

      res.download(filePath, fileName, (downloadErr) => {
        if (tmpDir && fs.existsSync(tmpDir)) {
          try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
          } catch {}
        }
        if (downloadErr && !res.headersSent) {
          console.error('Send error:', downloadErr);
        }
      });
    });

    proc.on('error', (err) => {
      if (tmpDir && fs.existsSync(tmpDir)) {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {}
      }
      if (!res.headersSent) {
        res.status(500).json({ error: `Process launch failed: ${err.message}` });
      }
    });

  } catch (err) {
    if (tmpDir && fs.existsSync(tmpDir)) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// API: Download image/photo
app.get('/api/download-image', (req, res) => {
  try {
    const { url, filename } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    function fetchAndPipe(targetUrl, maxRedirects = 5) {
      if (maxRedirects <= 0) {
        return res.status(500).json({ error: 'Too many redirects when downloading image' });
      }

      const parsed = new URL(targetUrl);
      const client = parsed.protocol === 'http:' ? http : https;
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': parsed.origin,
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      };

      const request = client.get(targetUrl, options, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const nextUrl = new URL(response.headers.location, targetUrl).toString();
          return fetchAndPipe(nextUrl, maxRedirects - 1);
        }

        if (response.statusCode !== 200) {
          return res.status(response.statusCode).json({ error: `Image source returned HTTP ${response.statusCode}` });
        }

        const contentType = response.headers['content-type'] || 'image/jpeg';
        let ext = 'jpg';
        if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('gif')) ext = 'gif';
        else if (contentType.includes('svg')) ext = 'svg';
        else if (contentType.includes('avif')) ext = 'avif';

        const baseTitle = (filename || 'photo').slice(0, 50).replace(/[^\w\d-_]/g, '_');
        const finalName = `${baseTitle}.${ext}`;
        const safeAsciiName = finalName.replace(/[^\w\d._-]/g, '_');
        const encodedName = encodeURIComponent(finalName).replace(/['()]/g, escape).replace(/\*/g, '%2A');

        res.setHeader('Content-Type', contentType);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`
        );

        response.pipe(res);
      });

      request.on('error', (err) => {
        if (!res.headersSent) {
          res.status(500).json({ error: `Failed to download image: ${err.message}` });
        }
      });
    }

    fetchAndPipe(url);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// Fallback to client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

ensureYtDlpBinary().then(() => {
  app.listen(PORT, () => console.log(`SaveIt server running on http://localhost:${PORT}`));
}).catch((err) => {
  console.warn('Startup binary check warning:', err.message);
  app.listen(PORT, () => console.log(`SaveIt server running on http://localhost:${PORT}`));
});
