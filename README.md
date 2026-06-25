# CalcHub - Kalkulator podatkowy

Aplikacja do obliczania i porównywania wynagrodzeń netto dla różnych form współpracy: JDG/B2B, Umowa o pracę. Projekt semestralny.

## Stack

| Warstwa | Technologie |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, PostgreSQL, JWT |
| PWA | React, Vite, TypeScript, Tailwind CSS, React Router |
| Mobile | React Native, Expo |

## Uruchomienie lokalne

```bash
git clone https://github.com/Chopparini/calcproto.git
cd calcproto
```

### Wymagania
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend

1. Utwórz bazę danych w PostgreSQL:

```sql
CREATE USER calchub WITH PASSWORD 'calchub123';
CREATE DATABASE calchub OWNER calchub;
```

2. Skopiuj plik środowiskowy:

```bash
cd backend
cp .env.example .env
```

W pliku `.env` ustaw `DATABASE_URL`:
```
DATABASE_URL=postgresql+psycopg://calchub:calchub123@localhost:5432/calchub
```

3. Utwórz środowisko wirtualne i zainstaluj zależności:

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

4. Uruchom backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Dokumentacja API dostępna pod: `http://localhost:8000/docs`

#### Testowanie API (Postman / Swagger)

Swagger UI dostępny pod `http://localhost:8000/docs` - możesz testować endpointy bezpośrednio w przeglądarce.

**Swagger:**
1. Wywołaj `POST /auth/register` - kliknij "Try it out" i wpisz dane
2. Wywołaj `POST /auth/login` - skopiuj `access_token` z odpowiedzi
3. Kliknij **Authorize** (kłódka w prawym górnym rogu) i wklej token
4. Od tej pory wszystkie żądania będą wysyłane z tokenem

**Postman:**
1. `POST /auth/register` - utwórz konto
2. `POST /auth/login` - skopiuj token z odpowiedzi
3. W kolejnych żądaniach dodaj nagłówek: `Authorization: Bearer <token>`

### Cały stack przez Docker

Zainstaluj [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

- PWA: `http://localhost:5173`
- Backend / Swagger: `http://localhost:8000/docs`

Baza i tabele tworzone automatycznie przy pierwszym uruchomieniu.

---

### PWA (bez Dockera)

Wymaga uruchomionego backendu na porcie 8000.

```bash
cd pwa
npm install
npm run dev
```

Aplikacja dostępna pod: `http://localhost:5173`

### Testy backendu

```bash
cd backend
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pytest
```

## Funkcjonalności

### Kalkulator
- **JDG / B2B** - podatek liniowy, skala podatkowa, ryczałt; pełne ZUS / preferencyjne / ulga na start; dobrowolna chorobowa
- **Umowa o pracę** - standardowe KUP lub 50% KUP (prawa autorskie); koszt pracodawcy
- **Porównanie JDG vs UoP** - różnica netto w jednym widoku

### Konto użytkownika
- Rejestracja i logowanie (JWT)
- Zapis i przeglądanie historii kalkulacji
- Profil z domyślnymi ustawieniami (forma działalności, opodatkowanie, ZUS)

## Struktura projektu

```
calchub/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── tax_constants.py   # stawki podatkowe 2026 - tu aktualizuj co rok
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
└── mobile/                        # React Native + Expo
```

## Stawki podatkowe

Wszystkie stawki i kwoty na rok 2026 znajdują się w jednym pliku: `backend/app/core/tax_constants.py`. Aktualizacja na nowy rok = zmiana wartości w tym pliku.

## API

Pełna dokumentacja interaktywna: `http://localhost:8000/docs`

| Endpoint | Opis |
|---|---|
| `POST /auth/register` | Rejestracja |
| `POST /auth/login` | Logowanie, zwraca JWT |
| `GET /auth/me` | Dane zalogowanego użytkownika |
| `POST /calculator/calculate` | Obliczenie (B2B lub UoP) |
| `POST /calculator/compare` | Porównanie B2B vs UoP |
| `GET /calculations/` | Lista zapisanych kalkulacji |
| `POST /calculations/` | Zapis kalkulacji |
| `DELETE /calculations/{id}` | Usunięcie kalkulacji |
| `GET /profile/` | Profil użytkownika |
| `PUT /profile/` | Aktualizacja profilu |
