import pytest
from app.models import Employee, RoundRobinState
from app.services.assignment import get_next_round_robin_employee


def test_round_robin_cycle_5_employees(client, seed_employees):
    # Ensure active order: seed_employees[0..4]
    assigned_names = []
    for i in range(6):
        res = client.post(
            "/api/tasks",
            json={
                "title": f"Task {i+1}",
                "description": f"Description {i+1}",
                "priority": "Medium",
                "due_date": "2026-10-01",
                "assignee": "auto"
            }
        )
        assert res.status_code == 201
        assigned_names.append(res.json()["assigned_to"]["name"])

    # Task 1 to 5 should match seed_employees in order, Task 6 should cycle back to seed_employees[0]
    expected_order = [emp.name for emp in seed_employees] + [seed_employees[0].name]
    assert assigned_names == expected_order


def test_round_robin_with_different_employee_counts(client, db_session):
    # Create 3 employees
    e1 = Employee(name="User A", email="a@test.com", active=True)
    e2 = Employee(name="User B", email="b@test.com", active=True)
    e3 = Employee(name="User C", email="c@test.com", active=True)
    db_session.add_all([e1, e2, e3])
    db_session.commit()

    assigned_ids = []
    for i in range(7):
        res = client.post(
            "/api/tasks",
            json={
                "title": f"Auto Task {i}",
                "description": "Details",
                "priority": "High",
                "due_date": "2026-10-01",
                "assignee": "auto"
            }
        )
        assert res.status_code == 201
        assigned_ids.append(res.json()["assigned_to"]["id"])

    # Expect: e1, e2, e3, e1, e2, e3, e1
    expected = [e1.id, e2.id, e3.id, e1.id, e2.id, e3.id, e1.id]
    assert assigned_ids == expected


from tests.conftest import TestingSessionLocal

def test_round_robin_persistence_after_restart(db_session):
    # Verify that get_next_round_robin_employee reads from RoundRobinState in DB
    e1 = Employee(name="E1", email="e1@test.com", active=True)
    e2 = Employee(name="E2", email="e2@test.com", active=True)
    e3 = Employee(name="E3", email="e3@test.com", active=True)
    db_session.add_all([e1, e2, e3])
    db_session.commit()

    e1_id = e1.id
    e2_id = e2.id

    # Step 1: Assign first
    first_assigned = get_next_round_robin_employee(db_session)
    assert first_assigned.id == e1_id

    # Simulate backend restart by closing session and using a completely new database session
    db_session.close()

    new_session = TestingSessionLocal()
    try:
        second_assigned = get_next_round_robin_employee(new_session)
        assert second_assigned.id == e2_id
    finally:
        new_session.close()


def test_deactivated_employee_skipped(client, seed_employees):
    # seed_employees are [0, 1, 2, 3, 4]
    # Task 1 -> seed_employees[0]
    res1 = client.post("/api/tasks", json={
        "title": "T1", "description": "D1", "priority": "Low", "due_date": "2026-10-01", "assignee": "auto"
    })
    assert res1.json()["assigned_to"]["id"] == seed_employees[0].id

    # Deactivate seed_employees[1]
    client.delete(f"/api/employees/{seed_employees[1].id}")

    # Task 2 should skip seed_employees[1] and go to seed_employees[2]
    res2 = client.post("/api/tasks", json={
        "title": "T2", "description": "D2", "priority": "Low", "due_date": "2026-10-01", "assignee": "auto"
    })
    assert res2.json()["assigned_to"]["id"] == seed_employees[2].id


def test_new_employee_enters_future_round_robin(client, seed_employees):
    # 5 seed employees. Assign 5 tasks to finish first round.
    for i in range(5):
        client.post("/api/tasks", json={
            "title": f"T{i}", "description": "D", "priority": "Low", "due_date": "2026-10-01", "assignee": "auto"
        })

    # Last assigned was seed_employees[4]
    # Now create a 6th employee
    res_emp = client.post("/api/employees", json={"name": "New Emp", "email": "newemp@test.com"})
    new_emp_id = res_emp.json()["id"]

    # Next auto task should go to new_emp (since its ID is higher than seed_employees[4] or next in cycle)
    res_task = client.post("/api/tasks", json={
        "title": "Next Task", "description": "D", "priority": "Low", "due_date": "2026-10-01", "assignee": "auto"
    })
    assert res_task.json()["assigned_to"]["id"] == new_emp_id

    # And the task after that should cycle back to seed_employees[0]
    res_task2 = client.post("/api/tasks", json={
        "title": "Next Task 2", "description": "D", "priority": "Low", "due_date": "2026-10-01", "assignee": "auto"
    })
    assert res_task2.json()["assigned_to"]["id"] == seed_employees[0].id


def test_manual_assignment_does_not_advance_round_robin(client, seed_employees):
    # Auto task 1 -> seed_employees[0]
    res1 = client.post("/api/tasks", json={
        "title": "T1", "description": "D", "priority": "Low", "due_date": "2026-10-01", "assignee": "auto"
    })
    assert res1.json()["assigned_to"]["id"] == seed_employees[0].id

    # Manual task assigned directly to seed_employees[4]
    res_manual = client.post("/api/tasks", json={
        "title": "Manual", "description": "D", "priority": "Low", "due_date": "2026-10-01", "assignee": seed_employees[4].id
    })
    assert res_manual.json()["assigned_to"]["id"] == seed_employees[4].id

    # Next auto task must still be seed_employees[1], NOT seed_employees[0] or 4
    res2 = client.post("/api/tasks", json={
        "title": "T2", "description": "D", "priority": "Low", "due_date": "2026-10-01", "assignee": "auto"
    })
    assert res2.json()["assigned_to"]["id"] == seed_employees[1].id


def test_no_active_employees_returns_error(client):
    # No employees exist
    res = client.post("/api/tasks", json={
        "title": "T1", "description": "D", "priority": "Low", "due_date": "2026-10-01", "assignee": "auto"
    })
    assert res.status_code == 400
    assert "No active employees available for automatic assignment." in res.json()["detail"]
