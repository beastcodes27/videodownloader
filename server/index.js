const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/info', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const info = await ytdl.getInfo(url);
    const formats = info.formats
      .filter(f => f.hasVideo || f.hasAudio)
      .map(f => ({
        itag: f.itag,
        quality: f.qualityLabel || f.audioQuality || 'unknown',
        container: f.container,
        hasVideo: f.hasVideo,
        hasAudio: f.hasAudio,
        contentLength: f.contentLength,
        mimeType: f.mimeType,
      }));

    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails.slice(-1)[0]?.url,
      duration: info.videoDetails.lengthSeconds,
      author: info.videoDetails.author?.name,
      formats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/download', async (req, res) => {
  try {
    const { url, itag } = req.query;
    if (!url || !itag) return res.status(400).json({ error: 'URL and itag required' });

    const info = await ytdl.getInfo(url);
    const format = info.formats.find(f => f.itag == itag);
    if (!format) return res.status(404).json({ error: 'Format not found' });

    res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.${format.container}"`);
    ytdl(url, { format }).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
