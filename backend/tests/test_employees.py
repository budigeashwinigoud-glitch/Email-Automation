def test_get_employees_empty(client):
    response = client.get("/api/employees")
    assert response.status_code == 200
    assert response.json() == []


def test_create_employee(client):
    payload = {"name": "Alice", "email": "alice@example.com"}
    response = client.post("/api/employees", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alice"
    assert data["email"] == "alice@example.com"
    assert data["active"] is True
    assert "id" in data
    assert "created_at" in data


def test_create_duplicate_employee_email(client):
    payload = {"name": "Alice", "email": "alice@example.com"}
    client.post("/api/employees", json=payload)
    response = client.post("/api/employees", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_create_employee_invalid_name_or_email(client):
    # Blank name
    res1 = client.post("/api/employees", json={"name": "   ", "email": "valid@example.com"})
    assert res1.status_code == 422

    # Invalid email
    res2 = client.post("/api/employees", json={"name": "Valid Name", "email": "not-an-email"})
    assert res2.status_code == 422


def test_get_employees_with_active_filter(client, seed_employees):
    # Deactivate one employee
    client.delete(f"/api/employees/{seed_employees[0].id}")

    # All employees
    res_all = client.get("/api/employees")
    assert len(res_all.json()) == 5

    # Only active
    res_active = client.get("/api/employees?active=true")
    assert len(res_active.json()) == 4
    for emp in res_active.json():
        assert emp["active"] is True

    # Only inactive
    res_inactive = client.get("/api/employees?active=false")
    assert len(res_inactive.json()) == 1
    assert res_inactive.json()[0]["id"] == seed_employees[0].id


def test_get_single_employee(client, seed_employees):
    emp_id = seed_employees[1].id
    response = client.get(f"/api/employees/{emp_id}")
    assert response.status_code == 200
    assert response.json()["name"] == seed_employees[1].name


def test_get_single_employee_not_found(client):
    response = client.get("/api/employees/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found."


def test_update_employee(client, seed_employees):
    emp_id = seed_employees[0].id
    update_payload = {"name": "Updated Name", "email": "updated@example.com", "active": True}
    response = client.put(f"/api/employees/{emp_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["email"] == "updated@example.com"


def test_update_employee_duplicate_email(client, seed_employees):
    emp1_id = seed_employees[0].id
    emp2_email = seed_employees[1].email
    # Try updating emp1 to have emp2's email
    response = client.put(f"/api/employees/{emp1_id}", json={"email": emp2_email})
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_deactivate_employee(client, seed_employees):
    emp_id = seed_employees[2].id
    response = client.delete(f"/api/employees/{emp_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["active"] is False

    # Check status
    get_res = client.get(f"/api/employees/{emp_id}")
    assert get_res.json()["active"] is False


def test_create_and_filter_employee_department(client):
    # Register with department
    res1 = client.post(
        "/api/employees",
        json={"name": "Alice Dev", "email": "alice.dev@example.com", "department": "Software Developers"}
    )
    assert res1.status_code == 201
    assert res1.json()["department"] == "Software Developers"

    res2 = client.post(
        "/api/employees",
        json={"name": "Bob HR", "email": "bob.hr@example.com", "department": "HR"}
    )
    assert res2.status_code == 201
    assert res2.json()["department"] == "HR"

    # Filter by department
    filtered_res = client.get("/api/employees?department=Software Developers")
    assert filtered_res.status_code == 200
    emps = filtered_res.json()
    assert len(emps) == 1
    assert emps[0]["name"] == "Alice Dev"

    # Update department
    alice_id = res1.json()["id"]
    update_res = client.put(f"/api/employees/{alice_id}", json={"department": "AI/ML Department"})
    assert update_res.status_code == 200
    assert update_res.json()["department"] == "AI/ML Department"

