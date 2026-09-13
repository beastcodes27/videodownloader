import React from 'react';

export default function PrivacyPolicy({ onBack }) {
  return (
    <div className="policy-page">
      <div className="policy-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Downloader
        </button>
        <h1 className="policy-title">Privacy Policy</h1>
        <p className="policy-updated">Last Updated: September 2026</p>
      </div>

      <div className="policy-content">
        <section className="policy-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to SaveVideo. We respect your privacy and are committed to protecting your personal data.
            This Privacy Policy explains how our service operates, what information is processed when you use our video,
            audio, and media download service, and your rights regarding data privacy.
          </p>
        </section>

        <section className="policy-section">
          <h2>2. Information We Do Not Collect</h2>
          <p>
            SaveVideo is designed to operate with minimal data collection:
          </p>
          <ul>
            <li>We do <strong>not</strong> require user registration, accounts, or personal information (such as names, email addresses, or passwords).</li>
            <li>We do <strong>not</strong> track or build persistent profiles of user downloading habits.</li>
            <li>We do <strong>not</strong> permanently store downloaded media files on our servers.</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>3. Transient Processing of URLs & Files</h2>
          <p>
            When you submit a URL to fetch or download media:
          </p>
          <ul>
            <li>The URL is processed temporarily in real-time to query metadata and retrieve media streams from the host platform.</li>
            <li>Any temporary files generated during conversion or stream merging are isolated in unique transient directories and <strong>immediately deleted</strong> upon download completion or process termination.</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>4. Logs and Analytics</h2>
          <p>
            Our web servers may record standard technical server logs (such as IP addresses, browser user-agent, and timestamps) solely for operational reliability, rate limiting, and DDoS mitigation. These temporary logs are rotated and purged periodically.
          </p>
        </section>

        <section className="policy-section">
          <h2>5. Third-Party Links & Platforms</h2>
          <p>
            Our service processes content from third-party platforms (including YouTube, TikTok, Facebook, Instagram, Twitter/X, and direct media sources). When using SaveVideo, media streams are requested directly from the corresponding third-party servers. We encourage users to review the privacy policies and terms of those external platforms.
          </p>
        </section>

        <section className="policy-section">
          <h2>6. Cookies & Local Storage</h2>
          <p>
            SaveVideo does not use tracking or advertising cookies. Any client-side storage (such as UI theme or preferred tabs) is saved strictly within your browser's local state and is never transmitted to third parties.
          </p>
        </section>

        <section className="policy-section">
          <h2>7. Updates to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect technological improvements or legal requirements. Any modifications will be posted directly on this page with an updated revision date.
          </p>
        </section>

        <section className="policy-section">
          <h2>8. Contact</h2>
          <p>
            If you have any questions or feedback regarding this Privacy Policy, please reach out via our GitHub repository or contact the project maintainers.
          </p>
        </section>
      </div>

      <div className="policy-footer-action">
        <button className="back-btn-primary" onClick={onBack}>
          Return to SaveVideo Downloader
        </button>
      </div>
    </div>
  );
}

