# CalcHub — Kalkulator podatkowy

Aplikacja do obliczania i porównywania wynagrodzeń netto dla różnych form współpracy: JDG/B2B, Umowa o pracę. Projekt semestralny.


## Uruchomienie lokalne

### Wymagania
- Python 3.14+

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Dokumentacja API dostępna pod: `http://localhost:8000/docs`


## Struktura projektu

```
calchub/
├── backend/
    ├── app/
        ├── core/


## API

| Endpoint | Opis |
|---|---|
| `POST /auth/register` | Rejestracja |
| `POST /auth/login` | Logowanie, zwraca JWT |