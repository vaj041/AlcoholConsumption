# Vercel deploy handoff

Stav k 2026-09-22. Tento soubor je pracovni handoff pro dalsiho agenta nebo praci na jinem pocitaci.

## Co je hotove

- V koreni je `vercel.json` s Vercel Services:
  - `frontend`: root `frontend`, framework `vite`
  - `backend`: root `backend`, framework `express`
  - backend entrypoint `src/index.ts`
  - backend install command `npm ci --include=dev`, aby Vercel pouzil backendovy `package-lock.json` vcetne build nastroju
  - backend build: `npm run build:vercel`
  - `build:vercel` provede Prisma generate, PostgreSQL migrace, TypeScript build a kompilovany admin/drink seed
  - Heslovani pouziva `bcryptjs`, aby serverless runtime nepotreboval nativni bcrypt binding
  - `/api` rewrite na backend a ostatni cesty na frontend
- Frontend v produkci pouziva jako API adresu `/api`; lokalne stale pouziva `http://localhost:3001`.
- Backend obsluhuje obe varianty rout:
  - lokalni: `/health`, `/auth`, `/drinks`, `/entries`, `/stats`, `/translations`
  - Vercel: `/api/health`, `/api/auth`, `/api/drinks`, `/api/entries`, `/api/stats`, `/api/translations`
- Seed `backend/src/scripts/ensureAdmin.ts` je idempotentni:
  - vytvori nebo povysi admina `st.vajs@seznam.cz`
  - vychozi heslo je `xxxxxx`, lze ho prepsat pres `DEFAULT_ADMIN_PASSWORD`
  - vytvori drink `Pivo 10`, `500 ml`, `4.0 %`
  - pri dalsim spusteni nevytvari duplicity
- Do Prisma schematu nebyl pridan `username`; User ma pouze existujici pole `email`, `password`, `role` atd.

## Aktualni problem API

API na Vercelu stale neni overene jako funkcni.

Posledni dodany build log ukazuje, ze samotny build probehl:

- Vercel build bezi z vetve `main`, commit `cb1a017`.
- `prisma generate` probehl.
- `prisma migrate deploy` probehl: nebyly zadne pending migrace.
- Admin `st.vajs@seznam.cz` a drink `Pivo 10` uz v databazi existuji.
- TypeScript build probehl.
- Vercel vytvoril deployment s entrypointem `src/index.ts`.
- Pri pozadavku na `/api/health` vsak prohlizec zobrazil `500 FUNCTION_INVOCATION_FAILED`.

Pozdeji se stejna adresa `alcohol-consumption-4gxvttrnv-vaj041.vercel.app` zacala vracet jako `404 DEPLOYMENT_NOT_FOUND`, takze tato URL uz neni spolehlivy aktualni deployment.

### Co je aktualne v repozitari

- Aktualni vetev je `develop`.
- Posledni commit na `develop` je `b30de31` (`Replace bcrypt with bcryptjs for compatibility with serverless runtime`).
- `origin/develop` ukazuje na stejny commit.
- `backend/package.json` uz pouziva `bcryptjs`, ne native `bcrypt`.
- `backend/src/routes/auth.ts` a `backend/src/scripts/ensureAdmin.ts` uz importuji `bcryptjs`.
- Lokalni `npm run build` probehl.
- Lokalni production entrypoint se nacetl a `/api/health` vratil HTTP 200.
- Vercel ale musi dostat novy deployment z commitu `b30de31` nebo novejsiho.

### Nejpravdepodobnejsi vysvetleni

Build log patri vetvi `main`, zatimco oprava nativeho `bcrypt` je na `develop`. Pokud `main` neobsahuje commit `b30de31`, produkce stale pouziva starsi kod a oprava se do deploymentu vubec nedostala.

Nejdriv overit ve Vercelu **Source Commit** a **Branch** daneho deploymentu. Potom overit Vercel Function Logs pro aktualni deployment. Samotny build log neurcuje duvod runtime chyby.

### Dalsi postup na jinem PC

```powershell
git clone https://github.com/vaj041/AlcoholConsumption.git
Set-Location AlcoholConsumption
git fetch --all --prune
git branch -a
git log --oneline --decorate --all -10
```

Overit, ze `develop` obsahuje `b30de31`, nebo prenest opravu do `main`:

```powershell
git checkout develop
git pull origin develop
git checkout main
git pull origin main
git merge develop
git push origin main
```

Po novem deploymentu testovat vzdy aktualni URL z detailu deploymentu:

```text
GET  https://<aktualni-deployment>/api/health
POST https://<aktualni-deployment>/api/auth/login
```

Pokud aktualni deployment stale vrati 500, otevrit **Vercel > Deployment > Functions > Logs** a zkopirovat prvni runtime stack trace. Bez tohoto stack trace nelze rozlisit chybu bundlovani, chybejici environment variable nebo chybu Prisma runtime.

## Overeno lokalne

