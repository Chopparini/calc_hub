import pytest
from fastapi.testclient import TestClient

VALID_PASSWORD = "SecurePassword123"

REGISTER_PAYLOAD = {
    "username": "testuser",
    "email": "test@example.com",
    "password": VALID_PASSWORD,
}


def test_register_success(client):
    r = client.post("/auth/register", json=REGISTER_PAYLOAD)
    assert r.status_code == 201
    data = r.json()
    assert data["username"] == "testuser"
    assert "hashed_password" not in data


def test_register_duplicate_username(client):
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    r = client.post("/auth/register",
                    json={**REGISTER_PAYLOAD, "email": "other@example.com"})
    assert r.status_code == 400
    assert "Username" in r.json()["detail"]


def test_register_duplicate_email(client):
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    r = client.post("/auth/register",
                    json={**REGISTER_PAYLOAD, "username": "other"})
    assert r.status_code == 400
    assert "Email" in r.json()["detail"]


def test_register_password_too_short(client):
    r = client.post("/auth/register",
                    json={**REGISTER_PAYLOAD, "password": "short"})
    assert r.status_code == 422


def test_register_invalid_username(client):
    r = client.post("/auth/register",
                    json={**REGISTER_PAYLOAD, "username": "bad user!"})
    assert r.status_code == 422


def test_login_success(client):
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    r = client.post(
        "/auth/login", json={"username": "testuser", "password": VALID_PASSWORD})
    assert r.status_code == 200
    assert "access_token" in r.json()
    assert r.json()["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    r = client.post(
        "/auth/login", json={"username": "testuser", "password": "WrongPassword999"})
    assert r.status_code == 401


def test_login_unknown_user(client):
    r = client.post(
        "/auth/login", json={"username": "nobody", "password": VALID_PASSWORD})
    assert r.status_code == 401


def test_get_current_user_valid_token(client):
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    token = client.post(
        "/auth/login", json={"username": "testuser", "password": VALID_PASSWORD}).json()["access_token"]
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["username"] == "testuser"


def test_get_current_user_invalid_token(client):
    r = client.get(
        "/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert r.status_code == 401
