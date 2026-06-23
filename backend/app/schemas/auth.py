import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

from app.models.models import ContractType, TaxForm


# schematy rejestracji, logowania i odpowiedzi auth (walidacja loginu, hasła i tokenu JWT)


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not re.fullmatch(r"[a-zA-Z0-9]+", v):
            raise ValueError("Username must contain only letters and digits")
        return v

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 12 or len(v) > 50:
            raise ValueError("Password must be between 12 and 50 characters")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    default_contract_type: ContractType | None
    default_tax_form: TaxForm | None
    created_at: datetime

    model_config = {"from_attributes": True}