- `backend`: `npm run build` proslo.
- `frontend`: `npm run build` proslo.
- `vercel.json` je validni JSON.
- `http://localhost:3001/api/health` vraci `ok`.
- `POST http://localhost:3001/api/auth/login` s admin credentials vraci JWT a roli `admin`.
- Seed byl spusten dvakrat; druhy beh nevytvoril duplicity.

## Databaze

Prisma datasource je nyni PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Produkce pouziva jednu PostgreSQL initial migraci v `backend/prisma/migrations/`. Lokalni vyvoj ma oddelene SQLite schema a migraci v `backend/prisma/sqlite/`, aby slo aplikaci spustit bez lokalniho PostgreSQL serveru.

Pro produkci je potreba vytvorit PostgreSQL databazi, napr. Neon nebo Supabase, a nastavit jeji connection string jako `DATABASE_URL`.

## Co udelat pred deployem

### 1. Zvolit databazi

Vytvorit PostgreSQL databazi pres Neon, Supabase nebo jinou podporovanou sluzbu. Ziskat connection string pro produkci.

### 2. Overit PostgreSQL migraci

- Schéma i migration historie jsou uz pripravene pro PostgreSQL.
- Otestovat `npx prisma migrate deploy` proti prazdne PostgreSQL databazi.
- Otestovat `npm run ensure:admin` proti teto databazi.
- Pro lokalni vyvoj pouzit automaticky SQLite workflow popsany nize.

### 3. Nastavit Vercel Environment Variables

Pro Production nastavit:

```text
DATABASE_URL=postgresql://...
JWT_SECRET=<dlouhy nahodny secret>
DEFAULT_ADMIN_EMAIL=st.vajs@seznam.cz
DEFAULT_ADMIN_PASSWORD=xxxxxx
NODE_ENV=production
VITE_API_URL=/api
```

`xxxxxx` je pouze docasne heslo a po prvnim prihlaseni ho zmenit. `JWT_SECRET` nikdy nedavat do repozitare.

### 4. Import ve Vercelu

1. Importovat GitHub repozitar `vaj041/AlcoholConsumption`.
2. Jako Application Preset zvolit `Services`.
3. Kliknout na `Refresh`, aby Vercel nacetl aktualni `vercel.json`.
4. Overit frontend Vite service a backend Express service.
5. Nastavit Environment Variables.
6. Spustit deploy.

Backend `build:vercel` automaticky provede migrace a seed admina s drinkem. Bude fungovat po nastaveni platneho PostgreSQL `DATABASE_URL`.

### 5. Po deployi otestovat

```text
GET  https://<deployment>/api/health
POST https://<deployment>/api/auth/login
GET  https://<deployment>/api/drinks
```

V prohlizeci overit:

- prihlaseni admina
- drink `Pivo 10`
- vytvoreni a smazani vlastniho drinku
- vytvoreni zaznamu
- statistiky
- admin stranky

## Lokalne spusteni

Lokální vývoj používá SQLite, takže není potřeba instalovat PostgreSQL. `backend/.env` je připravený lokálními hodnotami a `npm run dev` automaticky:

- vygeneruje Prisma Client ze `prisma/sqlite/schema.prisma`,
- aplikuje lokální SQLite migraci,
- vytvoří admina a `Pivo 10`,
- spustí backend.

Backend:

```powershell
Set-Location backend
npm run dev
```

V druhem terminalu:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Frontend je potom na `http://localhost:5173`.

Produkční Prisma příkazy používají hlavní schema a PostgreSQL:

```powershell
Set-Location backend
$env:DATABASE_URL = 'postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public'
npm run prisma:generate
npx prisma migrate deploy
npm run ensure:admin
```

Lokální SQLite databáze je `backend/prisma/dev.db` a není určena pro deploy. Produkční PostgreSQL databáze se z ní automaticky nepřevádí.

## Co necommitovat

- `backend/.env`
- SQLite databaze `backend/prisma/*.db`
- JWT secret nebo produkcni database URL
- `node_modules` a build outputy

`.gitignore` tyto soubory uz ignoruje.

## Navazujici checklist

- [ ] Zvolit PostgreSQL provider a vytvorit prazdnou databazi.
- [x] Prepnout Prisma datasource a migration lock na PostgreSQL.
- [x] Pripravit PostgreSQL initial migration pro aktualni schema.
- [x] Pripravit oddeleny lokalni SQLite schema, migraci a automaticky setup.
- [x] Overit lokalni `npm run setup:local`, backend login a `/api/health`.
- [x] Overit backend a frontend production build.
- [ ] Otestovat prazdnou PostgreSQL DB: migrations + seed.
- [ ] Nastavit Vercel production environment variables.
- [ ] Importovat repo jako Vercel Services a obnovit konfiguraci.
- [ ] Provest preview deploy.
- [ ] Otestovat API a prihlaseni na preview URL.
- [ ] Zmenit docasne admin heslo.
- [ ] Provest production deploy.
