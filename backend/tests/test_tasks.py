from datetime import date


def test_create_task_manual_assignment(client, seed_employees):
    emp = seed_employees[0]
    payload = {
        "title": "Prepare Financial Report",
        "description": "Prepare quarterly summary",
        "priority": "High",
        "due_date": "2026-10-15",
        "assignee": emp.id
    }
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["priority"] == "High"
    assert data["status"] == "pending"
    assert data["assigned_to"]["id"] == emp.id
    assert data["assigned_to"]["name"] == emp.name
    assert data["assigned_to"]["email"] == emp.email
    assert data["sent_at"] is None
    assert data["completed_at"] is None


def test_create_task_inactive_employee(client, seed_employees):
    emp = seed_employees[0]
    # Deactivate employee
    client.delete(f"/api/employees/{emp.id}")

    payload = {
        "title": "Invalid Task",
        "description": "Desc",
        "priority": "Low",
        "due_date": "2026-10-15",
        "assignee": emp.id
    }
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 400
    assert "inactive" in response.json()["detail"]


def test_create_task_invalid_employee(client):
    payload = {
        "title": "Invalid Task",
        "description": "Desc",
        "priority": "Low",
        "due_date": "2026-10-15",
        "assignee": 99999
    }
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 404
    assert "does not exist" in response.json()["detail"]


def test_create_task_invalid_priority(client, seed_employees):
    payload = {
        "title": "Task",
        "description": "Desc",
        "priority": "Urgent",  # Invalid! Only Low, Medium, High allowed
        "due_date": "2026-10-15",
        "assignee": seed_employees[0].id
    }
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 422


def test_create_task_missing_required_fields(client):
    # Missing title and description
    response = client.post("/api/tasks", json={"priority": "Low"})
    assert response.status_code == 422


