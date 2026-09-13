import { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('auto');
  const [tab, setTab] = useState('video');

  const sanitizeInputUrl = (input) => {
    if (!input) return '';
    let cleaned = input.trim();
    try {
      const parsed = new URL(cleaned);
      ['si', 'feature', 'utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'].forEach((p) => {
        parsed.searchParams.delete(p);
      });
      return parsed.toString();
    } catch {
      return cleaned;
    }
  };

  const fetchInfo = async () => {
    const cleanUrl = sanitizeInputUrl(url);
    if (!cleanUrl) {
      setError('Please enter a valid video, audio, or image URL');
      return;
    }

    // URL validation depending on platform
    if (platform === 'youtube' && !/youtube\.com|youtu\.be/i.test(cleanUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }
    if (platform === 'tiktok' && !/tiktok\.com|vm\.tiktok|vt\.tiktok/i.test(cleanUrl)) {
      setError('Please enter a valid TikTok URL');
      return;
    }
    if (platform === 'facebook' && !/facebook\.com|fb\.watch|fb\.com|fb\.gg/i.test(cleanUrl)) {
      setError('Please enter a valid Facebook URL');
      return;
    }
    if (platform === 'instagram' && !/instagram\.com/i.test(cleanUrl)) {
      setError('Please enter a valid Instagram URL');
      return;
    }
    if (platform === 'twitter' && !/twitter\.com|x\.com/i.test(cleanUrl)) {
      setError('Please enter a valid X (Twitter) URL');
      return;
    }

    setLoading(true);
    setError('');
    setInfo(null);

    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(cleanUrl)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to fetch content info');
      } else {
        setInfo(data);
        if (data.isImageOnly || (!data.videoFormats?.length && data.images?.length > 0)) {
          setTab('photos');
        } else {
          setTab('video');
        }
      }
    } catch (err) {
      setError('Network error: Unable to connect to backend server');
    }
    setLoading(false);
  };

  const handleDownload = (opts) => {
    const { quality, formatId, mode, ext } = opts;
    const downloadKey = formatId || quality;
    setDownloading(downloadKey);

    const params = new URLSearchParams({
      url: sanitizeInputUrl(url),
      mode: mode || (formatId ? 'audio' : 'video'),
    });

    if (quality) params.append('quality', quality);
    if (formatId) params.append('formatId', formatId);

    const a = document.createElement('a');
    a.href = `/api/download?${params.toString()}`;
    const safeTitle = (info?.title || 'download').slice(0, 40).replace(/[^\w\d-_]/g, '_');
    a.download = `${safeTitle}.${ext || (mode === 'audio' ? 'mp3' : 'mp4')}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => setDownloading(null), 12000);
  };

  const handleDownloadImage = (img, index) => {
    const downloadKey = img.url;
    setDownloading(downloadKey);

    const a = document.createElement('a');
    const safeTitle = (info?.title || 'photo').slice(0, 40).replace(/[^\w\d-_]/g, '_');
    const filename = `${safeTitle}_photo_${index + 1}`;
    a.href = `/api/download-image?url=${encodeURIComponent(img.url)}&filename=${encodeURIComponent(filename)}`;
    a.download = `${filename}.${img.ext || 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => setDownloading(null), 8000);
  };

  const formatDuration = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const hrs = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (hrs > 0) {
      return `${hrs}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes <= 0) return '';
    const mb = (bytes / 1024 / 1024).toFixed(1);
    return `~${mb} MB`;
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
            <h1 className="title">SaveVideo & Media</h1>
          </div>
          <p className="subtitle">Download videos, audios, and photos in any format</p>
        </div>

        <div className="platform-menu">
          <button
            className={`platform-btn ${platform === 'auto' ? 'active' : ''}`}
            onClick={() => { setPlatform('auto'); setError(''); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Any Link
          </button>
          <button
            className={`platform-btn ${platform === 'youtube' ? 'active' : ''}`}
            onClick={() => { setPlatform('youtube'); setError(''); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube
          </button>
          <button
            className={`platform-btn ${platform === 'tiktok' ? 'active' : ''}`}
            onClick={() => { setPlatform('tiktok'); setError(''); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.3 6.32-1.98.01 1.56-.01 3.12-.01 4.68-1.17-.36-2.56-.2-3.47.71-.66.66-.99 1.61-.95 2.56.04 1.07.57 2.07 1.38 2.74.73.6 1.73.88 2.69.68.88-.18 1.64-.75 2.1-1.53.2-.36.33-.76.37-1.16.1-1.44.02-2.89.02-4.33.01-3.88.01-7.76.01-11.64Z"/>
            </svg>
            TikTok
          </button>
          <button
            className={`platform-btn ${platform === 'facebook' ? 'active' : ''}`}
            onClick={() => { setPlatform('facebook'); setError(''); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
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
            placeholder={
              platform === 'youtube'
                ? 'Paste YouTube link (video, shorts, music)...'
                : platform === 'tiktok'
                ? 'Paste TikTok link (video, photo slideshow)...'
                : platform === 'facebook'
                ? 'Paste Facebook video, photo, or reel link...'
                : 'Paste any video, audio, or photo URL (YouTube, TikTok, Facebook, Instagram, direct image)...'
            }
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
          />
          {url && (
            <button
              className="clear-btn"
              type="button"
              onClick={() => { setUrl(''); setInfo(null); setError(''); }}
              title="Clear"
            >
              ✕
            </button>
          )}
          <button className="get-btn" onClick={fetchInfo} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Fetch Link'}
          </button>
        </div>

        {error && (
          <div className="error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-format shimmer" />
            ))}
          </div>
        )}

        {info && (
          <div className="video-card">
            <div className="video-preview">
              {info.thumbnail ? (
                <img src={info.thumbnail} alt={info.title} />
              ) : (
                <div className="no-thumbnail">Media</div>
              )}
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
                  {info.duration > 0 && (
                    <span className="duration">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatDuration(info.duration)}
                    </span>
                  )}
                  {info.platform && (
                    <span className="platform-tag">{info.platform.toUpperCase()}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="tabs">
              {info.videoFormats && info.videoFormats.length > 0 && (
                <button className={`tab ${tab === 'video' ? 'active' : ''}`} onClick={() => setTab('video')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  Video ({info.videoFormats.length})
                </button>
              )}
              {info.audioOptions && info.audioOptions.length > 0 && (
                <button className={`tab ${tab === 'audio' ? 'active' : ''}`} onClick={() => setTab('audio')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  Audio ({info.audioOptions.length})
                </button>
              )}
              {info.images && info.images.length > 0 && (
                <button className={`tab ${tab === 'photos' ? 'active' : ''}`} onClick={() => setTab('photos')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Photos ({info.images.length})
                </button>
              )}
            </div>

            <div className="formats">
              {tab === 'video' && (
                info.videoFormats && info.videoFormats.length > 0 ? (
                  info.videoFormats.map((f, i) => (
                    <div
                      key={i}
                      className={`format-card ${downloading === f.quality ? 'downloading' : ''}`}
                      onClick={() => handleDownload({ quality: f.quality, mode: 'video', ext: f.ext })}
                    >
                      <div className="format-info">
                        <div className="quality-badge">{f.label || f.quality}</div>
                        <div className="format-meta">
                          <span className="format-label">Video + Audio (MP4)</span>
                          <span className="format-ext">
                            {f.fps ? `${f.fps}fps ` : ''}
                            {formatSize(f.filesize)}
                          </span>
                        </div>
                      </div>
                      <button className="download-btn">
                        {downloading === f.quality ? (
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
                  <div className="no-formats">No video streams found</div>
                )
              )}

              {tab === 'audio' && (
                info.audioOptions && info.audioOptions.length > 0 ? (
                  info.audioOptions.map((a, i) => (
                    <div
                      key={i}
                      className={`format-card ${downloading === a.formatId ? 'downloading' : ''}`}
                      onClick={() => handleDownload({ formatId: a.formatId, mode: 'audio', ext: a.ext })}
                    >
                      <div className="format-info">
                        <div className="quality-badge audio">{a.quality || a.ext.toUpperCase()}</div>
                        <div className="format-meta">
                          <span className="format-label">{a.label}</span>
                          <span className="format-ext">
                            {a.ext.toUpperCase()} {formatSize(a.filesize)}
                          </span>
                        </div>
                      </div>
                      <button className="download-btn">
                        {downloading === a.formatId ? (
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
                  <div className="no-formats">No audio streams found</div>
                )
              )}

              {tab === 'photos' && (
                info.images && info.images.length > 0 ? (
                  info.images.map((img, i) => (
                    <div
                      key={i}
                      className={`format-card photo-card ${downloading === img.url ? 'downloading' : ''}`}
                      onClick={() => handleDownloadImage(img, i)}
                    >
                      <div className="photo-preview-item">
                        <img src={img.url} alt={img.label} />
                      </div>
                      <div className="format-info">
                        <div className="quality-badge photo">{img.ext ? img.ext.toUpperCase() : 'JPG'}</div>
                        <div className="format-meta">
                          <span className="format-label">{img.label}</span>
                          <span className="format-ext">
                            {img.width && img.height ? `${img.width}x${img.height} • ` : ''}
                            High Resolution Image
                          </span>
                        </div>
                      </div>
                      <button className="download-btn">
                        {downloading === img.url ? (
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
                  <div className="no-formats">No photo/image streams found</div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
