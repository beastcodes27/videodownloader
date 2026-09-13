import React from 'react';

export default function VideoPlayerModal({ info, onClose }) {
  if (!info) return null;

  const isDirectImage = info.isImageOnly || (info.images?.length > 0 && !info.videoFormats?.length);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <span className="modal-badge">{info.platform?.toUpperCase() || 'MEDIA'}</span>
            <h3 className="modal-title">{info.title}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close preview">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {isDirectImage ? (
            <div className="modal-image-preview">
              <img src={info.thumbnail || info.images[0]?.url} alt={info.title} />
            </div>
          ) : (
            <div className="modal-video-wrapper">
              <img
                src={info.thumbnail}
                alt={info.title}
                className="modal-backdrop-thumb"
              />
              <div className="modal-player-overlay">
                <div className="player-info-card">
                  <div className="player-avatar-circle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <h4>{info.title}</h4>
                  <p>Channel: <strong>{info.author}</strong></p>
                  {info.duration > 0 && <span className="player-duration-pill">{Math.floor(info.duration / 60)}:{(info.duration % 60).toString().padStart(2, '0')}</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <span className="modal-meta-info">Previewing stream metadata safely</span>
          <button className="modal-action-btn" onClick={onClose}>
            Back to Formats
          </button>
        </div>
      </div>
    </div>
  );
}
