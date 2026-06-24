# CalcHub — Kalkulator podatkowy

Aplikacja do obliczania i porównywania wynagrodzeń netto dla różnych form współpracy: JDG/B2B, Umowa o pracę. Projekt semestralny.

## Stack

| Warstwa | Technologie |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, PostgreSQL, JWT |
| PWA | React, Vite, TypeScript, Tailwind CSS, React Router |
| Mobile | React Native, Expo *(w trakcie)* |

## Uruchomienie lokalne

### Wymagania
- Python 3.14+
- Node.js 18+
- PostgreSQL (baza: `calchub`, user: `calchub`, hasło: `calchub123`)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Dokumentacja API dostępna pod: `http://localhost:8000/docs`

### PWA

```bash
cd pwa
npm install
npm run dev
```

Aplikacja dostępna pod: `http://localhost:5173`

## Funkcjonalności

### Kalkulator
- **JDG / B2B** — podatek liniowy, skala podatkowa, ryczałt; pełny ZUS / mały ZUS / ulga na start
- **Umowa o pracę** - kwota netto, koszt pracodawcy

### Konto użytkownika
- Rejestracja i logowanie
- Zapis i przeglądanie historii kalkulacji
- Profil z domyślnymi ustawieniami

## Struktura projektu

```
calchub/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── tax_constants.py   # stawki podatkowe 2026 — tu aktualizuj co rok
│   │   │   ├── config.py
│   │   │   ├── dependencies.py
│   │   │   └── security.py
│   │   ├── models/models.py       # modele bazy danych
│   │   ├── routers/               # endpointy API
│   │   ├── schemas/               # walidacja danych
│   │   └── services/calculator.py # logika obliczeń
│   └── tests/
├── pwa/
│   └── src/
│       ├── pages/                 # ekrany aplikacji
│       └── components/            # komponenty UI
├── shared/
│   ├── api/                       # klient HTTP (używany przez PWA i mobile)
│   ├── hooks/                     # React hooks (useAuth, useCalculator)
│   └── types/                     # typy TypeScript
└── mobile/                        # React Native + Expo (w trakcie)
```

## Stawki podatkowe

Wszystkie stałe do obliczeń na rok 2026 znajdują się w jednym pliku: `backend/app/core/tax_constants.py`

## API

dokumentacja interaktywna `http://localhost:8000/docs`

| Endpoint | Opis |
|---|---|
| `POST /auth/register` | Rejestracja |
| `POST /auth/login` | Logowanie, zwraca JWT |
| `POST /calculator/calculate` | Obliczenie (B2B lub UoP) |
| `POST /calculator/compare` | Porównanie B2B vs UoP |
| `GET /calculations/` | Lista zapisanych kalkulacji |
| `POST /calculations/` | Zapis kalkulacji |
| `DELETE /calculations/{id}` | Usunięcie kalkulacji |
| `GET /profile/` | Profil użytkownika |
| `PUT /profile/` | Aktualizacja profilu |