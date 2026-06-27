# CalcHub - Kalkulator podatkowy

Aplikacja do obliczania i porównywania wynagrodzeń netto dla różnych form współpracy: JDG/B2B, Umowa o pracę. Projekt semestralny.

## Stack

| Warstwa | Technologie |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, PostgreSQL, JWT |
| PWA | React, Vite, TypeScript, Tailwind CSS, React Router |
| Mobile | React Native, Expo (Expo Go) |

## Deploy

| Środowisko | URL |
|---|---|
| Backend (Railway) | https://calchub-production-ad54.up.railway.app |
| PWA (Vercel) | https://calcproto.vercel.app |
| API Docs | https://calchub-production-ad54.up.railway.app/docs |

---

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

---

### Mobile (Expo Go)

Aplikacja mobilna działa przez [Expo Go](https://expo.dev/go) — nie wymaga budowania APK ani Android Studio.

**Wymagania:**
- Node.js 18+
- Aplikacja Expo Go zainstalowana na telefonie (Android lub iOS)

**Uruchomienie:**

```bash
cd mobile
npm install
npx expo start --tunnel
```

Zeskanuj QR kod który pojawi się w terminalu:
- **Android** — otwórz aplikację Expo Go i użyj opcji "Scan QR code"
- **iOS** — zeskanuj aparatem telefonu

Flaga `--tunnel` jest przydatna gdy komputer i telefon są w różnych sieciach (np. LAN vs WiFi). W tej samej sieci lokalnej można użyć samego `npx expo start`.

Aplikacja mobilna domyślnie łączy się z produkcyjnym backendem na Railway. Aby połączyć z lokalnym backendem, utwórz plik `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://<twoje-lokalne-ip>:8000
```

---

### Testy backendu

```bash
cd backend
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pytest
```

---

## Funkcjonalności

### Kalkulator
- **JDG / B2B** — podatek liniowy, skala podatkowa, ryczałt; pełny ZUS / preferencyjny / ulga na start; dobrowolna chorobowa
- **Umowa o pracę** — obliczenia brutto→netto, koszt pracodawcy, walidacja minimalnego wynagrodzenia
- **Porównanie JDG vs UoP** — po obliczeniu UoP można sprawdzić ile wyszłoby na B2B (3 warianty)

### Konto użytkownika
- Rejestracja i logowanie (JWT)
- Zapis i przeglądanie historii kalkulacji
- Profil z domyślnymi ustawieniami (forma współpracy, opodatkowanie, ZUS, stawka VAT)

### Testowanie API (Postman / Swagger)

Swagger UI: `http://localhost:8000/docs`

1. Wywołaj `POST /auth/register` → "Try it out" i wpisz dane
2. Wywołaj `POST /auth/login` → skopiuj `access_token`
3. Kliknij **Authorize** (kłódka) i wklej token
4. Od tej pory wszystkie żądania będą autoryzowane

---

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
│   ├── api/                       # klient HTTP współdzielony z PWA
│   ├── hooks/                     # React hooks (useAuth, useCalculator)
│   └── types/                     # typy TypeScript
└── mobile/
    └── src/
        ├── screens/               # ekrany aplikacji
        ├── api/                   # klient HTTP (własny, niezależny od shared)
        ├── context/               # AuthContext
        └── theme.ts               # kolory i style
```

## Stawki podatkowe

Wszystkie stawki i kwoty na rok 2026 znajdują się w jednym pliku: `backend/app/core/tax_constants.py`. Aktualizacja na nowy rok = zmiana wartości w tym pliku.

## API

Pełna dokumentacja interaktywna: `https://calchub-production-ad54.up.railway.app/docs`

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
