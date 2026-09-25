def test_dashboard_stats_empty(client):
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_tasks"] == 0
    assert data["pending_tasks"] == 0
    assert data["sent_tasks"] == 0
    assert data["completed_tasks"] == 0
    assert data["active_employees"] == 0
    assert data["employee_stats"] == []


def test_dashboard_stats_with_data(client, seed_employees):
    emp1 = seed_employees[0]
    emp2 = seed_employees[1]

    # emp1 tasks: 1 pending, 1 sent
    t1 = client.post("/api/tasks", json={"title": "T1", "description": "D1", "priority": "Low", "due_date": "2026-10-01", "assignee": emp1.id}).json()
    t2 = client.post("/api/tasks", json={"title": "T2", "description": "D2", "priority": "Medium", "due_date": "2026-10-01", "assignee": emp1.id}).json()
    client.patch(f"/api/tasks/{t2['id']}/status", json={"status": "sent"})

    # emp2 tasks: 1 done
    t3 = client.post("/api/tasks", json={"title": "T3", "description": "D3", "priority": "High", "due_date": "2026-10-01", "assignee": emp2.id}).json()
    client.patch(f"/api/tasks/{t3['id']}/status", json={"status": "done"})

    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    data = res.json()

    assert data["total_tasks"] == 3
    assert data["pending_tasks"] == 1
    assert data["sent_tasks"] == 1
    assert data["completed_tasks"] == 1
    assert data["active_employees"] == 5

    # Check breakdown for emp1
    emp1_stat = next(s for s in data["employee_stats"] if s["employee_id"] == emp1.id)
    assert emp1_stat["pending"] == 1
    assert emp1_stat["sent"] == 1
    assert emp1_stat["done"] == 0

    # Check breakdown for emp2
    emp2_stat = next(s for s in data["employee_stats"] if s["employee_id"] == emp2.id)
    assert emp2_stat["pending"] == 0
    assert emp2_stat["sent"] == 0
    assert emp2_stat["done"] == 1
