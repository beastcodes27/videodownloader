import React, { useState } from 'react';

export default function BatchDownloader({ isOpen, onClose, onAddHistoryItem }) {
  const [rawText, setRawText] = useState('');
  const [items, setItems] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [downloadingIdx, setDownloadingIdx] = useState(null);

  if (!isOpen) return null;

  const handleParseLinks = async () => {
    const urls = rawText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => /^https?:\/\//i.test(u));

    if (urls.length === 0) return;

    setProcessing(true);
    const parsedList = urls.map((url, idx) => ({
      id: `${Date.now()}_${idx}`,
      url,
      status: 'pending', // pending, fetching, ready, error
      title: 'Extracting metadata...',
      thumbnail: '',
      platform: 'auto',
      error: '',
    }));

    setItems(parsedList);

    // Concurrently fetch metadata for each link (in chunks)
    for (let i = 0; i < parsedList.length; i++) {
      const itm = parsedList[i];
      setItems((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'fetching' } : item))
      );

      try {
        const res = await fetch(`/api/info?url=${encodeURIComponent(itm.url)}`);
        const data = await res.json();
        if (res.ok && !data.error) {
          setItems((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    status: 'ready',
                    title: data.title || itm.url,
                    thumbnail: data.thumbnail || (data.images && data.images[0]?.url) || '',
                    platform: data.platform || 'universal',
                    duration: data.duration || 0,
                  }
                : item
            )
          );
          if (onAddHistoryItem) {
            onAddHistoryItem({
              url: itm.url,
              title: data.title || itm.url,
              thumbnail: data.thumbnail || '',
              platform: data.platform || 'universal',
            });
          }
        } else {
          setItems((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? { ...item, status: 'error', error: data.error || 'Failed to extract' }
                : item
            )
          );
        }
      } catch (err) {
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'error', error: 'Network error' } : item
          )
        );
      }
    }

    setProcessing(false);
  };

  const handleDownloadSingle = (item, idx, mode = 'video') => {
    setDownloadingIdx(idx);
    const params = new URLSearchParams({
      url: item.url,
      mode,
    });
    const a = document.createElement('a');
    a.href = `/api/download?${params.toString()}`;
    const safeTitle = (item.title || 'batch_dl').slice(0, 40).replace(/[^\w\d-_]/g, '_');
    a.download = `${safeTitle}.${mode === 'audio' ? 'mp3' : 'mp4'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => setDownloadingIdx(null), 8000);
  };

  const handleDownloadAll = (mode = 'video') => {
    const readyItems = items.filter((x) => x.status === 'ready');
    readyItems.forEach((itm, idx) => {
      setTimeout(() => {
        handleDownloadSingle(itm, idx, mode);
      }, idx * 1200);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container batch-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            <h3 className="modal-title">Batch Multi-Link Downloader</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="modal-body batch-body">
          <p className="batch-hint">
            Paste multiple video or audio links (one URL per line) from YouTube, TikTok, Facebook, or Instagram:
          </p>

          <textarea
            className="batch-textarea"
            rows="4"
            placeholder="https://www.youtube.com/watch?v=...&#10;https://www.tiktok.com/@user/video/...&#10;https://www.facebook.com/watch/?v=..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={processing}
          />

          <div className="batch-action-bar">
            <button
              className="batch-parse-btn"
              onClick={handleParseLinks}
              disabled={processing || !rawText.trim()}
            >
              {processing ? (
                <>
                  <span className="btn-spinner-white" />
                  <span>Processing Links...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <span>Fetch All ({rawText.split('\n').filter((u) => /^https?:\/\//i.test(u.trim())).length} Links)</span>
                </>
              )}
            </button>
          </div>

          {items.length > 0 && (
            <div className="batch-results-wrapper">
              <div className="batch-results-header">
                <h4>Queue ({items.filter((x) => x.status === 'ready').length}/{items.length} Ready)</h4>
                <div className="batch-group-btns">
                  <button
                    className="batch-dl-all-btn"
                    onClick={() => handleDownloadAll('video')}
                    disabled={!items.some((x) => x.status === 'ready')}
                  >
                    Download All Video (MP4)
                  </button>
                  <button
                    className="batch-dl-all-btn audio"
                    onClick={() => handleDownloadAll('audio')}
                    disabled={!items.some((x) => x.status === 'ready')}
                  >
                    Download All Audio (MP3)
                  </button>
                </div>
              </div>

              <div className="batch-list">
                {items.map((item, idx) => (
                  <div key={item.id} className={`batch-item-card ${item.status}`}>
                    <div className="batch-thumb-mini">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} />
                      ) : (
                        <div className="batch-thumb-placeholder">
                          {item.status === 'fetching' ? '...' : 'URL'}
                        </div>
                      )}
                    </div>
                    <div className="batch-item-meta">
                      <span className="batch-platform-tag">{item.platform?.toUpperCase()}</span>
                      <h5 className="batch-item-title">{item.title}</h5>
                      {item.error && <p className="batch-item-err">{item.error}</p>}
                    </div>
                    <div className="batch-item-actions">
                      {item.status === 'ready' && (
                        <>
                          <button
                            className="batch-mini-dl"
                            onClick={() => handleDownloadSingle(item, idx, 'video')}
                            disabled={downloadingIdx === idx}
                            title="Download MP4"
                          >
                            MP4
                          </button>
                          <button
                            className="batch-mini-dl audio"
                            onClick={() => handleDownloadSingle(item, idx, 'audio')}
                            disabled={downloadingIdx === idx}
                            title="Download MP3"
                          >
                            MP3
                          </button>
                        </>
                      )}
                      {item.status === 'fetching' && <span className="btn-spinner-green" />}
                      {item.status === 'error' && <span className="batch-err-badge">Failed</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <span className="modal-meta-info">High-speed batch parallel processing</span>
          <button className="modal-action-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
