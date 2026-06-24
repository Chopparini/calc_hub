"""Logika obliczeń podatkowych — stawki pobierane z app/core/tax_constants.py."""
from decimal import ROUND_HALF_UP, Decimal
from enum import Enum

from app.core.tax_constants import (
    MINIMALNE_WYNAGRODZENIE,
    PIT_KWOTA_WOLNA,
    PIT_LINIOWY_STAWKA,
    PIT_PROG_ROCZNY,
    PIT_STAWKA_NISKA,
    PIT_STAWKA_WYSOKA,
    UOP_KUP,
    UOP_KUP_AUTORSKIE_LIMIT_ROCZNY,
    UOP_PRACODAWCA_ZUS_EMERYTALNA,
    UOP_PRACODAWCA_ZUS_FGSP,
    UOP_PRACODAWCA_ZUS_FP,
    UOP_PRACODAWCA_ZUS_RENTOWA,
    UOP_PRACODAWCA_ZUS_WYPADKOWA,
    UOP_ZUS_CHOROBOWA,
    UOP_ZUS_EMERYTALNA,
    UOP_ZUS_RENTOWA,
    UOP_ZDROWOTNA_STAWKA,
    ZDROWOTNA_LINIOWY_STAWKA,
    ZDROWOTNA_MINIMALNA,
    ZDROWOTNA_RYCZALT_PROGI,
    ZDROWOTNA_SKALA_STAWKA,
    ZUS_PODSTAWA_PELNA,
    ZUS_PODSTAWA_PREFERENCYJNA,
    ZUS_STAWKA_CHOROBOWA,
    ZUS_STAWKA_EMERYTALNA,
    ZUS_STAWKA_FP,
    ZUS_STAWKA_RENTOWA,
    ZUS_STAWKA_WYPADKOWA,
)


class ZUSVariant(str, Enum):
    full = "full"                    # pełne ZUS
    preferential = "preferential"    # preferencyjne (pierwsze 24 mies.)
    ulga_na_start = "ulga_na_start"  # ulga na start (pierwsze 6 mies.) — brak składek społecznych


def _r(v: Decimal) -> Decimal:
    return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _zus_from_base(podstawa: Decimal, with_fp: bool = True, with_chorobowa: bool = True) -> dict:
    return {
        "emerytalna": _r(podstawa * ZUS_STAWKA_EMERYTALNA),
        "rentowa":    _r(podstawa * ZUS_STAWKA_RENTOWA),
        "chorobowa":  _r(podstawa * ZUS_STAWKA_CHOROBOWA) if with_chorobowa else Decimal("0.00"),
        "wypadkowa":  _r(podstawa * ZUS_STAWKA_WYPADKOWA),
        "fp":         _r(podstawa * ZUS_STAWKA_FP) if with_fp else Decimal("0.00"),
    }


def _maly_plus_podstawa(poprzedni_rok: Decimal) -> Decimal:
    """Podstawa MZP = 30% × średni dzienny przychód × 30, wg art. 18c ustawy systemowej."""
    podstawa = _r(Decimal("0.30") * (poprzedni_rok / Decimal("365")) * Decimal("30"))
    min_p = _r(MINIMALNE_WYNAGRODZENIE * Decimal("0.30"))
    return max(min_p, min(podstawa, ZUS_PODSTAWA_PELNA))


def oblicz_zus_spoleczne(variant: ZUSVariant, z_chorobowa: bool = True) -> dict:
    if variant == ZUSVariant.ulga_na_start:
        return {"emerytalna": Decimal("0"), "rentowa": Decimal("0"), "chorobowa": Decimal("0"), "wypadkowa": Decimal("0"), "fp": Decimal("0")}
    if variant == ZUSVariant.full:
        return _zus_from_base(ZUS_PODSTAWA_PELNA, with_chorobowa=z_chorobowa)
    return _zus_from_base(ZUS_PODSTAWA_PREFERENCYJNA, with_fp=False, with_chorobowa=z_chorobowa)


