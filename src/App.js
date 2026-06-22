import { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [tab, setTab] = useState('video');

  const fetchInfo = async () => {
    if (!url.trim()) return;
    const isYT = platform === 'youtube';
    const valid = isYT
      ? /youtube\.com|youtu\.be/i.test(url)
      : /tiktok\.com|vm\.tiktok/i.test(url);
    if (!valid) {
      setError(`Please enter a valid ${isYT ? 'YouTube' : 'TikTok'} URL`);
      return;
    }
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

  const handleDownload = (quality, formatId) => {
    const params = formatId ? `formatId=${formatId}` : `quality=${quality}`;
    setDownloading(quality || formatId);
    const a = document.createElement('a');
    a.href = `/api/download?url=${encodeURIComponent(url)}&${params}`;
    a.download = `${quality || 'audio'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(null), 15000);
  };

  const videoQualities = ['360p', '480p', '720p', '1080p', '1440p', '2160p'];

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const mb = (bytes / 1024 / 1024).toFixed(1);
    return `${mb} MB`;
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          <h1 className="title">SaveVideo</h1>
           </div>
           <p className="subtitle">Download videos in any format</p>
        </div>

         <div className="search-box">
           <div className="search-icon">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="11" cy="11" r="8" />
               <line x1="21" y1="21" x2="16.65" y2="16.65" />
             </svg>
           </div>
           <input
             type="text"
             placeholder={platform === 'youtube' ? "Paste YouTube URL here..." : "Paste TikTok URL here..."}
             value={url}
             onChange={(e) => setUrl(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
           />
           <button onClick={fetchInfo} disabled={loading}>
             {loading ? <span className="spinner" /> : 'Get Video'}
           </button>
         </div>

         <div className="platform-menu">
           <button
             className={`platform-btn ${platform === 'youtube' ? 'active' : ''}`}
             onClick={() => { setPlatform('youtube'); setInfo(null); setError(''); }}
           >
             <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
               <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
             </svg>
             YouTube
           </button>
           <button
             className={`platform-btn ${platform === 'tiktok' ? 'active' : ''}`}
             onClick={() => { setPlatform('tiktok'); setInfo(null); setError(''); }}
           >
             <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
               <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.3 6.32-1.98.01 1.56-.01 3.12-.01 4.68-1.17-.36-2.56-.2-3.47.71-.66.66-.99 1.61-.95 2.56.04 1.07.57 2.07 1.38 2.74.73.6 1.73.88 2.69.68.88-.18 1.64-.75 2.1-1.53.2-.36.33-.76.37-1.16.1-1.44.02-2.89.02-4.33.01-3.88.01-7.76.01-11.64Z"/>
             </svg>
             TikTok
           </button>
         </div>

        {error && (
          <div className="error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

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
                <div className="meta-row">
                  <span className="author">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {info.author}
                  </span>
                  <span className="duration">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {formatDuration(info.duration)}
                  </span>
                </div>
              </div>
            </div>

            <div className="tabs">
              <button className={`tab ${tab === 'video' ? 'active' : ''}`} onClick={() => setTab('video')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                Video
              </button>
              <button className={`tab ${tab === 'audio' ? 'active' : ''}`} onClick={() => setTab('audio')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                Audio
              </button>
            </div>

            <div className="formats">
              {tab === 'video' ? (
                info.isTikTok ? (
                  [...new Set(info.formats.map(f => f.quality))].map((q, i) => (
                    <div key={i} className={`format-card ${downloading === q ? 'downloading' : ''}`} onClick={() => handleDownload(q)}>
                      <div className="format-info">
                        <div className="quality-badge">{q}</div>
                        <div className="format-meta">
                          <span className="format-label">Video + Audio</span>
                          <span className="format-ext">mp4</span>
                        </div>
                      </div>
                      <button className="download-btn">
                        {downloading === q ? (
                          <span className="btn-spinner" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  videoQualities.map((q, i) => (
                    <div key={i} className={`format-card ${downloading === q ? 'downloading' : ''}`} onClick={() => handleDownload(q)}>
                      <div className="format-info">
                        <div className="quality-badge">{q}</div>
                        <div className="format-meta">
                          <span className="format-label">Video + Audio</span>
                          <span className="format-ext">mp4</span>
                        </div>
                      </div>
                      <button className="download-btn">
                        {downloading === q ? (
                          <span className="btn-spinner" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))
                )
              ) : (
                info.formats
                  .filter(f => !f.hasVideo && f.hasAudio)
                  .map((f, i) => (
                  <div key={i} className={`format-card ${downloading === f.formatId ? 'downloading' : ''}`} onClick={() => handleDownload(null, f.formatId)}>
                    <div className="format-info">
                      <div className="quality-badge audio">{f.quality}</div>
                      <div className="format-meta">
                        <span className="format-label">Audio only</span>
                        <span className="format-ext">{f.ext} {formatSize(f.filesize)}</span>
                      </div>
                    </div>
                    <button className="download-btn">
                      {downloading === f.formatId ? (
                        <span className="btn-spinner" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
