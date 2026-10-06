# Vercel deploy handoff

Stav k 2026-09-23. Tento soubor je pracovni handoff pro dalsiho agenta nebo praci na jinem pocitaci.

## Finalni stav

Produkce funguje pres dva samostatne Vercel projekty:

- Frontend je nasazeny jako Vercel Services/Vite projekt.
- Backend je nasazeny samostatne jako `alcohol-consumption-api` s Root Directory `backend`.
- Funkcni API endpoint:

```text
GET https://alcohol-consumption-api.vercel.app/api/health
200 {"status":"ok","message":"Alcohol Tracker API is running"}
```

- Frontend musi mit ve Vercelu nastavene `VITE_API_URL` na `https://alcohol-consumption-api.vercel.app/api`.
- Po zmene `VITE_API_URL` je nutny novy frontend deployment, protoze Vite hodnotu vlozi pri buildu.
- Puvodni Services backend mel runtime chybu `Cannot find module 'express'`; tento pokus se uz nepouziva pro funkcni API.

### Adresa pro sdileni aplikace

URL `https://alcohol-consumption-git-main-vaj041.vercel.app` je branch/deployment URL a aktualne presmerovava navstevniky na Vercel SSO. Tuto adresu neposilat uzivatelum bez Vercel uctu.

Pro verejne ukazani aplikace pouzit production domain z Vercelu:

1. V projektu otevrit **Deployments** a uspesny frontend deployment povysit na **Production**, nebo nasadit production branch.
2. V **Settings -> Deployment Protection** nastavit **Standard Protection** nebo ochranu vypnout. Nepouzit **All Deployments**, pokud ma byt produkce verejna.
3. V **Settings -> Domains** nebo na strance projektu zkopirovat production adresu. Sdili se production domain, napr. `<project-name>.vercel.app`, ne URL ve tvaru `...-git-main-...`.

Frontend musi byt zbuildovany s touto hodnotou:

```text
VITE_API_URL=https://alcohol-consumption-api.vercel.app/api
```

API URL `https://alcohol-consumption-api.vercel.app/api/health` slouzi jen pro overeni backendu; uzivatelum se posila frontendova production adresa.

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
- Frontend v produkci pouziva jako API adresu `https://alcohol-consumption-api.vercel.app/api`; lokalne stale pouziva `http://localhost:3001`.
- Backend obsluhuje obe varianty rout:
  - lokalni: `/health`, `/auth`, `/drinks`, `/entries`, `/stats`, `/translations`
  - Vercel: `/api/health`, `/api/auth`, `/api/drinks`, `/api/entries`, `/api/stats`, `/api/translations`
- Seed `backend/src/scripts/ensureAdmin.ts` je idempotentni:
  - vytvori nebo povysi admina `st.vajs@seznam.cz`
  - vychozi heslo je `xxxxxx`, lze ho prepsat pres `DEFAULT_ADMIN_PASSWORD`
  - vytvori drink `Pivo 10`, `500 ml`, `4.0 %`
  - pri dalsim spusteni nevytvari duplicity
- Do Prisma schematu nebyl pridan `username`; User ma pouze existujici pole `email`, `password`, `role` atd.

## Historie problemu API

Puvodni API ve Vercel Services nebylo funkcni.

Posledni dodany build log ukazuje, ze samotny build probehl:

- Starsi dodany build log bez problemu s `express` bezel z vetve `main`, commit `cb1a017`.
- Aktualni screenshot potvrzuje samostatny Preview deployment z vetve `develop`, commit `2fcf383`, se stavem `Ready`.
- `prisma generate` probehl.
- `prisma migrate deploy` probehl: nebyly zadne pending migrace.
- Admin `st.vajs@seznam.cz` a drink `Pivo 10` uz v databazi existuji.
- TypeScript build probehl.
- Vercel vytvoril deployment s entrypointem `src/index.ts`.
- Pri pozadavku na `/api/health` vsak prohlizec zobrazil `500 FUNCTION_INVOCATION_FAILED`.

Pozdeji se stejna adresa `alcohol-consumption-4gxvttrnv-vaj041.vercel.app` zacala vracet jako `404 DEPLOYMENT_NOT_FOUND`, takze tato URL uz neni spolehlivy aktualni deployment.

Stav `Ready` potvrzuje dokoncení buildu, ale sam o sobe nepotvrzuje, ze se backendova Function uspesne spusti. Pri otevreni `/api/health` aktualniho deploymentu se stale objevuje `Cannot find module 'express'` z `/var/task/index.js`.

### Co je aktualne v repozitari

