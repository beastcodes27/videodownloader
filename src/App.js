import { useState, useEffect } from 'react';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('auto');
  const [tab, setTab] = useState('video');
  const [page, setPage] = useState('home');
  const [activeFaq, setActiveFaq] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('savevideo_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('savevideo_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#privacy') setPage('privacy');
      else if (hash === '#terms' || hash === '#policy') setPage('terms');
      else setPage('home');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (targetPage) => {
    setPage(targetPage);
    if (targetPage === 'privacy') window.location.hash = 'privacy';
    else if (targetPage === 'terms') window.location.hash = 'terms';
    else {
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text);
          fetchInfoForUrl(text);
        }
      }
    } catch {
      // clipboard permission denied or not available
    }
  };

  const fetchInfoForUrl = async (targetUrl) => {
    const cleanUrl = sanitizeInputUrl(targetUrl || url);
    if (!cleanUrl) {
      setError('Please enter a valid video, audio, or image URL');
      return;
    }

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
        setTimeout(() => {
          const cardEl = document.getElementById('result-card');
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
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

  const faqs = [
    {
      q: 'How do I download videos using SaveVideo?',
      a: 'Simply copy the video URL from YouTube, TikTok, Facebook, or Instagram, paste it into the search box above, and click "Download". Select your preferred quality and format to save it directly to your device.'
    },
    {
      q: 'Is SaveVideo free to use?',
      a: 'Yes, SaveVideo is 100% free with unlimited downloads. There are no registrations, paywalls, or download limits.'
    },
    {
      q: 'What video and audio formats are supported?',
      a: 'We support MP4 video in resolutions up to 4K (2160p, 1440p, 1080p, 720p, 480p, 360p), MP3 audio up to 320 kbps high bitrate, and high-resolution JPEG/PNG photos.'
    },
    {
      q: 'Where are downloaded files saved on my device?',
      a: 'Files are automatically saved to your browser\'s default "Downloads" folder on Windows, Mac, Android, and iOS.'
    },
    {
      q: 'Does SaveVideo store or keep copies of downloaded videos?',
      a: 'No. SaveVideo does not host or store any media on our servers. All downloads are fetched ephemerally in real-time from source servers directly to your browser and immediately wiped.'
    }
  ];

  return (
    <div className="app">
      {/* Top Navigation Bar */}
      <header className="navbar">
        <div className="nav-container">
          <div className="brand" onClick={() => navigateTo('home')}>
            <div className="brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <span className="brand-name">ss<span className="brand-highlight">video</span></span>
          </div>

          <div className="nav-actions">
            <button
              className="theme-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          {page === 'privacy' && <PrivacyPolicy onBack={() => navigateTo('home')} />}
          {page === 'terms' && <TermsOfService onBack={() => navigateTo('home')} />}

          {page === 'home' && (
            <>
              {/* Hero Section */}
              <div className="hero-section">
                <h1 className="hero-title">Online Video Downloader</h1>
                <p className="hero-subtitle">
                  Download YouTube videos, TikToks without watermark, Facebook reels, audio & photos in high quality.
                </p>

                {/* Platform Selector Pills */}
                <div className="platform-pills">
                  <button
                    className={`pill-btn ${platform === 'auto' ? 'active' : ''}`}
                    onClick={() => { setPlatform('auto'); setError(''); }}
                  >
                    Universal / Any Link
                  </button>
                  <button
                    className={`pill-btn ${platform === 'youtube' ? 'active' : ''}`}
                    onClick={() => { setPlatform('youtube'); setError(''); }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    YouTube
                  </button>
                  <button
                    className={`pill-btn ${platform === 'tiktok' ? 'active' : ''}`}
                    onClick={() => { setPlatform('tiktok'); setError(''); }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.3 6.32-1.98.01 1.56-.01 3.12-.01 4.68-1.17-.36-2.56-.2-3.47.71-.66.66-.99 1.61-.95 2.56.04 1.07.57 2.07 1.38 2.74.73.6 1.73.88 2.69.68.88-.18 1.64-.75 2.1-1.53.2-.36.33-.76.37-1.16.1-1.44.02-2.89.02-4.33.01-3.88.01-7.76.01-11.64Z"/>
                    </svg>
                    TikTok
                  </button>
                  <button
                    className={`pill-btn ${platform === 'facebook' ? 'active' : ''}`}
                    onClick={() => { setPlatform('facebook'); setError(''); }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                </div>

                {/* SSYouTube Search Box */}
                <div className="search-wrapper">
                  <div className="search-input-group">
                    <input
                      type="text"
                      className="main-search-input"
                      placeholder="Paste your video link here..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchInfoForUrl()}
                    />
                    {url ? (
                      <button
                        className="search-clear-btn"
                        type="button"
                        onClick={() => { setUrl(''); setInfo(null); setError(''); }}
                        title="Clear"
                      >
                        ✕
                      </button>
                    ) : (
                      <button
                        className="search-paste-btn"
                        type="button"
                        onClick={handlePaste}
                        title="Paste from clipboard"
                      >
                        Paste
                      </button>
                    )}
                    <button
                      className="main-download-btn"
                      onClick={() => fetchInfoForUrl()}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="btn-spinner-white" />
                      ) : (
                        <>
                          <span>Download</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="terms-hint">
                    By using our service you accept our <span className="link-text" onClick={() => navigateTo('terms')}>Terms of Service</span>.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="error-banner">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Skeleton Loading State */}
              {loading && (
                <div className="ss-card skeleton-box">
                  <div className="skeleton-thumb-box shimmer" />
                  <div className="skeleton-content">
                    <div className="skeleton-line-thick shimmer" />
                    <div className="skeleton-line-thin shimmer" />
                    <div className="skeleton-button-row shimmer" />
                  </div>
                </div>
              )}

              {/* Result Video Card (SSYouTube Style) */}
              {info && (
                <div id="result-card" className="ss-card result-box">
                  <div className="result-thumb-wrapper">
                    {info.thumbnail ? (
                      <img src={info.thumbnail} alt={info.title} className="result-thumb-img" />
                    ) : (
                      <div className="no-thumbnail-box">Media</div>
                    )}
                    {info.duration > 0 && (
                      <span className="duration-badge">{formatDuration(info.duration)}</span>
                    )}
                  </div>

                  <div className="result-details">
                    <h2 className="result-title" title={info.title}>{info.title}</h2>
                    <div className="result-meta">
                      <span className="author-tag">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        {info.author}
                      </span>
                      {info.platform && (
                        <span className="platform-pill">{info.platform.toUpperCase()}</span>
                      )}
                    </div>

                    {/* Format Tabs */}
                    <div className="format-tabs">
                      {info.videoFormats && info.videoFormats.length > 0 && (
                        <button className={`ftab ${tab === 'video' ? 'active' : ''}`} onClick={() => setTab('video')}>
                          Video ({info.videoFormats.length})
                        </button>
                      )}
                      {info.audioOptions && info.audioOptions.length > 0 && (
                        <button className={`ftab ${tab === 'audio' ? 'active' : ''}`} onClick={() => setTab('audio')}>
                          Audio MP3 ({info.audioOptions.length})
                        </button>
                      )}
                      {info.images && info.images.length > 0 && (
                        <button className={`ftab ${tab === 'photos' ? 'active' : ''}`} onClick={() => setTab('photos')}>
                          Photos ({info.images.length})
                        </button>
                      )}
                    </div>

                    {/* Format Download Rows */}
                    <div className="format-rows">
                      {tab === 'video' && (
                        info.videoFormats?.map((f, i) => (
                          <div key={i} className="format-row">
                            <div className="format-row-left">
                              <span className="badge-quality">{f.label || f.quality}</span>
                              <span className="format-subtext">MP4 • {f.fps ? `${f.fps}fps ` : ''}{formatSize(f.filesize)}</span>
                            </div>
                            <button
                              className={`row-dl-btn ${downloading === f.quality ? 'loading' : ''}`}
                              onClick={() => handleDownload({ quality: f.quality, mode: 'video', ext: f.ext })}
                            >
                              {downloading === f.quality ? (
                                <span className="btn-spinner-white" />
                              ) : (
                                <>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                  </svg>
                                  <span>Download</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))
                      )}

                      {tab === 'audio' && (
                        info.audioOptions?.map((a, i) => (
                          <div key={i} className="format-row">
                            <div className="format-row-left">
                              <span className="badge-quality audio">{a.quality || 'MP3'}</span>
                              <span className="format-subtext">{a.label}</span>
                            </div>
                            <button
                              className={`row-dl-btn audio ${downloading === a.formatId ? 'loading' : ''}`}
                              onClick={() => handleDownload({ formatId: a.formatId, mode: 'audio', ext: a.ext })}
                            >
                              {downloading === a.formatId ? (
                                <span className="btn-spinner-white" />
                              ) : (
                                <>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                  </svg>
                                  <span>Download MP3</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))
                      )}

                      {tab === 'photos' && (
                        info.images?.map((img, i) => (
                          <div key={i} className="format-row photo-row">
                            <div className="photo-thumb-mini">
                              <img src={img.url} alt={img.label} />
                            </div>
                            <div className="format-row-left">
                              <span className="badge-quality photo">{img.ext?.toUpperCase() || 'JPG'}</span>
                              <span className="format-subtext">{img.label} {img.width ? `(${img.width}x${img.height})` : ''}</span>
                            </div>
                            <button
                              className={`row-dl-btn photo ${downloading === img.url ? 'loading' : ''}`}
                              onClick={() => handleDownloadImage(img, i)}
                            >
                              {downloading === img.url ? (
                                <span className="btn-spinner-white" />
                              ) : (
                                <>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                  </svg>
                                  <span>Download Image</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step-by-Step Guide Section */}
              <section className="guide-section">
                <h2 className="section-heading">How to Download Online Videos?</h2>
                <div className="steps-grid">
                  <div className="step-card">
                    <div className="step-number">1</div>
                    <h3>Copy Video URL</h3>
                    <p>Open YouTube, TikTok, Facebook, or any site and copy the link of the video or audio.</p>
                  </div>
                  <div className="step-card">
                    <div className="step-number">2</div>
                    <h3>Paste Link</h3>
                    <p>Paste the copied link into the search box above and press the Download button.</p>
                  </div>
                  <div className="step-card">
                    <div className="step-number">3</div>
                    <h3>Save Media</h3>
                    <p>Choose your desired resolution (HD, Full HD, 4K) or MP3 audio and start downloading instantly.</p>
                  </div>
                </div>
              </section>

              {/* Supported Platforms Grid */}
              <section className="platforms-section">
                <h2 className="section-heading">Supported Platforms</h2>
                <div className="supported-grid">
                  <div className="supported-card">
                    <div className="icon-circle yt">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    <h4>YouTube</h4>
                    <p>Videos, Shorts & Audio</p>
                  </div>
                  <div className="supported-card">
                    <div className="icon-circle tt">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.3 6.32-1.98.01 1.56-.01 3.12-.01 4.68-1.17-.36-2.56-.2-3.47.71-.66.66-.99 1.61-.95 2.56.04 1.07.57 2.07 1.38 2.74.73.6 1.73.88 2.69.68.88-.18 1.64-.75 2.1-1.53.2-.36.33-.76.37-1.16.1-1.44.02-2.89.02-4.33.01-3.88.01-7.76.01-11.64Z"/>
                      </svg>
                    </div>
                    <h4>TikTok</h4>
                    <p>No watermark & Slides</p>
                  </div>
                  <div className="supported-card">
                    <div className="icon-circle fb">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <h4>Facebook</h4>
                    <p>Reels, HD & SD Videos</p>
                  </div>
                  <div className="supported-card">
                    <div className="icon-circle ig">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </div>
                    <h4>Instagram</h4>
                    <p>Reels & Photo Carousels</p>
                  </div>
                </div>
              </section>

              {/* FAQ Accordion Section */}
              <section className="faq-section">
                <h2 className="section-heading">Frequently Asked Questions</h2>
                <div className="faq-list">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className={`faq-item ${activeFaq === idx ? 'open' : ''}`}
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    >
                      <div className="faq-question">
                        <span>{faq.q}</span>
                        <span className="faq-toggle-icon">{activeFaq === idx ? '−' : '+'}</span>
                      </div>
                      {activeFaq === idx && (
                        <div className="faq-answer">
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* SSYouTube Style Footer */}
              <footer className="site-footer">
                <div className="footer-top">
                  <div className="footer-brand">
                    <span className="brand-name-sm">ss<span className="brand-highlight">video</span></span>
                    <p className="footer-tagline">Fast & Free Online Media Downloader</p>
                  </div>
                  <div className="footer-nav">
                    <button className="fnav-link" onClick={() => navigateTo('privacy')}>Privacy Policy</button>
                    <button className="fnav-link" onClick={() => navigateTo('terms')}>Terms of Service</button>
                  </div>
                </div>
                <div className="footer-bottom">
                  <p className="disclaimer-txt">
                    Disclaimer: SaveVideo does not host or store copyrighted media. All media streams are delivered directly from third-party platforms.
                  </p>
                  <p className="copyright-txt">© 2026 SSVideo Downloader. All rights reserved.</p>
                </div>
              </footer>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
