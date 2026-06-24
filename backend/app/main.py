from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, calculator, calculations, profile


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="CalcHub API", version="1.0.0", lifespan=lifespan)

# zezwolenie przeglądarce na komunikację
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:19006"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(calculator.router)
app.include_router(calculations.router)
app.include_router(profile.router)


@app.get("/health")
def health():
    # sprawdzanie zywotnosci serwera
    return {"status": "ok"}
