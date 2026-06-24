"""
Stałe podatkowe i składkowe — aktualizuj ten plik co roku.
Obecne wartości: rok 2026.
"""
from decimal import Decimal

# ===========================================================================
# ZUS SPOŁECZNE — podstawy wymiaru składek
# ===========================================================================

# Pełne ZUS: 60% prognozowanego przeciętnego wynagrodzenia
ZUS_PODSTAWA_PELNA = Decimal("5652.00")

# Preferencyjne ZUS (pierwsze 24 miesiące): 30% minimalnego wynagrodzenia
ZUS_PODSTAWA_PREFERENCYJNA = Decimal("1441.80")   # 30% × 4806 PLN min. wynagr.

# Minimalne wynagrodzenie (używane do obliczenia podstawy preferencyjnej)
MINIMALNE_WYNAGRODZENIE = Decimal("4806.00")

# Ulga na start (pierwsze 6 miesięcy): zwolnienie ze składek społecznych
# składka zdrowotna nadal obowiązuje wg normalnych reguł (min. 432,54 zł)
ZUS_PODSTAWA_ULGA_NA_START = Decimal("0.00")

# Stawki składek ZUS (procenty — takie same dla każdej podstawy)
ZUS_STAWKA_EMERYTALNA = Decimal("0.1952")   # 19,52%
ZUS_STAWKA_RENTOWA = Decimal("0.0800")  # 8,00%
ZUS_STAWKA_CHOROBOWA = Decimal("0.0245")  # 2,45% (dobrowolna)
ZUS_STAWKA_WYPADKOWA = Decimal("0.0167")  # 1,67%
ZUS_STAWKA_FP = Decimal("0.0245")  # 2,45% Fundusz Pracy
# Uwaga: przy ZUS preferencyjnym nie płaci się składki FP

# ===========================================================================
# SKŁADKA ZDROWOTNA
# ===========================================================================

# Minimalna składka zdrowotna dla liniowego i skali: 9% × min. wynagrodzenie / 12
ZDROWOTNA_MINIMALNA = Decimal("432.54")        # 9% × 4806 zł / 12

# Stawka zdrowotnej dla podatku liniowego (od dochodu)
ZDROWOTNA_LINIOWY_STAWKA = Decimal("0.049")   # 4,9%

# Stawka zdrowotnej dla skali podatkowej (od dochodu)
ZDROWOTNA_SKALA_STAWKA = Decimal("0.09")      # 9,0%

# Ryczałtowe kwoty zdrowotnej dla ryczałtu (od progu rocznego przychodu)
# Format: (próg roczny przychodu, miesięczna składka)
ZDROWOTNA_RYCZALT_PROGI = [
    (Decimal("60000"),  Decimal("498.35")),
    (Decimal("300000"), Decimal("830.58")),
    (None,              Decimal("1495.04")),   # None = powyżej 300 000 zł
]

# ===========================================================================
# PODATEK DOCHODOWY — PIT
# ===========================================================================

# Skala podatkowa
PIT_PROG_ROCZNY = Decimal("120000")   # próg między stawką 12% a 32%
PIT_KWOTA_WOLNA = Decimal("30000")    # kwota wolna od podatku
PIT_STAWKA_NISKA = Decimal("0.12")     # 12%
PIT_STAWKA_WYSOKA = Decimal("0.32")     # 32%

# Podatek liniowy
PIT_LINIOWY_STAWKA = Decimal("0.19")    # 19%

# ===========================================================================
# UMOWA O PRACĘ
# ===========================================================================

# Składki ZUS pracownika (od brutto)
UOP_ZUS_EMERYTALNA = Decimal("0.0976")  # 9,76%
UOP_ZUS_RENTOWA = Decimal("0.0150")  # 1,50%
UOP_ZUS_CHOROBOWA = Decimal("0.0245")  # 2,45%

# Składka zdrowotna pracownika (od brutto − ZUS pracownika)
UOP_ZDROWOTNA_STAWKA = Decimal("0.09")  # 9,0%

# Koszty uzyskania przychodu (stałe, odliczane przed PIT)
UOP_KUP = Decimal("250.00")            # 250 zł / miesiąc

# 50% KUP (prawa autorskie) — roczny limit odliczenia
UOP_KUP_AUTORSKIE_LIMIT_ROCZNY = Decimal("120000.00")

# Składki ZUS pracodawcy (od brutto pracownika)
UOP_PRACODAWCA_ZUS_EMERYTALNA = Decimal("0.0976")  # 9,76%
UOP_PRACODAWCA_ZUS_RENTOWA = Decimal("0.0650")  # 6,50%
UOP_PRACODAWCA_ZUS_WYPADKOWA = Decimal("0.0167")  # 1,67%
UOP_PRACODAWCA_ZUS_FP = Decimal("0.0245")  # 2,45% Fundusz Pracy
UOP_PRACODAWCA_ZUS_FGSP = Decimal("0.0010")  # 0,10% FGŚP
