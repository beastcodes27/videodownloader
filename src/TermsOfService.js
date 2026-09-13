import React from 'react';

export default function TermsOfService({ onBack }) {
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
        <h1 className="policy-title">Terms of Service & Usage Policy</h1>
        <p className="policy-updated">Last Updated: September 2026</p>
      </div>

      <div className="policy-content">
        <section className="policy-section">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using SaveVideo, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you are prohibited from using this service.
          </p>
        </section>

        <section className="policy-section">
          <h2>2. Permitted Use & Copyright Compliance</h2>
          <p>
            SaveVideo is provided as a utility for personal, non-commercial, and fair-use purposes (such as offline viewing of public content, personal archiving, educational analysis, or content creation where permitted by law).
          </p>
          <ul>
            <li>Users must respect intellectual property and copyright laws applicable in their jurisdiction.</li>
            <li>You agree not to use SaveVideo to download copyrighted materials without the explicit permission of the copyright owner or legal fair-use entitlement.</li>
            <li>Users assume all legal responsibility for content downloaded through this utility.</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>3. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service to distribute malware, bypass security controls, or launch denial-of-service attacks against third-party platforms.</li>
            <li>Automate bulk abuse or scrapers that overload our infrastructure.</li>
            <li>Engage in any activity that infringes on the rights of third parties or violates platform terms of service.</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>4. Disclaimer of Warranties</h2>
          <p>
            SaveVideo is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind, whether express or implied. We do not guarantee uninterrupted uptime, speed, or compatibility with every third-party URL or media container format.
          </p>
        </section>

        <section className="policy-section">
          <h2>5. Limitation of Liability</h2>
          <p>
            Under no circumstances shall SaveVideo, its creators, or contributors be held liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this service, or any intellectual property disputes arising from downloaded content.
          </p>
        </section>

        <section className="policy-section">
          <h2>6. DMCA & Takedown Inquiries</h2>
          <p>
            SaveVideo does not host or store media files. All streams are delivered ephemerally from source servers directly to the client. If you believe your intellectual property rights are impacted, please contact the host platform or submit a notice to the repository maintainers.
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

