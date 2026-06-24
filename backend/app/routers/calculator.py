from fastapi import APIRouter

from app.schemas.calculator import (
    CalculateRequest,
    CalculateResult,
    CompareRequest,
    CompareResult,
)
from app.services.calculator import ZUSVariant, kalkuluj_jdg, kalkuluj_uop

router = APIRouter(prefix="/calculator", tags=["kalkulator"])


@router.post("/calculate", response_model=CalculateResult)
def calculate(req: CalculateRequest):
    if req.contract_type == "b2b":
        tax_form = req.tax_form.value if req.tax_form else "linear"
        result = kalkuluj_jdg(
            przychod=req.gross_income,
            koszty=req.monthly_costs,
            tax_form=tax_form,
            zus_variant=req.zus_variant,
            stawka_ryczalt=req.lump_sum_rate,
            z_chorobowa=req.z_chorobowa,
            vat_rate=req.vat_rate,
        )
    else:
        result = kalkuluj_uop(brutto=req.gross_income, udzial_praw_autorskich=req.udzial_praw_autorskich)
    return result


@router.post("/compare", response_model=CompareResult)
def compare(req: CompareRequest):
    b2b = kalkuluj_jdg(
        przychod=req.b2b_income,
        koszty=req.monthly_costs,
        tax_form=req.tax_form.value,
        zus_variant=req.zus_variant,
        stawka_ryczalt=req.lump_sum_rate,
        z_chorobowa=req.z_chorobowa,
        vat_rate=req.vat_rate,
    )
    uop = kalkuluj_uop(brutto=req.uop_gross, udzial_praw_autorskich=req.udzial_praw_autorskich)
    return {
        "b2b": b2b,
        "uop": uop,
        "roznica_netto": b2b["net_monthly"] - uop["net_monthly"],
    }
