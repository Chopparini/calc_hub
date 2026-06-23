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

    calculations = relationship(
        "Calculation", back_populates="owner", cascade="all, delete-orphan")


class Calculation(Base):
    __tablename__ = "calculations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # dane wejściowe kalkulacji
    contract_type = Column(Enum(ContractType), nullable=False)
    tax_form = Column(Enum(TaxForm), nullable=True)  # tylko dla B2B
    gross_income = Column(Numeric(12, 2), nullable=False)
    monthly_costs = Column(Numeric(12, 2), default=0, nullable=False)

    # wynik zapisany jako JSON
    result_json = Column(Text, nullable=False)

    # opcjonalna nazwa nadana przez użytkownika
    name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    owner = relationship("User", back_populates="calculations")
