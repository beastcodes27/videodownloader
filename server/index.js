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

app.get('/api/info', (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const raw = execSync(`yt-dlp --dump-json --no-download "${url}"`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    const data = JSON.parse(raw);

    const formats = (data.formats || []).map(f => ({
      formatId: f.format_id,
      quality: f.format_note || f.resolution || f.abr || 'unknown',
      ext: f.ext,
      hasVideo: f.vcodec && f.vcodec !== 'none',
      hasAudio: f.acodec && f.acodec !== 'none',
      filesize: f.filesize || f.filesize_approx || null,
      tbr: f.tbr,
    }));

    res.json({
      title: data.title,
      thumbnail: data.thumbnail,
      duration: data.duration,
      author: data.uploader || data.channel,
      formats,
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
    const outPath = path.join(tmpDir, 'output.mp4');

    let format;
    let filename;

    if (formatId) {
      format = formatId;
      filename = 'audio';
    } else if (quality) {
      const height = quality.replace('p', '');
      format = `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`;
      filename = `video-${quality}`;
    } else {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      return res.status(400).json({ error: 'quality or formatId required' });
    }

    const proc = spawn('yt-dlp', [
      '-f', format,
      '--ffmpeg-location', ffmpegPath,
      '-o', outPath,
      '--no-part',
      '--no-progress',
      '--merge-output-format', 'mp4',
      url,
    ]);

    let errorOutput = '';
    proc.stderr.on('data', (chunk) => { errorOutput += chunk.toString(); });

    proc.on('close', (code) => {
      if (code !== 0 || !fs.existsSync(outPath)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return res.status(500).json({ error: `Download failed: ${errorOutput.slice(0, 300)}` });
      }
      res.download(outPath, `${filename}.mp4`, (err) => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        if (err) console.error('Send error:', err);
      });
    });

    req.on('close', () => {
      proc.kill();
      setTimeout(() => fs.rmSync(tmpDir, { recursive: true, force: true }), 5000);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));