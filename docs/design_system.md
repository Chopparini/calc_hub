# CalcHub — Design System

## Kolory

### Tła
| Nazwa | Hex | Zastosowanie |
|---|---|---|
| `bg-base` | `#0f0e17` | Główne tło aplikacji (body) |
| `bg-wrapper` | `#1a1a2e` | Wrapper kontenera aplikacji (max-width) |
| `bg-surface` | `#16213e` | Karty, nawigacja, headery |
| `bg-input` | `#0f0f23` | Pola input, selecty |
| `bg-accent-subtle` | `#2d1b69` | Wyróżnione kafelki (netto hero) |

### Akcenty
| Nazwa | Hex | Zastosowanie |
|---|---|---|
| `accent-primary` | `#7c3aed` | Przyciski główne, aktywne zakładki |
| `accent-light` | `#a78bfa` | Wartości netto, aktywne ikony nawigacji |

### Tekst
| Nazwa | Hex | Zastosowanie |
|---|---|---|
| `text-primary` | `#e8e6f0` | Główny tekst, wartości |
| `text-secondary` | `#9994b8` | Etykiety, opisy, daty |

### Statusy
| Nazwa | Hex | Zastosowanie |
|---|---|---|
| `status-warning` | `#fbbf24` | Podatek, ZUS (wartości do zapłaty) |
| `status-error` | `#f87171` | Błędy, VAT, przycisk Wyzeruj |
| `status-success` | `#22c55e` | Różnica netto na plus w porównywarce |

### Obramowania
| Nazwa | Hex | Zastosowanie |
|---|---|---|
| `border-default` | `#2d2d4e` | Karty, inputy, separatory |
| `border-accent` | `#7c3aed` | Aktywne elementy, ryczałt extra |
| `border-error` | `#7f1d1d` | Przycisk Wyzeruj, błędy |

---

## Typografia

- **Font:** system-ui, sans-serif
- **Tytuły stron:** 18px, font-weight 500
- **Tytuły kart:** 13px, uppercase, letter-spacing 0.06em, kolor `text-secondary`
- **Wartość netto (hero):** 32–36px, font-weight 500, kolor `accent-light`
- **Wartości w kafelkach:** 16–22px, font-weight 500
- **Etykiety formularzy:** 12px, kolor `text-secondary`
- **Tekst podstawowy:** 13–14px

---

## Komponenty

### Przyciski

**Główny (Primary)**
- Tło: `#7c3aed`, tekst biały
- Padding: 11px 16px, border-radius: 8px
- Szerokość: 100% (full-width w formularzach)

**Drugorzędny (Outline)**
- Tło: transparent, border: 0.5px solid `#2d2d4e`
- Tekst: `text-secondary`
- Przykład: "Cofnij zmiany"

**Destrukcyjny (Danger)**
- Tło: transparent, border: 0.5px solid `#7f1d1d`
- Tekst: `#f87171`
- Przykład: "Wyzeruj ustawienia", "Usuń"

### Karty
- Tło: `#1a1a2e`
- Border: 0.5px solid `#2d2d4e`
- Border-radius: 12px
- Padding: 16–20px

### Inputy i Selecty
- Tło: `#0f0f23`
- Border: 0.5px solid `#2d2d4e`
- Border-radius: 8px
- Padding: 8–9px 10px
- Font-size: 13px
- Kolor tekstu: `#e8e6f0`

### Zakładki (Tabs)
- Kontener: tło `#1a1a2e`, border-radius: 10px, padding: 4px
- Aktywna: tło `#7c3aed`, tekst biały, font-weight 500
- Nieaktywna: tekst `text-secondary`

### Dolna nawigacja
- Tło: `#1a1a2e`, border-top: 0.5px solid `#2d2d4e`
- 3 elementy: Kalkulator / Zapisane / Profil
- Ikony: outline style
- Aktywna: kolor `#a78bfa`
- Nieaktywna: kolor `#9994b8`

### Kafelek netto (hero)
- Tło: `#2d1b69`, border: 0.5px solid `#7c3aed`
- Border-radius: 10px, padding: 16px
- Wyśrodkowany tekst
- Wartość: 32–36px, kolor `#a78bfa`

### Kafelki wyników (2x2 grid)
- Tło: `#1a1a2e`, border-radius: 8px, padding: 12px
- Etykieta: 11px, `text-secondary`
- Wartość: 16px, font-weight 500, kolor `status-warning`

---

## Ikony
- Aktualnie: symbole Unicode/emoji (⊞, ☰ itp.) — brak zewnętrznej biblioteki
- Rozmiar w nawigacji: 20–22px
- Rozmiar inline: 16px

---

## Spacing
- Padding stron: 24px
- Gap między kartami: 10–16px
- Gap między elementami formularza: 12–14px

---

## Zasady UX
- **Progressive disclosure** — dodatkowe opcje pojawiają się po wyborze (np. stawka ryczałtu po wyborze "Ryczałt")
- **Mobile-first** — max-width dla desktopa, pełna szerokość na mobile
- **Tryb:** tylko ciemny (dark mode)
- **Język:** polski
