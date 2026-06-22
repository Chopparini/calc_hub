import re
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, field_validator

from app.models.models import ContractType, TaxForm


# definicje danych wejściowych/wyjściowych


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

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    default_contract_type: ContractType | None = None
    default_tax_form: TaxForm | None = None


class CalculationCreate(BaseModel):
    contract_type: ContractType
    tax_form: TaxForm | None = None
    gross_income: Decimal
    monthly_costs: Decimal = Decimal("0")
    name: str | None = None

    @field_validator("gross_income", "monthly_costs")
    @classmethod
    def non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Amount must be non-negative")
        return v


class CalculationOut(BaseModel):
    id: int
    contract_type: ContractType
    tax_form: TaxForm | None
    gross_income: Decimal
    monthly_costs: Decimal
    result_json: str
    name: str | None
    created_at: datetime

    class Config:
        from_attributes = True
