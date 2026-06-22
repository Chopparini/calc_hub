from pydantic_settings import BaseSettings, SettingsConfigDict


# konfiguracja aplikacji wczytywana z .env


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60


settings = Settings()