def test_get_tasks_and_sorting(client, seed_employees):
    emp = seed_employees[0]
    client.post("/api/tasks", json={"title": "Task 1", "description": "D1", "priority": "Low", "due_date": "2026-10-15", "assignee": emp.id})
    client.post("/api/tasks", json={"title": "Task 2", "description": "D2", "priority": "Medium", "due_date": "2026-10-16", "assignee": emp.id})

    response = client.get("/api/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) == 2
    # Newest first
    assert tasks[0]["title"] == "Task 2"
    assert tasks[1]["title"] == "Task 1"


def test_filter_tasks(client, seed_employees):
    emp1 = seed_employees[0]
    emp2 = seed_employees[1]

    t1 = client.post("/api/tasks", json={"title": "Task 1", "description": "D1", "priority": "Low", "due_date": "2026-10-15", "assignee": emp1.id}).json()
    t2 = client.post("/api/tasks", json={"title": "Task 2", "description": "D2", "priority": "High", "due_date": "2026-10-16", "assignee": emp2.id}).json()

    # Mark t2 as sent
    client.patch(f"/api/tasks/{t2['id']}/status", json={"status": "sent"})

    # Filter by status
    res_pending = client.get("/api/tasks?status=pending")
    assert len(res_pending.json()) == 1
    assert res_pending.json()[0]["id"] == t1["id"]

    # Filter by assignee
    res_emp2 = client.get(f"/api/tasks?assignee={emp2.id}")
    assert len(res_emp2.json()) == 1
    assert res_emp2.json()[0]["id"] == t2["id"]

    # Filter by priority
    res_high = client.get("/api/tasks?priority=High")
    assert len(res_high.json()) == 1
    assert res_high.json()[0]["id"] == t2["id"]

    # Combined filter
    res_combined = client.get(f"/api/tasks?status=sent&priority=High&assignee={emp2.id}")
    assert len(res_combined.json()) == 1


def test_get_pending_tasks(client, seed_employees):
    emp = seed_employees[0]
    t1 = client.post("/api/tasks", json={"title": "Task 1", "description": "D1", "priority": "Low", "due_date": "2026-10-15", "assignee": emp.id}).json()
    t2 = client.post("/api/tasks", json={"title": "Task 2", "description": "D2", "priority": "Medium", "due_date": "2026-10-16", "assignee": emp.id}).json()

    # Update t1 to sent
    client.patch(f"/api/tasks/{t1['id']}/status", json={"status": "sent"})

    response = client.get("/api/tasks/pending")
    assert response.status_code == 200
    pending_list = response.json()
    assert len(pending_list) == 1
    assert pending_list[0]["id"] == t2["id"]
    assert pending_list[0]["assigned_to"]["name"] == emp.name
    assert pending_list[0]["assigned_to"]["email"] == emp.email


def test_get_single_task(client, seed_employees):
    emp = seed_employees[0]
    created = client.post("/api/tasks", json={"title": "Task X", "description": "DX", "priority": "Medium", "due_date": "2026-10-15", "assignee": emp.id}).json()

    response = client.get(f"/api/tasks/{created['id']}")
    assert response.status_code == 200
    assert response.json()["title"] == "Task X"


def test_get_single_task_not_found(client):
    response = client.get("/api/tasks/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found."


def test_update_task(client, seed_employees):
    emp1 = seed_employees[0]
    emp2 = seed_employees[1]
    created = client.post("/api/tasks", json={"title": "Task Initial", "description": "Initial Desc", "priority": "Low", "due_date": "2026-10-15", "assignee": emp1.id}).json()

    update_payload = {
        "title": "Task Modified",
        "description": "Updated Desc",
        "priority": "High",
        "due_date": "2026-11-01",
        "assignee": emp2.id,
        "status": "sent"
    }
    response = client.put(f"/api/tasks/{created['id']}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Task Modified"
    assert data["priority"] == "High"
    assert data["assigned_to"]["id"] == emp2.id
    assert data["status"] == "sent"
    assert data["sent_at"] is not None


def test_update_task_status_and_timestamps(client, seed_employees):
    emp = seed_employees[0]
    created = client.post("/api/tasks", json={"title": "Status Test", "description": "Desc", "priority": "Low", "due_date": "2026-10-15", "assignee": emp.id}).json()

    # Step 1: Update to sent
    res_sent = client.patch(f"/api/tasks/{created['id']}/status", json={"status": "sent"})
    assert res_sent.status_code == 200
    assert res_sent.json()["status"] == "sent"
    assert res_sent.json()["sent_at"] is not None
    assert res_sent.json()["completed_at"] is None

    # Step 2: Update to done
    res_done = client.patch(f"/api/tasks/{created['id']}/status", json={"status": "done"})
    assert res_done.status_code == 200
    assert res_done.json()["status"] == "done"
    assert res_done.json()["completed_at"] is not None


def test_update_task_status_invalid(client, seed_employees):
    emp = seed_employees[0]
    created = client.post("/api/tasks", json={"title": "Status Test", "description": "Desc", "priority": "Low", "due_date": "2026-10-15", "assignee": emp.id}).json()

    res = client.patch(f"/api/tasks/{created['id']}/status", json={"status": "invalid_status"})
    assert res.status_code == 422


def test_delete_task(client, seed_employees):
    emp = seed_employees[0]
    created = client.post("/api/tasks", json={"title": "To Delete", "description": "Desc", "priority": "Low", "due_date": "2026-10-15", "assignee": emp.id}).json()

    res_del = client.delete(f"/api/tasks/{created['id']}")
    assert res_del.status_code == 200
    assert "deleted successfully" in res_del.json()["message"]

    res_get = client.get(f"/api/tasks/{created['id']}")
    assert res_get.status_code == 404


def test_create_task_with_department_and_round_robin(client, db_session):
    from app.models import Employee
    # Register 2 employees in 'Talented Engineers' and 2 in 'WhatsApp Marketing'
    eng1 = Employee(name="Engineer 1", email="eng1@belvo.internal", department="Talented Engineers", active=True)
    eng2 = Employee(name="Engineer 2", email="eng2@belvo.internal", department="Talented Engineers", active=True)
    mkt1 = Employee(name="Marketer 1", email="mkt1@belvo.internal", department="WhatsApp Marketing", active=True)
    db_session.add_all([eng1, eng2, mkt1])
    db_session.commit()

    # Allot 3 tasks to 'Talented Engineers' with assignee 'auto'
    t1 = client.post("/api/tasks", json={
        "title": "Build API",
        "description": "API desc",
        "priority": "High",
        "due_date": "2026-10-20",
        "assignee": "auto",
        "department": "Talented Engineers"
    }).json()
    assert t1["assigned_to"]["name"] == "Engineer 1"
    assert t1["department"] == "Talented Engineers"

    t2 = client.post("/api/tasks", json={
        "title": "Optimize DB",
        "description": "DB desc",
        "priority": "Medium",
        "due_date": "2026-10-20",
        "assignee": "auto",
        "department": "Talented Engineers"
    }).json()
    assert t2["assigned_to"]["name"] == "Engineer 2"

    t3 = client.post("/api/tasks", json={
        "title": "Fix bug",
        "description": "Bug desc",
        "priority": "Low",
        "due_date": "2026-10-20",
        "assignee": "auto",
        "department": "Talented Engineers"
    }).json()
    # Cycles back to Engineer 1
    assert t3["assigned_to"]["name"] == "Engineer 1"

    # Filter tasks by department
    filtered = client.get("/api/tasks?department=Talented Engineers").json()
    assert len(filtered) == 3


def test_send_email_unconfigured_credentials(client, seed_employees, monkeypatch):
    """When SMTP is not configured, POST /send returns 503 and preserves pending status."""
    from app.config import settings
    monkeypatch.setattr(settings, "SMTP_HOST", "")
    monkeypatch.setattr(settings, "SMTP_USER", "")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "")

    emp = seed_employees[0]
    task = client.post("/api/tasks", json={
        "title": "Unconfigured Send",
        "description": "Desc",
        "priority": "High",
        "due_date": "2026-10-30",
        "assignee": emp.id
    }).json()

    res = client.post(f"/api/tasks/{task['id']}/send")
    assert res.status_code == 503
    assert "not configured" in res.json()["detail"].lower()

    # Task remains pending
    check_task = client.get(f"/api/tasks/{task['id']}").json()
    assert check_task["status"] == "pending"
    assert check_task["sent_at"] is None


def test_send_email_success(client, seed_employees, monkeypatch):
    """Successful email delivery updates task status to sent and sets sent_at."""
    from app.config import settings
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(settings, "SMTP_USER", "hr@example.com")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "secret")

    # Mock send_task_email to succeed
    sent_calls = []
    def mock_send(t, emp):
        sent_calls.append((t.id, emp.email))
        return {"status": "delivered"}

    monkeypatch.setattr("app.routes.tasks.send_task_email", mock_send)

    emp = seed_employees[0]
    task = client.post("/api/tasks", json={
        "title": "Email Deliverable",
        "description": "Deliver this task via email",
        "priority": "High",
        "due_date": "2026-10-30",
        "assignee": emp.id
    }).json()

    res = client.post(f"/api/tasks/{task['id']}/send")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "sent"
    assert data["sent_at"] is not None
    assert len(sent_calls) == 1
    assert sent_calls[0] == (task["id"], emp.email)

    # Verify task status persisted in database
    persisted = client.get(f"/api/tasks/{task['id']}").json()
    assert persisted["status"] == "sent"
    assert persisted["sent_at"] is not None


def test_send_email_nonexistent_task(client):
    """Sending a nonexistent task returns 404."""
    res = client.post("/api/tasks/99999/send")
    assert res.status_code == 404


def test_send_email_already_sent_task(client, seed_employees, monkeypatch):
    """An already sent task cannot be sent again."""
    from app.config import settings
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(settings, "SMTP_USER", "hr@example.com")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "secret")
    monkeypatch.setattr("app.routes.tasks.send_task_email", lambda t, emp: {"status": "delivered"})

    emp = seed_employees[0]
    task = client.post("/api/tasks", json={
        "title": "Duplicate Send Test",
        "description": "Desc",
        "priority": "Medium",
        "due_date": "2026-10-30",
        "assignee": emp.id
    }).json()

    # First send succeeds
    res1 = client.post(f"/api/tasks/{task['id']}/send")
    assert res1.status_code == 200

    # Second send fails with 400
    res2 = client.post(f"/api/tasks/{task['id']}/send")
    assert res2.status_code == 400
    assert "already been sent" in res2.json()["detail"].lower()


