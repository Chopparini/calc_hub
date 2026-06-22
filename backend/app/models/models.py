import enum
from datetime import datetime, timezone


def utcnow():
    return datetime.now(timezone.utc)

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class TaxForm(str, enum.Enum):
    linear = "linear"           # podatek liniowy 19%
    scale = "scale"             # skala podatkowa 12/32%
    lump_sum = "lump_sum"       # ryczałt


class ContractType(str, enum.Enum):
    b2b = "b2b"                 # JDG / B2B
    employment = "employment"   # Umowa o pracę
    mandate = "mandate"         # Umowa zlecenie


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Profile / default settings
    default_contract_type = Column(Enum(ContractType), nullable=True)
    default_tax_form = Column(Enum(TaxForm), nullable=True)

    calculations = relationship("Calculation", back_populates="owner", cascade="all, delete-orphan")


class Calculation(Base):
    __tablename__ = "calculations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Input
    contract_type = Column(Enum(ContractType), nullable=False)
    tax_form = Column(Enum(TaxForm), nullable=True)  # only for B2B
    gross_income = Column(Numeric(12, 2), nullable=False)
    monthly_costs = Column(Numeric(12, 2), default=0, nullable=False)

    # Results stored as JSON string for flexibility
    result_json = Column(Text, nullable=False)

    name = Column(String(100), nullable=True)  # optional user-given label
    created_at = Column(DateTime, default=utcnow, nullable=False)

    owner = relationship("User", back_populates="calculations")
