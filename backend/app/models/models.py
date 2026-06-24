import enum
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.database import Base

# definicje tabel do bazy danych


def utcnow():
    return datetime.now(timezone.utc)


class TaxForm(str, enum.Enum):
    linear = "linear"           # podatek liniowy 19%
    scale = "scale"             # skala podatkowa 12/32%
    lump_sum = "lump_sum"       # ryczałt


class ContractType(str, enum.Enum):
    b2b = "b2b"                 # JDG / B2B
    employment = "employment"   # umowa o pracę


class ZUSVariant(str, enum.Enum):
    full = "full"                    # pełne ZUS
    preferential = "preferential"    # preferencyjne (pierwsze 24 mies.)
    ulga_na_start = "ulga_na_start"  # ulga na start (pierwsze 6 mies.)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # domyślne ustawienia profilu użytkownika
    default_contract_type = Column(Enum(ContractType), nullable=True)
    default_tax_form = Column(Enum(TaxForm), nullable=True)
    default_zus_variant = Column(Enum(ZUSVariant), nullable=True)
    default_lump_sum_rate = Column(
        Numeric(4, 3), nullable=True)  # np. 0.120 dla 12%
    # 1 = tak, 0 = nie, None = brak domyślnej
    default_z_chorobowa = Column(Integer, nullable=True)
    default_uop_gross = Column(Numeric(12, 2), nullable=True)
    # "23", "8", "5", "0", "zw"
    default_vat_rate = Column(String(5), nullable=True)

    calculations = relationship(
        "Calculation", back_populates="owner", cascade="all, delete-orphan")


class Calculation(Base):
    __tablename__ = "calculations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # dane wejściowe kalkulacji
    contract_type = Column(Enum(ContractType), nullable=False)
    tax_form = Column(Enum(TaxForm), nullable=True)        # tylko dla B2B
    zus_variant = Column(Enum(ZUSVariant), nullable=True)  # tylko dla B2B
    gross_income = Column(Numeric(12, 2), nullable=False)
    monthly_costs = Column(Numeric(12, 2), default=0, nullable=False)

    # wynik zapisany jako JSON
    result_json = Column(Text, nullable=False)

    # opcjonalna nazwa nadana przez użytkownika
    name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    owner = relationship("User", back_populates="calculations")