- Aktualni vetev je `develop`.
- Posledni commit na `develop` je `2fcf383` (`Change backend entrypoint to src/index.ts`).
- Oprava obsahuje take predchozi commit `b30de31` (`Replace bcrypt with bcryptjs for compatibility with serverless runtime`).
- `origin/develop` ukazuje na stejny commit.
- `backend/package.json` uz pouziva `bcryptjs`, ne native `bcrypt`.
- `backend/src/routes/auth.ts` a `backend/src/scripts/ensureAdmin.ts` uz importuji `bcryptjs`.
- Lokalni `npm run build` probehl.
- Lokalni production entrypoint se nacetl a `/api/health` vratil HTTP 200.
- Vercel ale musi dostat novy deployment z commitu `2fcf383` nebo novejsiho.

### Co uz neni pravdepodobne

Pro aktualni deployment `2fcf383` uz neni dostatecne vysvetleni, ze Vercel deployuje starou vetev. Screenshot potvrzuje, ze Vercel skutecne sestavil `develop`.

### Co je potreba zjistit

Otevrit deployment `2fcf383` -> **Functions** -> **Logs** a zkopirovat prvni runtime stack trace po pozadavku na `/api/health`. Build log pouze potvrzuje instalaci a kompilaci; runtime log ukaze, zda Vercel funkci bali bez service `node_modules`, nebo zda dashboard pouziva jiny root/runtime override.

V konfiguraci repozitare jsou aktualne nastavene `root: backend`, `entrypoint: src/index.ts`, `installCommand: npm ci --include=dev` a `buildCommand: npm run build:vercel`.

### Potvrzeny vysledek samostatneho backend projektu

Samostatny Vercel projekt `alcohol-consumption-api` s Root Directory `backend` funguje:

```text
GET https://alcohol-consumption-api.vercel.app/api/health
200 {"status":"ok","message":"Alcohol Tracker API is running"}
```

Tento test potvrzuje, ze backendovy `package.json`, `package-lock.json`, Express entrypoint i dependencies jsou v poradku. Chyba `Cannot find module 'express'` byla specificka pro puvodni Vercel Services deployment a jeho runtime packaging.

Pro pripojeni frontendu k funkcni API je potreba ve Vercelu nastavit pro frontend service `VITE_API_URL` na:

```text
https://alcohol-consumption-api.vercel.app/api
```

Potom znovu nasadit frontend. Varianta s `VITE_API_URL=/api` by vyzadovala dalsi opravu puvodniho Services backendu a aktualne se nepouziva.

### Dalsi postup na jinem PC

```powershell
git clone https://github.com/vaj041/AlcoholConsumption.git
Set-Location AlcoholConsumption
git fetch --all --prune
git branch -a
git log --oneline --decorate --all -10
```

Overit, ze `develop` obsahuje `2fcf383`, nebo prenest opravy do `main`:

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
VITE_API_URL=https://alcohol-consumption-api.vercel.app/api
```

`xxxxxx` je pouze docasne heslo a po prvnim prihlaseni ho zmenit. `JWT_SECRET` nikdy nedavat do repozitare.

### 4. Vercel deployment

1. Importovat GitHub repozitar `vaj041/AlcoholConsumption`.
2. Frontend nasadit jako Vite/Services projekt z korene repozitare.
3. Backend nasadit jako samostatny Vercel projekt `alcohol-consumption-api` s Root Directory `backend`.
4. Backend nastavit na vetev `develop` nebo aktualni produkcni vetev.
5. Do backendu vlozit `DATABASE_URL`, `JWT_SECRET`, `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD` a `NODE_ENV=production`.
6. Do frontendu vlozit `VITE_API_URL=https://alcohol-consumption-api.vercel.app/api`.
7. Po zmene `VITE_API_URL` znovu nasadit frontend.

Backend `build:vercel` automaticky provede migrace a seed admina s drinkem. Bude fungovat po nastaveni platneho PostgreSQL `DATABASE_URL`.

### 5. Po deployi otestovat

```text
GET  https://alcohol-consumption-api.vercel.app/api/health
POST https://alcohol-consumption-api.vercel.app/api/auth/login
GET  https://alcohol-consumption-api.vercel.app/api/drinks
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

## Stav checklistu

- [x] Zvolit PostgreSQL provider a vytvorit prazdnou databazi.
- [x] Prepnout Prisma datasource a migration lock na PostgreSQL.
- [x] Pripravit PostgreSQL initial migration pro aktualni schema.
- [x] Pripravit oddeleny lokalni SQLite schema, migraci a automaticky setup.
- [x] Overit lokalni `npm run setup:local`, backend login a `/api/health`.
- [x] Overit backend a frontend production build.
- [x] Otestovat PostgreSQL DB: migrations + seed probehly ve Vercel buildu.
- [x] Nastavit Vercel environment variables.
- [x] Nasadit samostatny backend projekt `alcohol-consumption-api`.
- [x] Otestovat backend `/api/health` na HTTP 200.
- [x] Pripojit frontend pres `VITE_API_URL` a znovu ho nasadit.
- [ ] Zmenit docasne admin heslo.
- [x] Provest funkcni production/preview deployment backendu a frontendu.