def oblicz_zdrowotna_jdg(tax_form: str, dochod: Decimal, przychod_roczny: Decimal) -> Decimal:
    if tax_form == "linear":
        return max(_r(dochod * ZDROWOTNA_LINIOWY_STAWKA), ZDROWOTNA_MINIMALNA)
    if tax_form == "scale":
        return max(_r(dochod * ZDROWOTNA_SKALA_STAWKA), ZDROWOTNA_MINIMALNA)
    # lump_sum — ryczałt: kwota zależna od rocznego przychodu
    for prog, kwota in ZDROWOTNA_RYCZALT_PROGI:
        if prog is None or przychod_roczny <= prog:
            return kwota
    return ZDROWOTNA_RYCZALT_PROGI[-1][1]


def _pit_skala_roczny(podstawa: Decimal) -> Decimal:
    if podstawa <= PIT_KWOTA_WOLNA:
        return Decimal("0")
    if podstawa <= PIT_PROG_ROCZNY:
        return _r((podstawa - PIT_KWOTA_WOLNA) * PIT_STAWKA_NISKA)
    podatek = _r((PIT_PROG_ROCZNY - PIT_KWOTA_WOLNA) * PIT_STAWKA_NISKA)
    podatek += _r((podstawa - PIT_PROG_ROCZNY) * PIT_STAWKA_WYSOKA)
    return podatek


_PLN = Decimal("1")
_ULGA_MIESIECZNA = Decimal("300")  # kwota wolna miesięcznie = 30 000 × 12% / 12


def _pit_uop_miesieczny(podstawa_pit: Decimal) -> Decimal:
    """Zaliczka PIT dla UoP zaokrąglona do pełnych złotych (art. 32 ustawy PIT)."""
    if podstawa_pit <= 0:
        return Decimal("0")
    roczna = podstawa_pit * 12
    if roczna <= PIT_KWOTA_WOLNA:
        return Decimal("0")
    if roczna <= PIT_PROG_ROCZNY:
        zaliczka = podstawa_pit * PIT_STAWKA_NISKA - _ULGA_MIESIECZNA
    else:
        prog_m = _r(PIT_PROG_ROCZNY / 12)
        zaliczka = prog_m * PIT_STAWKA_NISKA - _ULGA_MIESIECZNA + (podstawa_pit - prog_m) * PIT_STAWKA_WYSOKA
    return max(zaliczka.quantize(_PLN, rounding=ROUND_HALF_UP), Decimal("0"))


_VAT_STAWKI = {"23": Decimal("0.23"), "8": Decimal("0.08"), "5": Decimal("0.05"), "0": Decimal("0.00"), "zw": Decimal("0.00")}


def kalkuluj_jdg(
    przychod: Decimal,
    koszty: Decimal,
    tax_form: str,
    zus_variant: ZUSVariant = ZUSVariant.full,
    stawka_ryczalt: Decimal = Decimal("0.12"),
    z_chorobowa: bool = True,
    vat_rate: str = "23",
) -> dict:
    zus = oblicz_zus_spoleczne(zus_variant, z_chorobowa)
    zus_total = sum(zus.values())
    przychod_roczny = przychod * 12

    if tax_form == "linear":
        dochod = max(przychod - koszty - zus_total, Decimal("0"))
        pit = _r(dochod * PIT_LINIOWY_STAWKA).quantize(_PLN, rounding=ROUND_HALF_UP)
        zdrowotna = oblicz_zdrowotna_jdg("linear", dochod, przychod_roczny)

    elif tax_form == "scale":
        dochod = max(przychod - koszty - zus_total, Decimal("0"))
        pit = _r(_pit_skala_roczny(dochod * 12) / 12).quantize(_PLN, rounding=ROUND_HALF_UP)
        zdrowotna = oblicz_zdrowotna_jdg("scale", dochod, przychod_roczny)

    else:  # lump_sum
        pit = _r(przychod * stawka_ryczalt).quantize(_PLN, rounding=ROUND_HALF_UP)
        zdrowotna = oblicz_zdrowotna_jdg("lump_sum", Decimal("0"), przychod_roczny)

    vat = _r(przychod * _VAT_STAWKI.get(vat_rate, Decimal("0.23"))) if vat_rate != "zw" else None
    netto = _r(przychod - koszty - zus_total - pit - zdrowotna)

    return {
        "net_monthly":      netto,
        "gross_income":     przychod,
        "monthly_costs":    koszty,
        "income_tax":       pit,
        "health_insurance": zdrowotna,
        "zus_social":       _r(zus_total),
        "zus_breakdown":    {k: float(v) for k, v in zus.items()},
        "vat_monthly":      vat,
    }


