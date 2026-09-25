# Belvo Task Allotment Engine — Backend API

Production-ready REST API built with FastAPI, SQLAlchemy, and SQLite for the Belvo "Automated Task Allotment via Email" HR system.

> **IMPORTANT NOTE ON EMAIL AUTOMATION**:  
> Email delivery and scheduled automation are intentionally separated from this frontend/backend module. Another teammate implements the scheduled email delivery service. This backend exposes clean, dedicated integration endpoints for that service:
> - `GET /api/tasks/pending` to retrieve tasks queued for dispatch.
> - `PATCH /api/tasks/{task_id}/status` to advance task lifecycle (`pending` → `sent` → `done`).

---

## Architecture & Tech Stack

- **Framework**: FastAPI (Python 3.10+)
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic v2
- **Database**: SQLite (local development, single-file persistent storage `belvo.db`)
- **Documentation**: Swagger UI (`/docs`) & ReDoc (`/redoc`)
- **Testing**: Pytest & HTTPX TestClient

---

## Setup & Running

### 1. Create and Activate Virtual Environment

```bash
# In the backend directory
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create `.env` based on `.env.example`:

```env
DATABASE_URL=sqlite:///./belvo.db
FRONTEND_URL=http://localhost:5173
SEED_INITIAL_EMPLOYEES=true
```

### 4. Run Server

```bash
uvicorn app.main:app --reload --port 8000
```

The server will automatically:
1. Initialize the SQLite database and create all tables on startup.
2. Seed initial employees if the Employee table is empty.
3. Serve OpenAPI documentation at: `http://localhost:8000/docs`.

---

## Round-Robin Assignment Logic

The automatic task assignment algorithm is located in [`app/services/assignment.py`](file:///./app/services/assignment.py).

### Key Characteristics:
- **Dynamic Employee Capacity**: Works with any number of active employees ($N \ge 1$), never hardcoded to five.
- **Persistent State**: Stores the last assigned employee ID in the `round_robin_state` database table. Server restarts or crashes never reset the sequence.
- **Inactive Employee Skipping**: If an employee is marked inactive (`active = false`), the algorithm automatically skips them and selects the next active employee in cyclical order.
- **New Employee Inclusion**: Newly created active employees automatically enter future round-robin cycles.
- **Isolated Manual Assignment**: When HR manually assigns a task to a specific employee, the round-robin sequence pointer is preserved and does not advance.
- **Fail-Safe**: If no active employees exist in the system, returns HTTP `400 Bad Request` with: `"No active employees available for automatic assignment."`.

---

## API Endpoints

### Employees (`/api/employees`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/employees` | List all employees (supports `?active=true` or `?active=false`) |
| `POST` | `/api/employees` | Register new employee (active by default) |
| `GET` | `/api/employees/{id}` | Get employee details by ID |
| `PUT` | `/api/employees/{id}` | Update employee name, email, or active status |
| `DELETE` | `/api/employees/{id}` | Soft-deactivate employee (`active = false`), preserving historical tasks |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/tasks` | Create task with manual or auto round-robin assignment |
| `GET` | `/api/tasks` | List tasks (newest first, supports `status`, `assignee`, `priority` filters) |
| `GET` | `/api/tasks/pending` | **Email Automation Integration**: retrieve all pending tasks |
| `GET` | `/api/tasks/{id}` | Get complete task details |
| `PUT` | `/api/tasks/{id}` | Update task title, description, priority, due date, assignee, status |
| `PATCH` | `/api/tasks/{id}/status` | **Status Transition**: update status to `sent` or `done` |
| `DELETE` | `/api/tasks/{id}` | Permanently delete a task |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Aggregated statistics: total, pending, sent, completed, active employees, and employee breakdown |

---

## Email Automation Integration Contract

The teammate building the email scheduler can interact directly with the backend as follows:

```
[Email Scheduler]
       |
       | 1. GET /api/tasks/pending
       v
Receive array of tasks awaiting email delivery:
[
  {
    "id": 101,
    "title": "Prepare report",
    "description": "...",
    "priority": "High",
    "due_date": "2026-09-30",
    "assigned_to": {
      "id": 4,
      "name": "Employee Name",
      "email": "employee@example.com"
    },
    "status": "pending",
    "created_at": "2026-09-24T10:00:00Z"
  }
]
       |
       | 2. Deliver email to assigned_to.email
       v
       | 3. PATCH /api/tasks/101/status
       |    Body: { "status": "sent" }
       v
Backend records `sent_at` timestamp and updates status to "sent".
```

---

## Running Automated Tests

A comprehensive test suite of 33 pytest cases verifies all functional scenarios and edge cases:

```bash
pytest -v
```
