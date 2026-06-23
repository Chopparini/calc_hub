from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator

from app.models.models import ContractType, TaxForm

# schematy profilu użytkownika i zapisanych kalkulacji


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

    model_config = {"from_attributes": True}
