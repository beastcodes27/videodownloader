const express = require('express');
const cors = require('cors');
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'build')));

const isTikTok = (url) =>
  /tiktok\.com/i.test(url) || /vm\.tiktok/i.test(url);

app.get('/api/info', (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const raw = execSync(`yt-dlp --dump-json --no-download "${url}"`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    const data = JSON.parse(raw);

    const tik = isTikTok(url);

    const formats = (data.formats || []).map(f => {
      let quality = f.format_note || f.resolution || f.abr || 'unknown';
      if (tik && !quality || quality === 'None') {
        const m = f.format_id.match(/_(\d+p)_/);
        quality = m ? m[1] : f.resolution || 'unknown';
      }
      return {
        formatId: f.format_id,
        quality,
        ext: f.ext,
        hasVideo: f.vcodec && f.vcodec !== 'none',
        hasAudio: f.acodec && f.acodec !== 'none',
        filesize: f.filesize || f.filesize_approx || null,
        tbr: f.tbr,
      };
    });

    res.json({
      title: data.title,
      thumbnail: data.thumbnail,
      duration: data.duration,
      author: data.uploader || data.channel,
      formats,
      isTikTok: tik,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/download', (req, res) => {
  try {
    const { url, quality, formatId } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const tmpDir = fs.mkdtempSync(path.join(__dirname, 'dl-'));
    const outTmpl = path.join(tmpDir, '%(title)s.%(ext)s');

    let format;
    let label;

    if (formatId) {
      format = formatId;
      label = 'audio';
    } else if (quality) {
      if (isTikTok(url)) {
        format = `best[height<=${quality.replace('p', '')}]`;
      } else {
        const height = quality.replace('p', '');
        format = `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`;
      }
      label = quality;
    } else {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      return res.status(400).json({ error: 'quality or formatId required' });
    }

    const proc = spawn('yt-dlp', [
      '-f', format,
      '--ffmpeg-location', ffmpegPath,
      '-o', outTmpl,
      '--no-part',
      '--no-progress',
      '--merge-output-format', 'mp4',
      '--print', 'after_move:filename',
      url,
    ]);

    let output = '';
    let errorOutput = '';
    proc.stdout.on('data', (chunk) => { output += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { errorOutput += chunk.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return res.status(500).json({ error: `Download failed: ${errorOutput.slice(0, 300)}` });
      }
      const files = fs.readdirSync(tmpDir);
      if (files.length === 0) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return res.status(500).json({ error: 'File not found after download' });
      }
      const filePath = path.join(tmpDir, files[0]);
      res.download(filePath, (err) => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        if (err) console.error('Send error:', err);
      });
    });

    req.on('close', () => {
      proc.kill();
      setTimeout(() => {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      }, 5000);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
