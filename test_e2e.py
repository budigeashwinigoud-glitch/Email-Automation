import urllib.request
import json

BASE = "http://localhost:8000"


def req(endpoint, method="GET", body=None):
    url = f"{BASE}{endpoint}"
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"} if body else {}
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return e.code, json.loads(err_body) if err_body else None


def main():
    print("=== STARTING FULL END-TO-END VERIFICATION ===")

    # 1. Check clean database
    status, emps = req("/api/employees")
    assert status == 200
    print(f"Step 1: Database checked. Existing employees: {len(emps)}")

    import time
    ts = int(time.time())

    # 2. Create fresh test employees dynamically
    test_staff = []
    for name in ["Alex", "Bianca", "Carlos", "Diana"]:
        s, emp = req("/api/employees", "POST", {"name": f"{name}_{ts}", "email": f"{name.lower()}_{ts}@belvo.internal"})
        assert s == 201
        test_staff.append(emp)
    print(f"Step 2: Created {len(test_staff)} dynamic employees: {[e['name'] for e in test_staff]}")

    new_emp1 = test_staff[2]
    new_emp2 = test_staff[3]

    # 4. Create manually assigned task
    status, manual_task = req("/api/tasks", "POST", {
        "title": "Manual Review Task",
        "description": "Assigned specifically to Diana",
        "priority": "High",
        "due_date": "2026-10-15",
        "assignee": new_emp2["id"]
    })
    assert status == 201
    assert manual_task["assigned_to"]["id"] == new_emp2["id"]
    print(f"Step 4: Manually assigned task #{manual_task['id']} to {manual_task['assigned_to']['name']}")

    # 5. Create multiple auto-assigned tasks & verify round-robin
    status, emps_active = req("/api/employees?active=true")
    active_ids = [e["id"] for e in emps_active]
    print(f"Active employee IDs in sequence: {active_ids}")

    auto_tasks = []
    for i in range(len(active_ids) + 2):
        status, task = req("/api/tasks", "POST", {
            "title": f"Auto Task {i+1}",
            "description": f"Auto allotment test {i+1}",
            "priority": "Medium",
            "due_date": "2026-10-20",
            "assignee": "auto"
        })
        assert status == 201
        auto_tasks.append(task)
        print(f"   Task {i+1} assigned to: {task['assigned_to']['name']} (ID {task['assigned_to']['id']})")

    # Verify cyclical round robin relative to starting pointer
    first_assigned_id = auto_tasks[0]["assigned_to"]["id"]
    start_idx = active_ids.index(first_assigned_id)
    for i, t in enumerate(auto_tasks):
        expected_idx = (start_idx + i) % len(active_ids)
        expected_id = active_ids[expected_idx]
        actual_id = t["assigned_to"]["id"]
        assert actual_id == expected_id, f"At step {i}: expected ID {expected_id}, got {actual_id}"
    print("Step 5: Cyclical round-robin sequence and wrap-around verified successfully!")

    # 6. Deactivate next employee in sequence and verify skip
    status, emps_active = req("/api/employees?active=true")
    active_ids_now = [e["id"] for e in emps_active]
    last_id = auto_tasks[-1]["assigned_to"]["id"]
    curr_idx = active_ids_now.index(last_id)
    target_to_skip_idx = (curr_idx + 1) % len(active_ids_now)
    target_to_skip_id = active_ids_now[target_to_skip_idx]
    expected_after_skip_idx = (curr_idx + 2) % len(active_ids_now)
    expected_after_skip_id = active_ids_now[expected_after_skip_idx]

    status, deact_res = req(f"/api/employees/{target_to_skip_id}", "DELETE")
    assert status == 200
    assert deact_res["active"] is False
    print(f"Step 6: Deactivated next-in-line employee ID {target_to_skip_id}")

    # 7. Next auto task skips deactivated employee
    status, skip_task = req("/api/tasks", "POST", {
        "title": "Post-Deactivation Task",
        "description": "Verifying skip behavior",
        "priority": "Low",
        "due_date": "2026-10-25",
        "assignee": "auto"
    })
    assert status == 201
    assert skip_task["assigned_to"]["id"] == expected_after_skip_id
    assert skip_task["assigned_to"]["id"] != target_to_skip_id
    print(f"Step 7: Successfully skipped deactivated employee {target_to_skip_id}, assigned to ID {skip_task['assigned_to']['id']} ({skip_task['assigned_to']['name']})")

    # 8. Check Pending Tasks API (Email Team Integration)
    status, pending = req("/api/tasks/pending")
    assert status == 200
    assert len(pending) > 0
    sample_pending = pending[0]
    assert "id" in sample_pending
    assert "assigned_to" in sample_pending
    assert "name" in sample_pending["assigned_to"]
    assert "email" in sample_pending["assigned_to"]
    assert sample_pending["status"] == "pending"
    print(f"Step 8: GET /api/tasks/pending returned {len(pending)} pending tasks. Sample: {sample_pending['title']} -> {sample_pending['assigned_to']['email']}")

    # 9. Update status: pending -> sent (Email Service Simulation)
    status, sent_task = req(f"/api/tasks/{sample_pending['id']}/status", "PATCH", {"status": "sent"})
    assert status == 200
    assert sent_task["status"] == "sent"
    assert sent_task["sent_at"] is not None
    print(f"Step 9: PATCH /api/tasks/{sample_pending['id']}/status to 'sent' succeeded. sent_at={sent_task['sent_at']}")

    # 10. Update status: sent -> done (Employee Completion Simulation)
    status, done_task = req(f"/api/tasks/{sample_pending['id']}/status", "PATCH", {"status": "done"})
    assert status == 200
    assert done_task["status"] == "done"
    assert done_task["completed_at"] is not None
    print(f"Step 10: PATCH /api/tasks/{sample_pending['id']}/status to 'done' succeeded. completed_at={done_task['completed_at']}")

    # 11. Task filtering
    status, filtered_done = req("/api/tasks?status=done")
    assert status == 200
    assert any(t["id"] == sample_pending["id"] for t in filtered_done)
    print(f"Step 11: GET /api/tasks?status=done successfully returned {len(filtered_done)} completed tasks.")

    # 12. Edit task
    status, edited_task = req(f"/api/tasks/{sample_pending['id']}", "PUT", {
        "title": "Updated Task Title",
        "description": "Updated Description",
        "priority": "High"
    })
    assert status == 200
    assert edited_task["title"] == "Updated Task Title"
    assert edited_task["priority"] == "High"
    print(f"Step 12: PUT /api/tasks/{sample_pending['id']} successfully updated task.")

    # 13. Delete task
    task_to_del = auto_tasks[-1]["id"]
    status, del_res = req(f"/api/tasks/{task_to_del}", "DELETE")
    assert status == 200
    status, not_found = req(f"/api/tasks/{task_to_del}")
    assert status == 404
    print(f"Step 13: DELETE /api/tasks/{task_to_del} successfully verified.")

    # 14. Dashboard Statistics
    status, stats = req("/api/dashboard/stats")
    assert status == 200
    print(f"Step 14: Final Dashboard Statistics: {stats}")
    assert stats["total_tasks"] > 0
    assert stats["completed_tasks"] >= 1
    assert stats["sent_tasks"] >= 0
    assert len(stats["employee_stats"]) > 0

    print("\n[SUCCESS] ALL 14 LIVE END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!")


if __name__ == "__main__":
    main()