def test_send_email_completed_task(client, seed_employees):
    """A completed task cannot be sent."""
    emp = seed_employees[0]
    task = client.post("/api/tasks", json={
        "title": "Completed Task Send Test",
        "description": "Desc",
        "priority": "Low",
        "due_date": "2026-10-30",
        "assignee": emp.id
    }).json()

    # Advance status to done
    client.patch(f"/api/tasks/{task['id']}/status", json={"status": "done"})

    # Attempt send
    res = client.post(f"/api/tasks/{task['id']}/send")
    assert res.status_code == 400
    assert "already been completed" in res.json()["detail"].lower()


def test_send_email_smtp_failure_preserves_pending(client, seed_employees, monkeypatch):
    """When SMTP delivery throws an exception, task remains pending and 502 is returned."""
    from app.config import settings
    from fastapi import HTTPException
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(settings, "SMTP_USER", "hr@example.com")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "secret")

    def mock_failing_send(t, emp):
        raise HTTPException(status_code=502, detail=f"Failed to deliver email to {emp.email}: Connection refused")

    monkeypatch.setattr("app.routes.tasks.send_task_email", mock_failing_send)

    emp = seed_employees[0]
    task = client.post("/api/tasks", json={
        "title": "Failing SMTP Task",
        "description": "Should stay pending",
        "priority": "High",
        "due_date": "2026-10-30",
        "assignee": emp.id
    }).json()

    res = client.post(f"/api/tasks/{task['id']}/send")
    assert res.status_code == 502
    assert "connection refused" in res.json()["detail"].lower()

    # Confirm task status is still pending and sent_at is None
    persisted = client.get(f"/api/tasks/{task['id']}").json()
    assert persisted["status"] == "pending"
    assert persisted["sent_at"] is None


