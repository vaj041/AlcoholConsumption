# Translations Plan (i18n with term codes)

## 1) Goal

Build a translation system where:
- default UI text is English,
- every text is referenced by a stable term code,
- translations can be loaded from database,
- app keeps working even if translation source is unavailable.

---

## 2) Target architecture

### Frontend
- Use a small translation service wrapper inspired by:
  - `i18n.tr(termCode, defaultText)`
- Keep centralized term dictionary in code (EN defaults).
- Replace hardcoded strings with term getters, e.g.:
  - `label={tr.Settings.DefaultDrink()}`
- Language selection persisted in local storage.
- Fallback chain:
  1. active language value from DB/API,
  2. English default in code,
  3. provided fallback text in `tr(...)`.

### Backend
- Add translation endpoints:
  - `GET /translations?lang=en`
  - `GET /translations?lang=cs`
- Return dictionary keyed by term code.
- Optional secured admin endpoints later for editing terms.

### Database
- Store term metadata and per-language values.

Suggested schema:
- `TranslationTerm`
  - `id`
  - `code` (unique)
  - `description` (optional)
  - `createdAt`
  - `updatedAt`
- `TranslationValue`
  - `id`
  - `termId` (FK)
  - `lang` (e.g. `en`, `cs`)
  - `text`
  - `createdAt`
  - `updatedAt`
  - unique (`termId`, `lang`)

---

## 3) Term code convention

Use dot notation:
- `common.button.save`
- `common.button.cancel`
- `layout.menu.dashboard`
- `settings.defaultDrink.label`
- `stats.dailyAverage.title`

Rules:
- stable key (never rename lightly),
- lowercase with dots,
- scoped by feature/page.

---

## 4) Frontend file structure proposal

- `frontend/src/i18n/i18nService.ts`
  - runtime dictionary, language state, `tr(code, fallback, params?)`
- `frontend/src/i18n/tr.ts`
  - typed term getter object (like your existing pattern)
- `frontend/src/i18n/locales/en.ts`
  - EN default values for all term codes
- `frontend/src/i18n/types.ts`
  - language type and translation map types

Optional later:
- `frontend/src/i18n/locales/cs.ts` as bootstrap/fallback for Czech.

---

## 5) Backend implementation plan

1. Prisma migration for translation tables.
2. Seed initial EN term values from frontend default dictionary.
3. Create route `GET /translations` with query `lang`.
4. Cache response in memory per language (short TTL, e.g. 5 min).
5. Add optional authenticated admin routes later:
   - `POST /translations/upsert`
   - `PUT /translations/:code/:lang`

---

## 6) Rollout strategy

### Phase A (MVP)
- Implement i18n service and EN defaults only.
- Convert core pages:
  - Layout, Login, Register, Dashboard, Settings, Statistics, Calendar.
- Keep app language fixed to EN first.

### Phase B
- Add language switch (EN/CS) in Settings.
- Load translations from backend on app startup and language change.

### Phase C
- Add translation management flow (admin script or simple admin page).
- Add CI check for missing term codes.

---

## 7) Migration checklist (hardcoded text -> terms)

For each page:
1. Create term codes.
2. Add EN default text.
3. Replace JSX strings with `tr.*()` calls.
4. Verify formatting and interpolation (counts, drink names, etc.).

Special care:
- tooltips,
- alert messages,
- button text,
- placeholders and labels,
- empty states and errors.

---

## 8) Interpolation and formatting

Support params in translation calls:
- Example:
  - code: `stats.defaultDrink.equivalent`
  - template: `≈ {{count}} {{drinkName}}`
- call: `tr("stats.defaultDrink.equivalent", "≈ {{count}} {{drinkName}}", { count, drinkName })`

Date/number formatting:
- Use `Intl.DateTimeFormat` and `Intl.NumberFormat` by selected language.

---

## 9) Risks and mitigations

- Missing translation keys:
  - show EN fallback and log warning in dev.
- Backend unavailable:
  - keep local EN dictionary active.
- Key drift during refactors:
  - add lint/script to detect unknown or unused keys.

---

## 10) Definition of done

- All visible UI text uses term codes.
- EN is complete and default.
- Language can be switched in Settings.
- DB translations load and override EN defaults.
- App remains functional without translation API.
