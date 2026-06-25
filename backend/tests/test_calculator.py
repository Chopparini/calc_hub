import pytest
from fastapi.testclient import TestClient

# --- B2B ---

def test_b2b_linear(client):
    r = client.post("/calculator/calculate", json={
        "contract_type": "b2b",
        "tax_form": "linear",
        "gross_income": 15000,
        "monthly_costs": 500,
    })
    assert r.status_code == 200
    data = r.json()
    assert float(data["net_monthly"]) > 0
    assert float(data["income_tax"]) > 0
    assert float(data["zus_social"]) > 0
    assert float(data["health_insurance"]) > 0
    assert "zus_breakdown" in data


def test_b2b_skala(client):
    r = client.post("/calculator/calculate", json={
        "contract_type": "b2b",
        "tax_form": "scale",
        "gross_income": 10000,
        "monthly_costs": 0,
    })
    assert r.status_code == 200
    assert float(r.json()["net_monthly"]) > 0


def test_b2b_ryczalt(client):
    r = client.post("/calculator/calculate", json={
        "contract_type": "b2b",
        "tax_form": "lump_sum",
        "gross_income": 12000,
        "monthly_costs": 0,
        "lump_sum_rate": 0.12,
    })
    assert r.status_code == 200
    data = r.json()
    assert float(data["net_monthly"]) > 0
    assert float(data["income_tax"]) > 0


def test_b2b_ulga_na_start_brak_zus(client):
    r = client.post("/calculator/calculate", json={
        "contract_type": "b2b",
        "tax_form": "linear",
        "gross_income": 10000,
        "monthly_costs": 0,
        "zus_variant": "ulga_na_start",
    })
    assert r.status_code == 200
    assert float(r.json()["zus_social"]) == 0.0


def test_b2b_bez_chorobowej(client):
    r_z = client.post("/calculator/calculate", json={
        "contract_type": "b2b", "tax_form": "linear",
        "gross_income": 10000, "monthly_costs": 0, "z_chorobowa": True,
    })
    r_bez = client.post("/calculator/calculate", json={
        "contract_type": "b2b", "tax_form": "linear",
        "gross_income": 10000, "monthly_costs": 0, "z_chorobowa": False,
    })
    assert float(r_z.json()["net_monthly"]) < float(r_bez.json()["net_monthly"])


def test_b2b_vat(client):
    r = client.post("/calculator/calculate", json={
        "contract_type": "b2b",
        "tax_form": "linear",
        "gross_income": 10000,
        "monthly_costs": 0,
        "vat_rate": "23",
    })
    assert r.status_code == 200
    assert r.json()["vat_monthly"] is not None
    assert float(r.json()["vat_monthly"]) > 0


def test_b2b_vat_zwolniony(client):
    r = client.post("/calculator/calculate", json={
        "contract_type": "b2b",
        "tax_form": "linear",
        "gross_income": 10000,
        "monthly_costs": 0,
        "vat_rate": "zw",
    })
    assert r.status_code == 200
    assert r.json()["vat_monthly"] is None


# --- UoP ---

def test_uop(client):
    r = client.post("/calculator/calculate", json={
        "contract_type": "employment",
        "gross_income": 8000,
    })
    assert r.status_code == 200
    data = r.json()
    assert float(data["net_monthly"]) > 0
    assert float(data["koszt_pracodawcy"]) > float(data["gross_income"])
    assert float(data["zus_pracodawcy"]) > 0


def test_uop_prawa_autorskie(client):
    r_bez = client.post("/calculator/calculate", json={
        "contract_type": "employment", "gross_income": 10000,
        "udzial_praw_autorskich": 0,
    })
    r_z = client.post("/calculator/calculate", json={
        "contract_type": "employment", "gross_income": 10000,
        "udzial_praw_autorskich": 0.5,
    })
    # prawa autorskie = wyższe KUP = mniejszy PIT = wyższe netto
    assert float(r_z.json()["net_monthly"]) > float(r_bez.json()["net_monthly"])


# --- Porównanie ---

def test_compare(client):
    r = client.post("/calculator/compare", json={
        "b2b_income": 15000,
        "monthly_costs": 500,
        "tax_form": "linear",
        "uop_gross": 12000,
    })
    assert r.status_code == 200
    data = r.json()
    assert "b2b" in data
    assert "uop" in data
    assert "roznica_netto" in data
    assert float(data["b2b"]["net_monthly"]) > 0
    assert float(data["uop"]["net_monthly"]) > 0


# --- Walidacja ---

def test_ujemny_przychod(client):
    r = client.post("/calculator/calculate", json={
        "contract_type": "b2b",
        "tax_form": "linear",
        "gross_income": -1000,
    })
    assert r.status_code == 422


def test_bledna_stawka_ryczaltu(client):
    r = client.post("/calculator/calculate", json={
        "contract_type": "b2b",
        "tax_form": "lump_sum",
        "gross_income": 10000,
        "lump_sum_rate": 1.5,
    })
    assert r.status_code == 422
