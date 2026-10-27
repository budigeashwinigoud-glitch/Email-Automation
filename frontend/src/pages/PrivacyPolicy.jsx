import React from 'react';
import {
  Shield,
  ArrowLeft,
  Mail,
  Lock,
  Database,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Server,
  EyeOff,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function PrivacyPolicy({ onBack }) {
  const lastUpdatedDate = 'October 27, 2026';

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="privacy-page-wrapper">
      {/* Top Header Bar */}
      <header className="privacy-top-header">
        <div className="privacy-header-content">
          <div className="privacy-brand-group">
            <div className="privacy-brand-icon">
              <Layers size={22} color="#ffffff" />
            </div>
            <div>
              <div className="privacy-brand-title">Email Automation – Task Allotment</div>
              <div className="privacy-brand-subtitle">Public Legal & Privacy Disclosures</div>
            </div>
          </div>

          <div className="privacy-header-actions">
            {onBack ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm privacy-back-btn"
                onClick={onBack}
              >
                <ArrowLeft size={15} />
                <span>Back to Dashboard</span>
              </button>
            ) : (
              <a href="/" className="btn btn-secondary btn-sm privacy-back-btn">
                <ArrowLeft size={15} />
                <span>Back to Dashboard</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="privacy-container">
        {/* Hero Banner */}
        <section className="privacy-hero-card">
          <div className="privacy-hero-badge">
            <Shield size={14} />
            <span>Official Privacy Policy</span>
          </div>
          <h1 className="privacy-main-title">Privacy Policy</h1>
          <p className="privacy-hero-summary">
            Transparency, data minimization, and adherence to Google API Services User Data Policy
            for the <strong>Email Automation – Task Allotment</strong> web application.
          </p>
          <div className="privacy-meta-row">
            <span className="privacy-meta-item">
              <Clock size={14} />
              <span>Last Updated: <strong>{lastUpdatedDate}</strong></span>
            </span>
            <span className="privacy-meta-item">
              <CheckCircle2 size={14} color="#16a34a" />
              <span>Status: Active & Public</span>
            </span>
          </div>
        </section>

        {/* Quick Navigation Index */}
        <nav className="privacy-toc-card" aria-label="Privacy Policy Sections">
          <div className="privacy-toc-title">Table of Contents</div>
          <div className="privacy-toc-grid">
            <button type="button" onClick={() => scrollToSection('sec-intro')}>1. Introduction</button>
            <button type="button" onClick={() => scrollToSection('sec-collection')}>2. Information We Collect</button>
            <button type="button" onClick={() => scrollToSection('sec-usage')}>3. How We Use Information</button>
            <button type="button" onClick={() => scrollToSection('sec-google-oauth')}>4. Google Gmail API & OAuth</button>
            <button type="button" onClick={() => scrollToSection('sec-storage-security')}>5. Storage & Security</button>
            <button type="button" onClick={() => scrollToSection('sec-sharing')}>6. Information Sharing</button>
            <button type="button" onClick={() => scrollToSection('sec-retention-deletion')}>7. Retention & Deletion</button>
            <button type="button" onClick={() => scrollToSection('sec-limited-use')}>8. Google User Data (Limited Use)</button>
            <button type="button" onClick={() => scrollToSection('sec-revoking')}>9. Revoking Google Access</button>
            <button type="button" onClick={() => scrollToSection('sec-children')}>10. Children's Privacy</button>
            <button type="button" onClick={() => scrollToSection('sec-changes')}>11. Policy Changes</button>
            <button type="button" onClick={() => scrollToSection('sec-contact')}>12. Contact Information</button>
          </div>
        </nav>

        {/* Document Sections */}
        <article className="privacy-document-card">
          {/* Section 1 */}
          <section id="sec-intro" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">1</div>
              <h2>Introduction</h2>
            </div>
            <p>
              Welcome to the <strong>Email Automation – Task Allotment</strong> web application
              (referred to herein as "the Application", "we", "our", or "us"). The Application
              is an internal workforce and human resources management platform designed to streamline
              task allotment, manage department-based workloads, and deliver automated task notification
              emails to assigned personnel.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, store, and safeguard information when you
              use our platform. We are committed to transparency and ensuring our data handling practices
              strictly adhere to applicable data protection regulations and the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="privacy-inline-link"
              >
                Google API Services User Data Policy <ExternalLink size={12} />
              </a>.
            </p>
          </section>

          {/* Section 2 */}
          <section id="sec-collection" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">2</div>
              <h2>Information We Collect</h2>
            </div>
            <p>
              The Application operates on a principle of strict data minimization. We only collect and
              process information necessary to facilitate task allotment and automated notification
              delivery:
            </p>
            <div className="privacy-highlight-box">
              <ul className="privacy-feature-list">
                <li>
                  <strong>Employee & Team Roster Data:</strong> Employee full name, corporate or work
                  email address, designated organizational department (e.g., Engineering, Marketing, HR),
                  and active/inactive status.
                </li>
                <li>
                  <strong>Task & Assignment Data:</strong> Task title, task instructions and description,
                  assigned employee identifier, department category, priority level (Low, Medium, High),
                  target due date, and current lifecycle status (<code>pending</code>, <code>sent</code>, <code>done</code>).
                </li>
                <li>
                  <strong>Operational Audit Timestamps:</strong> Automated server timestamps reflecting
                  when a task was created (<code>created_at</code>), when the assignment notification email
                  was dispatched (<code>sent_at</code>), and when the task was marked completed (<code>completed_at</code>).
                </li>
                <li>
                  <strong>Employee Deliverable & Completion Reports:</strong> Optional text notes, summaries,
                  or deliverable references submitted by assigned employees upon completing their work.
                </li>
              </ul>
            </div>
            <div className="privacy-note-box">
              <AlertCircle size={18} className="privacy-note-icon" />
              <div>
                <strong>Information We DO NOT Collect:</strong> We do not collect government-issued IDs,
                personal phone numbers, financial or payment information, passwords to your personal accounts,
                or biometric data.
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="sec-usage" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">3</div>
              <h2>How We Use Information</h2>
            </div>
            <p>
              Information collected within the Application is strictly utilized for the following functional purposes:
            </p>
            <ul className="privacy-bullet-list">
              <li>
                <strong>Automated & Manual Task Allotment:</strong> Assigning tasks either through deterministic
                cyclic round-robin rotation across active departmental personnel or via manual selection by an administrator.
              </li>
              <li>
                <strong>Automated Email Notification:</strong> Generating and delivering structured task assignment
                emails containing clear deliverables, deadlines, and instructions to the assigned employee's inbox.
              </li>
              <li>
                <strong>Lifecycle Tracking & Workload Analytics:</strong> Visualizing progress across Table and Kanban
                views, computing departmental completion rates, and displaying staff distribution metrics.
              </li>
              <li>
                <strong>Audit & Historical Recordkeeping:</strong> Maintaining operational logs so team leads can verify
                task timelines, email delivery confirmations, and task resolution.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="sec-google-oauth" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">4</div>
              <h2>Google Gmail API and OAuth 2.0 Integration</h2>
            </div>
            <p>
              To deliver task assignment emails directly to staff members from a designated corporate or
              administrative account, the Application integrates with the <strong>Google Gmail API</strong> via
              Google OAuth 2.0 authentication.
            </p>

            <div className="privacy-permission-card">
              <div className="privacy-permission-header">
                <Lock size={18} color="#2563eb" />
                <span className="privacy-permission-title">Specific OAuth Permission Requested:</span>
              </div>
              <div className="privacy-scope-badge">
                <code>https://www.googleapis.com/auth/gmail.send</code>
              </div>
              <p className="privacy-permission-desc">
                <strong>Scope Description:</strong> Send email on your behalf.
              </p>
            </div>

            <div className="privacy-disclosure-grid">
              <div className="privacy-disclosure-item positive">
                <CheckCircle2 size={18} color="#16a34a" />
                <div>
                  <strong>What This Permission Does:</strong>
                  <p>
                    Allows the Application to compose and send automated task assignment notification emails
                    from the authorized sender account to the designated employee's email address.
                  </p>
                </div>
              </div>

              <div className="privacy-disclosure-item negative">
                <EyeOff size={18} color="#dc2626" />
                <div>
                  <strong>What This Permission DOES NOT Do:</strong>
                  <p>
                    The Application <strong>NEVER</strong> reads, inspects, monitors, or searches your inbox
                    or personal email messages. It cannot delete, alter, or organize your emails, and cannot
                    access your contacts, Google Drive files, or any other Google Workspace services.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="sec-storage-security" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">5</div>
              <h2>Data Storage and Security Practices</h2>
            </div>
            <p>
              We implement technical safeguards directly aligned with the architecture of our software stack:
            </p>
            <div className="privacy-tech-stack-grid">
              <div className="privacy-tech-box">
                <Server size={18} color="#2563eb" />
                <div>
                  <strong>Database Architecture</strong>
                  <p>
                    Task records, employee rosters, and round-robin sequence pointers are persisted in a relational
                    SQL database (SQLite/SQLAlchemy engine). Database records are hosted on secure, isolated
                    application servers.
                  </p>
                </div>
              </div>

              <div className="privacy-tech-box">
                <Lock size={18} color="#2563eb" />
                <div>
                  <strong>Credential & Token Isolation</strong>
                  <p>
                    Google OAuth client credentials, refresh tokens, and server secrets are stored exclusively in
                    server-side environment variables and backend storage. Credentials are <strong>never</strong> bundled
                    into, transmitted to, or accessible from client-side browser JavaScript.
                  </p>
                </div>
              </div>

              <div className="privacy-tech-box">
                <Shield size={18} color="#2563eb" />
                <div>
                  <strong>Encryption in Transit</strong>
                  <p>
                    All communications between users, the React frontend, the FastAPI backend, and Google APIs are
                    conducted over encrypted Transport Layer Security (TLS/HTTPS) protocols.
                  </p>
                </div>
              </div>
            </div>
            <p className="privacy-caveat">
              <em>Please Note:</em> While we adhere to established software engineering best practices, no method
              of electronic transmission or storage is 100% immune to potential risks. We maintain diligent monitoring
              to protect system integrity.
            </p>
          </section>

          {/* Section 6 */}
          <section id="sec-sharing" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">6</div>
              <h2>Information Sharing and Third-Party Disclosures</h2>
            </div>
            <p>
              We maintain a strict policy regarding your data. <strong>We do not sell, rent, monetize, or trade
              employee information, task content, or Google user data to any commercial third parties or data brokers.</strong>
            </p>
            <p>Data is shared solely with the third-party infrastructure providers necessary to run the service:</p>
            <ul className="privacy-bullet-list">
              <li>
                <strong>Google LLC (Google API Services):</strong> To facilitate OAuth 2.0 authorization and execute
                outgoing email delivery via the Gmail API.
              </li>
              <li>
                <strong>Vercel Inc.:</strong> Serves as the static hosting and Content Delivery Network (CDN) provider
                for the React web frontend interface.
              </li>
              <li>
                <strong>Cloud Hosting Infrastructure:</strong> The backend REST API service and database run in secured
                containerized cloud hosting environments (such as Render, AWS, or private enterprise servers).
              </li>
            </ul>
            <div className="privacy-highlight-box" style={{ marginTop: '14px' }}>
              <strong>No AI Model Training:</strong> Data retrieved or processed through Google Workspace or Gmail APIs
              is <strong>never</strong> used, transferred, or sold to develop, train, or improve generalized artificial
              intelligence (AI) or machine learning (ML) models.
            </div>
          </section>

          {/* Section 7 */}
          <section id="sec-retention-deletion" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">7</div>
              <h2>Data Retention and Deletion</h2>
            </div>
            <p>
              Task assignments and employee profiles are retained in the active database only for as long as needed to
              maintain operational workflow and historical task audit trails.
            </p>
            <p>
              The Application provides native, immediate deletion capabilities directly within the user interface:
            </p>
            <ul className="privacy-bullet-list">
              <li>
                <strong>Individual Task Deletion:</strong> Clicking the trash action on any task permanently deletes
                that task record from the database.
              </li>
              <li>
                <strong>Permanent Employee Cascade Deletion:</strong> Deleting an employee with permanent deletion confirmed
                removes the employee record, cascades deletion to all assigned tasks, and resets any round-robin sequence pointers.
              </li>
              <li>
                <strong>Manual Deletion Requests:</strong> Users and employees can request comprehensive deletion of all
                their data and records by contacting the administrator at{' '}
                <code className="privacy-placeholder">[Insert Contact Email]</code>. Requests are reviewed and processed
                promptly within 30 days.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="sec-limited-use" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">8</div>
              <h2>Google User Data — Limited Use Disclosure</h2>
            </div>
            <div className="privacy-limited-use-card">
              <Shield size={20} color="#2563eb" style={{ flexShrink: 0 }} />
              <div>
                <p className="privacy-limited-use-statement">
                  The application's use and transfer to any other app of information received from Google APIs will
                  adhere to the{' '}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="privacy-inline-link"
                  >
                    Google API Services User Data Policy
                  </a>
                  , including the Limited Use requirements.
                </p>
              </div>
            </div>
            <p style={{ marginTop: '12px' }}>
              In compliance with the Limited Use requirements:
            </p>
            <ul className="privacy-bullet-list">
              <li>We only request access to the minimum scopes necessary to fulfill user-facing features (sending task notices).</li>
              <li>We do not transfer Google user data to external parties unless necessary to provide the service or comply with law.</li>
              <li>We do not use or transfer Google user data for serving advertisements (including retargeting or interest-based ads).</li>
              <li>Humans are not permitted to read Google user data unless user consent is explicitly given for troubleshooting, it is necessary for security, or required by law.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section id="sec-revoking" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">9</div>
              <h2>User Choices and Revoking Google Account Access</h2>
            </div>
            <p>
              You maintain full control over the permissions granted to the Application. You can revoke the Application's
              access to your Google Account at any time through Google's centralized security controls:
            </p>
            <div className="privacy-step-box">
              <ol className="privacy-ordered-steps">
                <li>
                  Open your browser and navigate to{' '}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noreferrer"
                    className="privacy-inline-link"
                  >
                    https://myaccount.google.com/permissions <ExternalLink size={12} />
                  </a>.
                </li>
                <li>Sign in with the Google Account previously authorized for the Application.</li>
                <li>
                  Under <em>"Third-party apps with account access"</em>, locate and select{' '}
                  <strong>Email Automation – Task Allotment</strong>.
                </li>
                <li>
                  Click <strong>"Remove Access"</strong> or <strong>"Revoke Permissions"</strong> and confirm your choice.
                </li>
              </ol>
            </div>
            <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Revoking access immediately invalidates all OAuth tokens held by the application, preventing any future
              email dispatches from that account until re-authorized.
            </p>
          </section>

          {/* Section 10 */}
          <section id="sec-children" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">10</div>
              <h2>Children's Privacy</h2>
            </div>
            <p>
              The Application is an enterprise workflow platform built exclusively for professional workplace coordination.
              It is not directed to, marketed towards, or designed for use by individuals under the age of 18 (or 13/16 depending
              on jurisdiction). We do not knowingly solicit or collect personal information from children. If you become
              aware that a minor has provided information through this platform, please contact us immediately to have it purged.
            </p>
          </section>

          {/* Section 11 */}
          <section id="sec-changes" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">11</div>
              <h2>Changes to This Privacy Policy</h2>
            </div>
            <p>
              We may update this Privacy Policy from time to time to reflect operational, legal, or regulatory adjustments.
              Any revisions will be posted directly to this public page with an updated "Last Updated" date at the top of
              the document. We encourage users and administrators to periodically review this page to stay informed of our
              protective measures.
            </p>
          </section>

          {/* Section 12 */}
          <section id="sec-contact" className="privacy-section">
            <div className="privacy-section-header">
              <div className="privacy-section-num">12</div>
              <h2>Contact Information</h2>
            </div>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy, your personal data, or our
              Google API integration, please reach out to our privacy contact:
            </p>
            <div className="privacy-contact-card">
              <div className="privacy-contact-item">
                <Mail size={16} color="var(--primary)" />
                <div>
                  <span className="privacy-contact-label">Privacy & Administrator Email:</span>
                  <div className="privacy-contact-val">
                    <code className="privacy-placeholder">[Insert Contact Email - e.g., privacy@yourdomain.com]</code>
                  </div>
                </div>
              </div>
              <div className="privacy-contact-item">
                <Users size={16} color="var(--primary)" />
                <div>
                  <span className="privacy-contact-label">Organization / Entity:</span>
                  <div className="privacy-contact-val">
                    <code className="privacy-placeholder">[Insert Organization / Developer Name]</code>
                  </div>
                </div>
              </div>
              <div className="privacy-contact-item">
                <Shield size={16} color="var(--primary)" />
                <div>
                  <span className="privacy-contact-label">Application:</span>
                  <div className="privacy-contact-val">Email Automation – Task Allotment</div>
                </div>
              </div>
            </div>
            <div className="privacy-confirmation-notice">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>
                <strong>Action Required by Owner:</strong> Please replace the bracketed placeholders above with your
                verified operational contact email and organizational name before final submission to Google OAuth Verification.
              </span>
            </div>
          </section>
        </article>

        {/* Footer */}
        <footer className="privacy-page-footer">
          <div>
            &copy; {new Date().getFullYear()} Email Automation – Task Allotment. All rights reserved.
          </div>
          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-light)' }}>
            This public policy page is hosted for transparency and compliance with Google API Services User Data Policy.
          </div>
        </footer>
      </main>
    </div>
  );
}
