import pytest
from fastapi.testclient import TestClient

VALID_PASSWORD = "SecurePassword123"

REGISTER_PAYLOAD = {
    "username": "testuser",
    "email": "test@example.com",
    "password": VALID_PASSWORD,
}


@pytest.fixture
def token(client):
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    r = client.post("/auth/login", json={
        "username": REGISTER_PAYLOAD["username"],
        "password": VALID_PASSWORD,
    })
    return r.json()["access_token"]


@pytest.fixture
def auth(token):
    return {"Authorization": f"Bearer {token}"}


B2B_PAYLOAD = {
    "contract_type": "b2b",
    "tax_form": "linear",
    "gross_income": 15000,
    "monthly_costs": 500,
    "name": "Moja kalkulacja",
}

UOP_PAYLOAD = {
    "contract_type": "employment",
    "gross_income": 8000,
    "name": "UoP kalkulacja",
}


# --- Zapis ---

def test_zapisz_kalkulacje_b2b(client, auth):
    r = client.post("/calculations/", json=B2B_PAYLOAD, headers=auth)
    assert r.status_code == 201
    data = r.json()
    assert data["contract_type"] == "b2b"
    assert data["gross_income"] == "15000.00"
    assert data["name"] == "Moja kalkulacja"
    assert "id" in data
    assert "result_json" in data


def test_zapisz_kalkulacje_uop(client, auth):
    r = client.post("/calculations/", json=UOP_PAYLOAD, headers=auth)
    assert r.status_code == 201
    assert r.json()["contract_type"] == "employment"


def test_zapisz_wymaga_jwt(client):
    r = client.post("/calculations/", json=B2B_PAYLOAD)
    assert r.status_code in (401, 403)


# --- Odczyt ---

def test_lista_kalkulacji(client, auth):
    client.post("/calculations/", json=B2B_PAYLOAD, headers=auth)
    client.post("/calculations/", json=UOP_PAYLOAD, headers=auth)
    r = client.get("/calculations/", headers=auth)
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_lista_pusta_dla_nowego_uzytkownika(client, auth):
    r = client.get("/calculations/", headers=auth)
    assert r.status_code == 200
    assert r.json() == []


def test_lista_wymaga_jwt(client):
    r = client.get("/calculations/")
    assert r.status_code in (401, 403)


def test_izolacja_kalkulacji_miedzy_uzytkownikami(client, auth):
    # drugi użytkownik
    client.post("/auth/register", json={
        "username": "other", "email": "other@example.com", "password": VALID_PASSWORD,
    })
    token2 = client.post("/auth/login", json={
        "username": "other", "password": VALID_PASSWORD,
    }).json()["access_token"]
    auth2 = {"Authorization": f"Bearer {token2}"}

    client.post("/calculations/", json=B2B_PAYLOAD, headers=auth)
    r = client.get("/calculations/", headers=auth2)
    assert r.json() == []


# --- Usuwanie ---

def test_usun_kalkulacje(client, auth):
    calc_id = client.post("/calculations/", json=B2B_PAYLOAD, headers=auth).json()["id"]
    r = client.delete(f"/calculations/{calc_id}", headers=auth)
    assert r.status_code == 204
    assert client.get("/calculations/", headers=auth).json() == []


def test_usun_wymaga_jwt(client, auth):
    calc_id = client.post("/calculations/", json=B2B_PAYLOAD, headers=auth).json()["id"]
    r = client.delete(f"/calculations/{calc_id}")
    assert r.status_code in (401, 403)


def test_usun_cudza_kalkulacje(client, auth):
    calc_id = client.post("/calculations/", json=B2B_PAYLOAD, headers=auth).json()["id"]

    client.post("/auth/register", json={
        "username": "other", "email": "other@example.com", "password": VALID_PASSWORD,
    })
    token2 = client.post("/auth/login", json={
        "username": "other", "password": VALID_PASSWORD,
    }).json()["access_token"]
    auth2 = {"Authorization": f"Bearer {token2}"}

    r = client.delete(f"/calculations/{calc_id}", headers=auth2)
    assert r.status_code == 404


def test_usun_nieistniejaca_kalkulacje(client, auth):
    r = client.delete("/calculations/99999", headers=auth)
    assert r.status_code == 404
