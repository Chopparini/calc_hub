import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.models import Calculation, ContractType, TaxForm, User

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def db():
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


def make_user(db, username="testuser", email="test@example.com"):
    user = User(username=username, email=email, hashed_password="hashed")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_create_user(db):
    user = make_user(db)
    assert user.id is not None
    assert user.username == "testuser"
    assert user.default_contract_type is None
    assert user.default_tax_form is None


def test_user_profile_defaults(db):
    user = make_user(db)
    user.default_contract_type = ContractType.b2b
    user.default_tax_form = TaxForm.linear
    db.commit()
    db.refresh(user)

    assert user.default_contract_type == ContractType.b2b
    assert user.default_tax_form == TaxForm.linear


def test_create_calculation(db):
    user = make_user(db)
    calc = Calculation(
        user_id=user.id,
        contract_type=ContractType.b2b,
        tax_form=TaxForm.linear,
        gross_income=10000,
        monthly_costs=500,
        result_json='{"net": 7800}',
        name="Test calc",
    )
    db.add(calc)
    db.commit()
    db.refresh(calc)

    assert calc.id is not None
    assert calc.owner.username == "testuser"


def test_cascade_delete(db):
    user = make_user(db)
    calc = Calculation(
        user_id=user.id,
        contract_type=ContractType.employment,
        tax_form=None,
        gross_income=8000,
        monthly_costs=0,
        result_json='{"net": 5600}',
    )
    db.add(calc)
    db.commit()

    db.delete(user)
    db.commit()

    assert db.query(Calculation).filter_by(id=calc.id).first() is None


def test_unique_username(db):
    make_user(db, username="paula")
    with pytest.raises(Exception):
        make_user(db, username="paula", email="other@example.com")


def test_unique_email(db):
    make_user(db, email="shared@example.com")
    with pytest.raises(Exception):
        make_user(db, username="other", email="shared@example.com")
