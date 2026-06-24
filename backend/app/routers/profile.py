from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profil"])


class ProfileOut(ProfileUpdate):
    username: str
    email: str

    model_config = {"from_attributes": True}


@router.get("/", response_model=ProfileOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/", response_model=ProfileOut)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.default_contract_type = payload.default_contract_type

    if payload.default_contract_type == "employment":
        # UoP — zeruj pola B2B, zapisz stawkę brutto
        current_user.default_tax_form = None
        current_user.default_zus_variant = None
        current_user.default_lump_sum_rate = None
        current_user.default_z_chorobowa = None
        current_user.default_uop_gross = payload.default_uop_gross
    elif payload.default_contract_type == "b2b":
        current_user.default_tax_form = payload.default_tax_form
        current_user.default_zus_variant = payload.default_zus_variant
        current_user.default_z_chorobowa = (
            int(payload.default_z_chorobowa) if payload.default_z_chorobowa is not None else None
        )
        current_user.default_lump_sum_rate = (
            payload.default_lump_sum_rate if payload.default_tax_form == "lump_sum" else None
        )
        current_user.default_vat_rate = payload.default_vat_rate
        current_user.default_uop_gross = None
    else:
        # brak wyboru — zeruj wszystko
        current_user.default_tax_form = None
        current_user.default_zus_variant = None
        current_user.default_lump_sum_rate = None
        current_user.default_z_chorobowa = None
        current_user.default_uop_gross = None
        current_user.default_vat_rate = None

    db.commit()
    db.refresh(current_user)
    return current_user
