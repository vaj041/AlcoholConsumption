# Vercel deployment

## Jeden projekt pro frontend i API

Konfigurace v koreni repozitare nasazuje Vite frontend a Express API do
jednoho Vercel projektu `alcohol-consumption`. Frontend i API sdileji domenu:

- `/api/*` smeruje do funkce `api/index.ts`, ktera pouziva existujici Express aplikaci.
- Ostatni cesty obsluhuje frontend; nezname cesty se vraci na `index.html` pro React Router.
- Vercel build pouziva stavajici lockfiles v `backend/` a `frontend/`.
- Frontend sestaveny na Vercelu vzdy vola API na stejne domene pod `/api`,
  i kdyz ma projekt nastavenou starsi hodnotu `VITE_API_URL`.
- Lokalni vyvoj stale pouziva samostatne servery; `VITE_API_URL` lze mimo Vercel
  pouzit pro zmenu adresy API.

Vercel projekt ma mit Root Directory nastavene na koren repozitare.
`vercel.json` prepisuje framework preset i prikazy buildu. Pro backend jsou
potreba promenne `DATABASE_URL` a `JWT_SECRET` v odpovidajicim prostredi
(Preview nebo Production). Jejich hodnoty nepatri do repozitare.

**Stavajici produkce se timto automaticky nemeni.** Aktualni produkcni
deployment muze jeste pouzivat samostatny projekt `alcohol-consumption-api`.
Ten nevypinejte, dokud nebude sjednoceny produkcni deployment overen.

## Bezpecnost databaze

Build generuje Prisma Client, ale **nespousti migrace ani seed**. Preview muze
pouzivat stejnou databazi jako produkce, pokud jsou tak nastavene Vercel
environment variables; vytvareni, upravy a mazani v preview by pak menily
produkcni data. Pro izolovane testovani nastavte samostatnou Preview databazi.

Schema se pri zmene spravuje explicitne pred nasazenim, s overenim databazove
URL a zalohou:

```powershell
Set-Location backend
npx prisma migrate deploy
```

Seed admina a vychoziho drinku `npm run ensure:admin` je samostatny prikaz,
ktery zapisuje do databaze; nespoustejte ho automaticky nad existujici produkci.

## Preview a produkce

Pro rucni preview z aktualniho pracovniho stromu:

```powershell
vercel deploy --scope vaj041 --project alcohol-consumption --yes
```

Preview muze vyzadovat prihlaseni do Vercelu kvuli Deployment Protection.
Rucni CLI deployment nenahrazuje commit a push: pro automaticke Git deploymenty
musi byt zmeny ulozene v prislusne vetvi vzdaleneho repozitare.

Pred prechodem na produkci overte preview na `/login` i po obnoveni stranky,
`/api/health`, prihlaseni a nacitani uzivatelskych dat. Produkcni nasazeni
provadejte az po schvaleni, typicky po zacleneni zmen do produkcni vetve.
Domenu `https://alcohol-consumption.vercel.app` zachovava projekt
`alcohol-consumption`.

## Lokalni vyvoj

Backend pouziva pro lokalni vyvoj SQLite; setup take spousti lokalni migrace a
seed:

```powershell
Set-Location backend
npm ci
npm run dev
```

V dalsim terminalu:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Frontend je na `http://localhost:5173`, backend na `http://localhost:3001`.
Lokalni SQLite databaze se automaticky neprenasi do produkcni PostgreSQL databaze.
