import React, { useEffect } from 'react';
import {
  FileText,
  Shield,
  Lock,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Users,
  Mail,
  Clock,
  Ban,
  CheckSquare,
} from 'lucide-react';

export default function TermsOfService({ onBack }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Terms of Service | Email Automation – Task Allotment';
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="privacy-page-wrapper">
      {/* Top Navigation Bar */}
      <header className="privacy-sticky-header">
        <div className="privacy-header-content">
          <div className="privacy-brand-row">
            <div className="privacy-shield-icon">
              <Scale size={20} color="#ffffff" />
            </div>
            <div>
              <div className="privacy-brand-title">Email Automation – Task Allotment</div>
              <div className="privacy-brand-subtitle">Legal & Terms of Service</div>
            </div>
          </div>
          {onBack && (
            <button onClick={onBack} className="privacy-back-btn" title="Back to Task Operations">
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="privacy-container">
        {/* Hero Card */}
        <div className="privacy-hero-card">
          <div className="privacy-badge">
            <FileText size={13} />
            <span>TERMS OF SERVICE AGREEMENT</span>
          </div>
          <h1 className="privacy-main-title">Terms of Service</h1>
          <p className="privacy-hero-desc">
            These Terms of Service govern your use of the <strong>Email Automation – Task Allotment</strong> application,
            including our automated email delivery, round-robin employee task distribution, and Google OAuth integrations.
          </p>
          <div className="privacy-meta-row">
            <span className="privacy-meta-pill">
              <Clock size={13} />
              Effective Date: October 27, 2026
            </span>
            <span className="privacy-meta-pill">
              <CheckCircle2 size={13} color="var(--success)" />
              Version 1.0 (Public)
            </span>
          </div>
        </div>

        {/* Table of Contents */}
        <nav aria-label="Table of contents" className="privacy-toc-card">
          <div className="privacy-toc-title">Table of Contents</div>
          <div className="privacy-toc-grid">
            <button type="button" onClick={() => scrollToSection('sec-acceptance')}>1. Acceptance of Terms</button>
            <button type="button" onClick={() => scrollToSection('sec-description')}>2. Service Description</button>
            <button type="button" onClick={() => scrollToSection('sec-google')}>3. Google Account & API Access</button>
            <button type="button" onClick={() => scrollToSection('sec-acceptable')}>4. Acceptable Use Policy</button>
            <button type="button" onClick={() => scrollToSection('sec-accounts')}>5. User Responsibilities</button>
            <button type="button" onClick={() => scrollToSection('sec-intellectual')}>6. Intellectual Property</button>
            <button type="button" onClick={() => scrollToSection('sec-disclaimers')}>7. Disclaimers & Warranties</button>
            <button type="button" onClick={() => scrollToSection('sec-liability')}>8. Limitation of Liability</button>
            <button type="button" onClick={() => scrollToSection('sec-termination')}>9. Termination & Revocation</button>
            <button type="button" onClick={() => scrollToSection('sec-contact-terms')}>10. Contact Information</button>
          </div>
        </nav>

        {/* Content Card */}
        <article className="privacy-document-card">
          {/* Section 1 */}
          <section id="sec-acceptance" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">1</div>
              <h2>Acceptance of Terms</h2>
            </div>
            <p>
              By accessing, deploying, or utilizing the <strong>Email Automation – Task Allotment</strong> application
              (&ldquo;the Service&rdquo;, &ldquo;the Application&rdquo;), you acknowledge that you have read, understood, and
              agree to be bound by these Terms of Service. If you do not accept these terms in full, you may not access or
              use the Service.
            </p>
          </section>

          {/* Section 2 */}
          <section id="sec-description" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">2</div>
              <h2>Description of Service</h2>
            </div>
            <p>
              The Application is an enterprise workflow productivity tool designed to automate task distribution among
              staff members. Its core capabilities include:
            </p>
            <ul className="privacy-feature-list">
              <li>Deterministic round-robin assignment of workplace tasks to registered employees.</li>
              <li>Automated dispatch of formatted task notification emails via connected email services.</li>
              <li>Operational task tracking with life-cycle statuses (Pending, Sent, In Progress, Done).</li>
              <li>Real-time metrics and task inventory synchronization.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="sec-google" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">3</div>
              <h2>Google Account & API Integration</h2>
            </div>
            <p>
              When utilizing Google OAuth 2.0 to send task allotment emails, you authorize the Application to connect to the
              Gmail API under the restricted scope:
            </p>
            <div className="privacy-permission-card">
              <div className="privacy-scope-badge">
                <code>https://www.googleapis.com/auth/gmail.send</code>
              </div>
              <p className="privacy-permission-desc">
                This authorization permits the Application solely to transmit outbound task notification emails to assignees.
                The Application does not read, index, or store incoming messages, draft contents, contacts, or calendar items.
              </p>
            </div>
            <p>
              Our use of information received from Google APIs adheres to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="privacy-inline-link"
              >
                Google API Services User Data Policy <ExternalLink size={12} />
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          {/* Section 4 */}
          <section id="sec-acceptable" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">4</div>
              <h2>Acceptable Use Policy</h2>
            </div>
            <p>You agree not to use the Application to:</p>
            <ul className="privacy-bullet-list">
              <li>Transmit unsolicited commercial email (spam), mass marketing campaigns, or phishing attempts.</li>
              <li>Transmit malicious code, viruses, or harmful payloads.</li>
              <li>Attempt to circumvent Google API rate limits, authentication controls, or security perimeters.</li>
              <li>Harass, mislead, or impersonate other organizations or individuals.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="sec-accounts" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">5</div>
              <h2>User Responsibilities & Credentials</h2>
            </div>
            <p>
              You are responsible for maintaining the confidentiality of any OAuth credentials, refresh tokens, and API
              keys configured within your instance of the Application. You agree to notify administrators immediately upon
              discovering any unauthorized access or security breach.
            </p>
          </section>

          {/* Section 6 */}
          <section id="sec-intellectual" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">6</div>
              <h2>Intellectual Property</h2>
            </div>
            <p>
              All original software code, interface design, schemas, and branding associated with the Application remain the
              intellectual property of the respective project authors and copyright holders. Third-party logos (such as Google
              and Gmail) belong to their respective owners.
            </p>
          </section>

          {/* Section 7 */}
          <section id="sec-disclaimers" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">7</div>
              <h2>Disclaimers and Warranties</h2>
            </div>
            <div className="privacy-note-box">
              <AlertTriangle className="privacy-note-icon" size={18} />
              <div>
                THE APPLICATION IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
                WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                OR UNINTERRUPTED OPERATION.
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section id="sec-liability" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">8</div>
              <h2>Limitation of Liability</h2>
            </div>
            <p>
              To the maximum extent permitted by applicable law, in no event shall the authors or maintainers be liable for
              any indirect, incidental, punitive, or consequential damages arising from the use or inability to use the
              Service, including service interruptions or failed email deliveries.
            </p>
          </section>

          {/* Section 9 */}
          <section id="sec-termination" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">9</div>
              <h2>Termination & Revocation</h2>
            </div>
            <p>
              You may stop using the Service at any time. You can immediately revoke Google OAuth permissions granted to the
              Application by visiting{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noreferrer"
                className="privacy-inline-link"
              >
                https://myaccount.google.com/permissions <ExternalLink size={12} />
              </a>.
            </p>
          </section>

          {/* Section 10 */}
          <section id="sec-contact-terms" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">10</div>
              <h2>Contact Information</h2>
            </div>
            <p>
              For legal inquiries, questions about these Terms of Service, or support requests, please contact:
            </p>
            <div className="privacy-contact-card">
              <div className="privacy-contact-item">
                <Mail size={16} color="var(--primary)" />
                <div>
                  <span className="privacy-contact-label">Support Email:</span>
                  <div className="privacy-contact-val">
                    <code className="privacy-placeholder">[Insert Contact Email]</code>
                  </div>
                </div>
              </div>
              <div className="privacy-contact-item">
                <Users size={16} color="var(--primary)" />
                <div>
                  <span className="privacy-contact-label">Organization:</span>
                  <div className="privacy-contact-val">Email Automation – Task Allotment</div>
                </div>
              </div>
            </div>
          </section>
        </article>

        {/* Footer */}
        <footer className="privacy-page-footer">
          <div>
            &copy; {new Date().getFullYear()} Email Automation – Task Allotment. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
