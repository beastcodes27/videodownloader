import React from 'react';

export default function DownloadHistory({
  history,
  onSelectUrl,
  onClearHistory,
  onRemoveItem,
  onToggleBookmark,
  isOpen,
  onClose,
}) {
  if (!isOpen) return null;

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h3 className="modal-title">Downloads & History ({history.length})</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="modal-body history-body">
          {history.length === 0 ? (
            <div className="history-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <h4>No recent downloads yet</h4>
              <p>Fetched and downloaded media will appear here for fast 1-click re-downloading.</p>
            </div>
          ) : (
            <div className="history-items-list">
              {history.map((item) => (
                <div key={item.id || item.url} className={`history-card-item ${item.bookmarked ? 'is-bookmarked' : ''}`}>
                  <div className="history-thumb-mini" onClick={() => { onSelectUrl(item.url); onClose(); }}>
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} />
                    ) : (
                      <div className="history-thumb-placeholder">{item.platform ? item.platform[0]?.toUpperCase() : 'M'}</div>
                    )}
                  </div>

                  <div className="history-meta" onClick={() => { onSelectUrl(item.url); onClose(); }}>
                    <div className="history-title-row">
                      <span className="history-platform-badge">{item.platform?.toUpperCase() || 'LINK'}</span>
                      <span className="history-time">{formatDate(item.timestamp)}</span>
                    </div>
                    <h5 className="history-title" title={item.title}>{item.title || item.url}</h5>
                  </div>

                  <div className="history-actions">
                    <button
                      className={`history-btn-icon ${item.bookmarked ? 'active-bookmark' : ''}`}
                      onClick={() => onToggleBookmark(item.id || item.url)}
                      title={item.bookmarked ? 'Remove Bookmark' : 'Bookmark link'}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill={item.bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                    <button
                      className="history-btn-icon delete-btn"
                      onClick={() => onRemoveItem(item.id || item.url)}
                      title="Delete from history"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="modal-footer history-footer">
            <button className="history-clear-btn" onClick={onClearHistory}>
              Clear All History
            </button>
            <button className="modal-action-btn" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