def kalkuluj_uop(brutto: Decimal, udzial_praw_autorskich: Decimal = Decimal("0")) -> dict:
    zus_prac = _r(brutto * (UOP_ZUS_EMERYTALNA + UOP_ZUS_RENTOWA + UOP_ZUS_CHOROBOWA))
    zdrowotna = _r((brutto - zus_prac) * UOP_ZDROWOTNA_STAWKA)

    if udzial_praw_autorskich > 0:
        # KUP autorskie = 50% × (część twórcza brutto - proporcjonalny ZUS)
        tworcza_brutto = _r(brutto * udzial_praw_autorskich)
        tworcza_zus = _r(zus_prac * udzial_praw_autorskich)
        kup_autorskie = _r((tworcza_brutto - tworcza_zus) * Decimal("0.5"))
        limit_miesieczny = _r(UOP_KUP_AUTORSKIE_LIMIT_ROCZNY / 12)
        kup_miesiecznie = min(kup_autorskie, limit_miesieczny)
    else:
        kup_miesiecznie = UOP_KUP

    podstawa_pit = (brutto - kup_miesiecznie - zus_prac).quantize(_PLN, rounding=ROUND_HALF_UP)
    pit = _pit_uop_miesieczny(podstawa_pit)
    netto = _r(brutto - zus_prac - zdrowotna - pit)

    zus_pracodawcy = _r(brutto * (
        UOP_PRACODAWCA_ZUS_EMERYTALNA +
        UOP_PRACODAWCA_ZUS_RENTOWA +
        UOP_PRACODAWCA_ZUS_WYPADKOWA +
        UOP_PRACODAWCA_ZUS_FP +
        UOP_PRACODAWCA_ZUS_FGSP
    ))
    koszt_pracodawcy = brutto + zus_pracodawcy

    return {
        "net_monthly":      netto,
        "gross_income":     brutto,
        "monthly_costs":    Decimal("0"),
        "income_tax":       pit,
        "health_insurance": zdrowotna,
        "zus_social":       zus_prac,
        "zus_breakdown": {
            "emerytalna": float(_r(brutto * UOP_ZUS_EMERYTALNA)),
            "rentowa":    float(_r(brutto * UOP_ZUS_RENTOWA)),
            "chorobowa":  float(_r(brutto * UOP_ZUS_CHOROBOWA)),
        },
        "koszt_pracodawcy":      koszt_pracodawcy,
        "zus_pracodawcy":        zus_pracodawcy,
        "zus_pracodawcy_breakdown": {
            "emerytalna": float(_r(brutto * UOP_PRACODAWCA_ZUS_EMERYTALNA)),
            "rentowa":    float(_r(brutto * UOP_PRACODAWCA_ZUS_RENTOWA)),
            "wypadkowa":  float(_r(brutto * UOP_PRACODAWCA_ZUS_WYPADKOWA)),
            "fp":         float(_r(brutto * UOP_PRACODAWCA_ZUS_FP)),
            "fgsp":       float(_r(brutto * UOP_PRACODAWCA_ZUS_FGSP)),
        },
        "udzial_praw_autorskich": float(udzial_praw_autorskich),
        "vat_monthly":   None,
    }
