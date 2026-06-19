import { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('video');

  const fetchInfo = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setInfo(null);
    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setInfo(data);
    } catch {
      setError('Failed to fetch video info');
    }
    setLoading(false);
  };

  const handleDownload = (formatId) => {
    window.open(`/api/download?url=${encodeURIComponent(url)}&formatId=${formatId}`, '_blank');
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">SaveVideo</h1>
        <p className="subtitle">Download YouTube videos in any format</p>

        <div className="search-box">
          <input
            type="text"
            placeholder="Paste YouTube URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
          />
          <button onClick={fetchInfo} disabled={loading}>
            {loading ? 'Fetching...' : 'Get Video'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {loading && (
          <div className="skeleton">
            <div className="skeleton-preview">
              <div className="skeleton-thumb shimmer" />
              <div className="skeleton-details">
                <div className="skeleton-line shimmer w-80" />
                <div className="skeleton-line shimmer w-50" />
                <div className="skeleton-line shimmer w-30" />
              </div>
            </div>
            <div className="skeleton-tabs">
              <div className="skeleton-tab shimmer" />
              <div className="skeleton-tab shimmer" />
            </div>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skeleton-format shimmer" />
            ))}
          </div>
        )}

        {info && (
          <div className="video-card">
            <div className="video-preview">
              <img src={info.thumbnail} alt={info.title} />
              <div className="video-details">
                <h2>{info.title}</h2>
                <p className="author">{info.author}</p>
                <p className="duration">{formatDuration(info.duration)}</p>
              </div>
            </div>

            <h3>Available Formats</h3>
            <div className="tabs">
              <button className={`tab ${tab === 'video' ? 'active' : ''}`} onClick={() => setTab('video')}>Video</button>
              <button className={`tab ${tab === 'audio' ? 'active' : ''}`} onClick={() => setTab('audio')}>Audio</button>
            </div>
            <div className="formats">
              {info.formats
                .filter(f => tab === 'video' ? f.hasVideo : (!f.hasVideo && f.hasAudio))
                .map((f, i) => (
                <div key={i} className="format-card" onClick={() => handleDownload(f.formatId)}>
                  <div className="format-info">
                    <span className="quality">{f.quality}</span>
                    <span className="meta">
                      {f.hasVideo && !f.hasAudio && '🎬 Video only'}
                      {!f.hasVideo && f.hasAudio && '🎵 Audio only'}
                      {f.hasVideo && f.hasAudio && '🎬 Video + Audio'}
                    </span>
                    <span className="container">{f.ext}</span>
                  </div>
                  <button className="download-btn">Download</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
