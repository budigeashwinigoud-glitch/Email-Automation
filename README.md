# Belvo — Enterprise Task Orchestration & Automated Email Dispatch System

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/SQLite-003B57.svg?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tests-48%20Passed-brightgreen.svg?style=for-the-badge&logo=pytest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/Deployment-Render%20%7C%20Vercel-black.svg?style=for-the-badge&logo=render&logoColor=white" alt="Deployment" />
</p>

---

## 📌 Executive Summary

**Belvo** is an enterprise-grade internal task allotment and automated email dispatch platform. Designed for modern corporate operations, it pairs a high-performance **FastAPI** backend engine with an ultra-responsive, zero-lag **React (Vite)** dashboard and an automated **Gmail API & SMTP/IMAP email dispatch worker**.

The system automates the intake, cyclical departmental distribution, broadcast dispatch, and automated outbound notification of tasks to team members with complete audit lifecycle tracking (`pending` $\rightarrow$ `sent` $\rightarrow$ `done`).

---

## 🌟 Key Capabilities & Architectural Highlights

### 1. 🏢 Deterministic Departmental Round-Robin & Company-Wide Broadcast
- **11 Predefined Organizational Departments**:
  1. WhatsApp Marketing
  2. Social Media Manager
  3. HR
  4. Analyst Department
  5. Talented Engineers
  6. Cybersecurity
  7. AI/ML Department
  8. Web Developer
  9. Software Developers
  10. Graphic
  11. Founder Office
- **Dynamic "Other" Department Creation**: Create custom departments on-the-fly; new departments immediately populate into all system filters and dropdowns.
- **Department-Filtered Allocation**: When allotting tasks manually, selecting a department immediately filters candidate assignees to active members of that department.
- **Deterministic Departmental Rotation**: Automatic task allotment (`assignee="auto"`) rotates cyclically through active employees strictly within the selected department.
- **Company-Wide & Department Broadcast ("Send to All")**:
  - **All Employees Assignment Card**: Task Intake Engine allows selecting "All Employees (Broadcast)" (`assignee="all"`).
  - **Single-Click Multi-Staff Delivery**: Automatically creates distinct task records for every active employee (or all active employees in a chosen department) and dispatches individual notification emails.
  - **On-Demand Existing Task Broadcast**: Broadcast an existing task to all employees at any time directly from the Task Table, Kanban Board, or Task Details modal with confirmation safeguards.
- **Fault-Tolerant State Persistence**: Round-robin sequence pointers are persisted in database state (`round_robin_state`), guaranteeing deterministic rotation across service restarts. Inactive employees are seamlessly skipped, while newly added employees are cleanly incorporated into subsequent cycles.

### 2. ⚡ Zero-Lag Optimistic Web Interface
- **Dual Visual Modes**: Seamless one-click toggling between an interactive **Data Table** and an agile **Kanban Board** (`Pending Delivery` $\rightarrow$ `Dispatched` $\rightarrow$ `Completed`).
- **Sub-Millisecond Optimistic UI Updates**: All task allotments, status changes, and deletions reflect immediately in memory ($0\text{ ms}$ perceived latency) before background API sync.
- **Non-Destructive Background Synchronization**: Silently polls and refreshes data without flashing full-screen loading spinners or unmounting views.
- **Zero Default Values Philosophy**: All form fields (priorities, due dates, assignees, departments) require intentional user input; forms never assume arbitrary defaults.
- **Clean Database Zero-State**: The system initializes in a pristine zero-mock state without artificial placeholder records.
- **Search & Multi-Dimensional Filtering**: Real-time debounced search across titles, descriptions, and assignees, combined with multi-filter pills (Status, Priority, Department, Assignee).

### 3. 📬 Automated Email Dispatch & Worker Pipeline
- **Dual Mail Transports**: Native support for **Google Gmail API (OAuth 2.0)** and standard **SMTP/IMAP** with secure TLS.
- **Asynchronous Background Worker**: Dedicated background worker daemon (`backend/app/services/worker.py` and standalone `email_worker/worker.py`) that continuously polls `/api/tasks/pending` and dispatches formatted notification emails.
- **Multi-Recipient Broadcast Engine**: `send_task_email_to_multiple` helper that safely iterates through employee batches, logging and delivering notifications with fallback protections.
- **Automated Lifecycle Audit**: Automatically transitions tasks to `sent` upon delivery, accurately timestamping `sent_at` and `completed_at` with UTC timezone awareness.
- **On-Demand Dispatch**: Direct "Send Email" and "Send to All" actions in the dashboard to trigger real-time notification dispatch on demand.

