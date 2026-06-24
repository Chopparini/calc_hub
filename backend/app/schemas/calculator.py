from decimal import Decimal

from pydantic import BaseModel, field_validator

from app.models.models import ContractType, TaxForm
from app.services.calculator import ZUSVariant


class CalculateRequest(BaseModel):
    contract_type: ContractType
    tax_form: TaxForm | None = None
    gross_income: Decimal
    monthly_costs: Decimal = Decimal("0")
    zus_variant: ZUSVariant = ZUSVariant.full
    lump_sum_rate: Decimal = Decimal("0.12")
    z_chorobowa: bool = True
    udzial_praw_autorskich: Decimal = Decimal("0")
    vat_rate: str = "23"  # "23", "8", "5", "0", "zw"

    @field_validator("gross_income", "monthly_costs")
    @classmethod
    def non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Wartość nie może być ujemna")
        return v

    @field_validator("lump_sum_rate")
    @classmethod
    def valid_rate(cls, v: Decimal) -> Decimal:
        if not (Decimal("0") < v <= Decimal("1")):
            raise ValueError("Stawka ryczałtu musi być między 0 a 1")
        return v


class ZUSBreakdown(BaseModel):
    emerytalna: float
    rentowa: float
    chorobowa: float
    wypadkowa: float | None = None
    fp: float | None = None


class CalculateResult(BaseModel):
    net_monthly: Decimal
    gross_income: Decimal
    monthly_costs: Decimal
    income_tax: Decimal
    health_insurance: Decimal
    zus_social: Decimal
    zus_breakdown: dict
    vat_monthly: Decimal | None
    # pola tylko dla UoP
    koszt_pracodawcy: Decimal | None = None
    zus_pracodawcy: Decimal | None = None
    zus_pracodawcy_breakdown: dict | None = None
    udzial_praw_autorskich: Decimal | None = None


class CompareRequest(BaseModel):
    b2b_income: Decimal
    monthly_costs: Decimal = Decimal("0")
    tax_form: TaxForm = TaxForm.linear
    zus_variant: ZUSVariant = ZUSVariant.full
    lump_sum_rate: Decimal = Decimal("0.12")
    z_chorobowa: bool = True
    udzial_praw_autorskich: Decimal = Decimal("0")
    vat_rate: str = "23"
    uop_gross: Decimal

    @field_validator("b2b_income", "monthly_costs", "uop_gross")
    @classmethod
    def non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Wartość nie może być ujemna")
        return v


class CompareResult(BaseModel):
    b2b: CalculateResult
    uop: CalculateResult
    roznica_netto: Decimal
