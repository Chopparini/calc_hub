import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.models import Calculation, User
from app.schemas.calculator import CalculateRequest, CalculateResult
from app.schemas.schemas import CalculationCreate, CalculationOut
from app.services.calculator import ZUSVariant, kalkuluj_jdg, kalkuluj_uop

router = APIRouter(prefix="/calculations", tags=["kalkulacje"])


@router.get("/", response_model=list[CalculationOut])
def list_calculations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Calculation)
        .filter(Calculation.user_id == current_user.id)
        .order_by(Calculation.created_at.desc())
        .all()
    )


@router.post("/", response_model=CalculationOut, status_code=status.HTTP_201_CREATED)
def save_calculation(
    payload: CalculationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tax_form_val = payload.tax_form.value if payload.tax_form else "linear"
    zus_variant = payload.zus_variant or ZUSVariant.full

    if payload.contract_type == "b2b":
        result = kalkuluj_jdg(
            przychod=payload.gross_income,
            koszty=payload.monthly_costs,
            tax_form=tax_form_val,
            zus_variant=zus_variant,
        )
    else:
        result = kalkuluj_uop(brutto=payload.gross_income)

    serializable = {k: str(v) if hasattr(v, "quantize")
                    else v for k, v in result.items()}

    calc = Calculation(
        user_id=current_user.id,
        contract_type=payload.contract_type,
        tax_form=payload.tax_form,
        zus_variant=payload.zus_variant,
        gross_income=payload.gross_income,
        monthly_costs=payload.monthly_costs,
        result_json=json.dumps(serializable),
        name=payload.name,
    )
    db.add(calc)
    db.commit()
    db.refresh(calc)
    return calc


@router.delete("/{calc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_calculation(
    calc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    calc = db.query(Calculation).filter(
        Calculation.id == calc_id,
        Calculation.user_id == current_user.id,
    ).first()
    if not calc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Kalkulacja nie istnieje")
    db.delete(calc)
    db.commit()
