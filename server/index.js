const express = require('express');
const cors = require('cors');
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function execYtDlp(args) {
  const result = execSync(`yt-dlp ${args}`, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return result;
}

app.get('/api/info', (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const raw = execYtDlp(`--dump-json --no-download "${url}"`);
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
    const { url, formatId } = req.query;
    if (!url || !formatId) return res.status(400).json({ error: 'URL and formatId required' });

    const tmpDir = fs.mkdtempSync(path.join(__dirname, 'dl-'));
    const outTmpl = path.join(tmpDir, '%(title)s.%(ext)s');

    const proc = spawn('yt-dlp', [
      '-f', formatId,
      '-o', outTmpl,
      '--print', 'filename',
      '--no-part',
      url,
    ]);

    let filename = '';
    proc.stdout.on('data', (d) => { filename += d.toString(); });
    proc.stderr.on('data', () => {});

    proc.on('close', (code) => {
      if (code !== 0) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return res.status(500).json({ error: 'Download failed' });
      }
      filename = filename.trim().split('\n').pop();
      if (!filename || !fs.existsSync(filename)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return res.status(500).json({ error: 'File not found' });
      }
      res.download(filename, (err) => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        if (err) console.error('Download send error:', err);
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
