Vytvoř React layout komponentu s následující strukturou. Použij TailwindCSS + DaisyUI.

Struktura UI:
- Nahoře pevný header (výška cca 60px), barva bg-base-200.
  - Vlevo hamburger menu (ikonka).
  - Uprostřed nadpis aktuální stránky.
  - Vpravo jméno přihlášeného uživatele.

- Vlevo vertikální side menu, které se otevře po kliknutí na hamburger.
  - Položky: Dashboard, Drinks, Calendar, Stats, Settings, Logout.
  - Styl DaisyUI "menu" + "drawer".

- Pod headerem hlavní obsah.
  - Použij DaisyUI "drawer" pattern:
    https://daisyui.com/components/drawer/

Požadavky:
- Vytvoř samostatnou komponentu Layout.tsx.
- Komponenta má přijímat prop "children".
- Nepiš žádné vysvětlení, jen kompletní kód.


-----
Vytvoř komponentu Button.tsx s použitím DaisyUI.
Chci varianty:
- primary
- secondary
- outline
- danger

Komponenta má přijímat props:
- children
- variant ("primary" | "secondary" | "outline" | "danger")
- onClick

Použij Tailwind + DaisyUI classnames.
Nepiš žádné vysvětlení, jen kód.

-------
Vytvoř stránku DrinksPage.tsx s použitím Tailwind + DaisyUI.

Struktura:
- Nadpis "My Drinks"
- Tlačítko "Add Drink" (variant=primary)
- Tabulka drinků (name, volume, alcohol %, actions)
- Actions: Edit, Delete (ikonky DaisyUI)

Nepoužívej žádná falešná data, jen props:
- drinks: Drink[]
- onAdd, onEdit, onDelete

Nepiš žádné vysvětlení, jen kód.


