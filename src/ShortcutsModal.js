import React from 'react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '/', description: 'Focus search input from anywhere' },
    { key: 'Enter', description: 'Fetch and parse entered media link' },
    { key: 'Alt + H', description: 'Open download history & bookmarks' },
    { key: 'Alt + B', description: 'Open batch multi-link downloader' },
    { key: 'Alt + T', description: 'Toggle Dark / Light mode theme' },
    { key: 'Alt + P', description: 'Open in-app media preview' },
    { key: '?', description: 'View keyboard shortcuts guide' },
    { key: 'Esc', description: 'Close any active modal or overlay' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="6" y1="8" x2="6" y2="8" />
              <line x1="10" y1="8" x2="10" y2="8" />
              <line x1="14" y1="8" x2="14" y2="8" />
              <line x1="18" y1="8" x2="18" y2="8" />
              <line x1="6" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="18" y2="12" />
              <line x1="8" y1="16" x2="16" y2="16" />
            </svg>
            <h3 className="modal-title">Keyboard Shortcuts</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="modal-body shortcuts-body">
          <p className="shortcuts-desc">
            Boost your productivity with quick keyboard shortcuts for fast media extraction and management.
          </p>

          <div className="shortcuts-grid">
            {shortcuts.map((s, idx) => (
              <div key={idx} className="shortcut-row">
                <span className="shortcut-label">{s.description}</span>
                <kbd className="shortcut-kbd">{s.key}</kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <span className="modal-meta-info">Press Esc anytime to close</span>
          <button className="modal-action-btn" onClick={onClose}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
