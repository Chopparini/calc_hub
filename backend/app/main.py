import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import models  # noqa: F401
from app.routers import auth, calculator, calculations, profile

DEFAULT_ORIGINS = ["http://localhost:5173", "http://localhost:19006"]
extra = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = DEFAULT_ORIGINS + \
    [o.strip() for o in extra.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="CalcHub API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