### 4. 👥 Comprehensive Staff Lifecycle Management
- **Full Employee Directory**: Register staff with corporate email, department, and initial rotation eligibility.
- **Permanent Cascade Deletion**: Permanently removes employees, safely cleans up associated tasks, and cleans active round-robin pointers (`DELETE /api/employees/{id}?permanent=true`).
- **Soft Deactivation**: Toggle employee active status off to bypass them from future rotations while maintaining historical task records (`DELETE /api/employees/{id}?permanent=false`).
- **Workload Metrics**: Live visualization of pending, sent, and completed task distribution per employee.

### 5. 🗄️ Multi-Database Relational Engine
- **Dual-Mode Database Adapter**: Zero-configuration local development on **SQLite**, with native production support for **PostgreSQL (Neon)** and **MySQL**.
- **Automated Startup Schema Migrations**: Automatically verifies and applies additive column migrations (`PRAGMA table_info` and `ALTER TABLE`) on startup without data loss.

---

## 🛠️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          HR Manager Web Dashboard                      │
│        (React 18 • Vite • Lucide Icons • Optimistic UI Engine)         │
│  • Task Intake Modal (Auto / Manual / All Employees Broadcast)         │
│  • Departmental Filters & "Other" Dept  • Real-Time Kanban & Table     │
│  • On-Demand "Send Email" & "Send to All" Modals                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON (REST)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Application Engine                      │
│        (Pydantic v2 • SQLAlchemy • Async Background Tasks)             │
│  • /api/employees       • /api/tasks            • /api/tasks/{id}/send │
│  • /api/dashboard/stats • /api/tasks/pending    • /api/tasks/{id}/send-all
└──────────────────┬────────────────────────────────┬────────────────────┘
                   │                                │
                   ▼                                ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│       Database Layer (SQLAlchemy)   │  │   Outbound Dispatch Pipeline  │
│  • SQLite (Local Development)       │  │  • Gmail API (OAuth 2.0)      │
│  • PostgreSQL / Neon (Production)   │  │  • SMTP / TLS Relay           │
│  • MySQL Compatible                 │  │  • Background Worker Daemon   │
└─────────────────────────────────────┘  └───────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher

---

### Step 1: Clone Repository & Setup Backend

```bash
# Clone the repository
git clone https://github.com/budigeashwinigoud-glitch/Email-Automation.git
cd Email-Automation

# Create and activate Python virtual environment
cd backend
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database (leave blank for local SQLite, or provide PostgreSQL/Neon URL)
DATABASE_URL=sqlite:///./test.db

# CORS Allowed Origins
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]

# Email Service Configuration (SMTP or Gmail API)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-corporate-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-corporate-email@gmail.com
SMTP_FROM_NAME="Belvo Task Orchestration"
```

### Step 3: Launch Services

#### Terminal 1 — Backend API Server
```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
> Interactive API Docs will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Terminal 2 — Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
> Web Dashboard will be live at: [http://localhost:5173](http://localhost:5173)

#### Terminal 3 (Optional) — Dedicated Email Worker Daemon
```bash
cd backend
python -m app.services.worker
```

---

## 🧪 Comprehensive Verification & Test Suite

The system includes a 49-point automated test suite covering round-robin distribution, concurrency, multi-database drivers, edge cases, employee cascading, and broadcast dispatch:

```bash
# Run backend test suite
cd backend
pytest -v backend/tests

# Run live 16-step end-to-end audit
python test_e2e.py

# Run frontend production build validation
cd frontend
npm run build
```

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/employees` | List employees (filters: `active`, `department`). |
| `POST` | `/api/employees` | Register new employee with email, department, role. |
| `PUT` | `/api/employees/{id}` | Update employee metadata or department. |
| `DELETE` | `/api/employees/{id}` | Soft deactivate (`?permanent=false`) or permanently delete (`?permanent=true`). |
| `GET` | `/api/tasks` | Filter tasks by `status`, `assignee`, `priority`, `department`. |
| `POST` | `/api/tasks` | Intake task with `auto`, `manual`, or `"all"` broadcast. |
| `GET` | `/api/tasks/pending` | Fetch pending tasks waiting for email dispatch. |
| `POST` | `/api/tasks/{id}/send` | Immediately dispatch email notification for task. |
| `POST` | `/api/tasks/{id}/send-all` | Broadcast task notification to all active employees. |
| `PATCH` | `/api/tasks/{id}/status` | Update lifecycle stage (`pending` $\rightarrow$ `sent` $\rightarrow$ `done`). |
| `DELETE` | `/api/tasks/{id}` | Permanently remove task. |
| `GET` | `/api/dashboard/stats` | Retrieve real-time workload and lifecycle KPIs. |

---

## 🌐 Production Deployment

- **Backend**: Pre-configured for deployment on **Render**, **Railway**, or **AWS ECS** via Dockerfile or `uvicorn app.main:app`.
- **Frontend**: Single-command static bundle (`npm run build`) optimized for **Vercel**, **Netlify**, or **Cloudflare Pages**.
- **Database**: Production-ready connection strings supported via Neon PostgreSQL, Supabase, or AWS RDS MySQL.
