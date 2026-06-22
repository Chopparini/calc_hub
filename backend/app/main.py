from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# uruchomienie instancji FastAPI


app = FastAPI(title="CalcHub API", version="1.0.0")


# zezwolenie przeglądarce na komunikację
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:19006"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables():
    '''
    Tworzy tabele danych w db wg zadanego modelu
    '''
    Base.metadata.create_all(bind=engine)


# sprawdzanie zywotnosci serwera
@app.get("/health")
def health():
    return {"status": "ok"}
