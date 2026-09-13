import React, { useState } from 'react';

export default function QRCodeModal({ url, title, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!url) return null;

  // We can generate a clean QR Code image URL via high-speed reliable QR API / SVG
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    url
  )}&margin=10&color=10-185-129`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // fallback
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <h3 className="modal-title">Scan QR for Mobile Download</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="modal-body qr-body">
          <div className="qr-wrapper-card">
            <img
              src={qrCodeUrl}
              alt="Scan QR code to open on mobile"
              className="qr-image"
              loading="eager"
            />
            <div className="qr-badge-scan">Point your camera to scan</div>
          </div>

          <div className="qr-details">
            <h4 className="qr-media-title">{title || 'Instant Mobile Transfer'}</h4>
            <p className="qr-desc">
              Scan with your iPhone or Android camera to instantly open and download this media on your mobile device.
            </p>

            <div className="qr-link-copy-box">
              <input type="text" readOnly value={url} className="qr-link-input" />
              <button className="qr-copy-btn" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <span className="modal-meta-info">Instant cross-device sync</span>
          <button className="modal-action-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
