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

Stary samostatny projekt `alcohol-consumption-api` ma Git propojeni odpojene
a jeho dosavadni API slouzi jako zaloha. Aktualni sjednocena aplikace pouziva
API v projektu `alcohol-consumption`.

## Obnova hesla pres Mailjet

Zmena hesla v nastaveni funguje bez Mailjetu. Pro obnovu zapomenuteho hesla
je potreba dokoncit tyto kroky:

1. V Mailjetu vyberte spravny ucet nebo subucet a v
   [Sender addresses](https://app.mailjet.com/account/sender) pridejte
   odesilaci adresu. Potvrdte odkaz v dorucenem e-mailu a overte, ze je adresa
   ve stavu **Active**. Pro kazdy subucet je nutne adresu overit zvlast.
2. Pokud Mailjet hlasi pozastavene odesilani, otevrite u nej support ticket
   a vyckejte na jeho odblokovani. Overeni samotne adresy pozastaveni neresi.
3. Ve Vercelu v projektu `alcohol-consumption` otevrite **Settings >
   Environment Variables** a nastavte nasledujici promenne pro odpovidajici
   prostredi:

   | Promenna | Hodnota |
   | --- | --- |
   | `MAILJET_API_KEY` | API Key z vybraneho Mailjet uctu nebo subuctu. |
   | `MAILJET_SECRET_KEY` | Secret Key ke stejnemu API Key. |
   | `MAILJET_FROM_EMAIL` | Odesilaci adresa overena v tomto uctu nebo subuctu. |
   | `APP_BASE_URL` | HTTPS adresa aplikace bez cesty, query nebo fragmentu. |
   | `MAILJET_FROM_NAME` | Volitelne zobrazovane jmeno odesilatele; vychozi je `Alcohol Tracker`. |

   Pro Production pouzijte `APP_BASE_URL=https://alcohol-consumption.vercel.app`.
   Pro Preview vetve `develop` lze pouzit
   `APP_BASE_URL=https://alcohol-consumption-git-develop-vaj041.vercel.app`.
   Preview promenne je vhodne omezit na prislusnou vetev; odkazy do Preview
   mohou vyzadovat prihlaseni do Vercelu. Jina Preview vetev potrebuje adresu,
   ktera povede na jeji deployment.
4. Po zmene promennych vytvorte novy deployment v kazdem zmenenem prostredi.
   Pak vyzkousejte odeslani a pouziti odkazu na testovacim uctu. Preview muze
   sdilet produkcni databazi, proto pred testem overte jeho databazove pripojeni.

Klice a pripojovaci retezce vkladejte pouze do spravy promennych, nikdy do
repozitare ani do chatu. Bez konfigurace Mailjetu formular obnovy hlasi
nedostupnost; pri chybe odeslani muze zobrazit obecne potvrzeni, i kdyz e-mail
nedorazi. Podrobnosti o chybe najdete v logu backendu na Vercelu.

Bezplatna e-mailova domena muze mit problemy s dorucovanim. Pro spolehlivejsi
provoz Mailjet doporucuje vlastni odesilaci domenu s nastavenym SPF a DKIM.
Omezeni poctu pokusu o prihlaseni a obnovu hesla je ulozene pouze v pameti
jednotlive instance serveru. Ve Vercel serverless prostredi proto neni sdilene
mezi instancemi; pro spolehlive globalni omezeni je potreba sdilene uloziste
nebo ochrana na urovni platformy.

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

Migrace pro zmenu a obnovu hesla musi byt provedena pred nasazenim noveho
backendu, jinak prihlasene API pozadavky nebudou fungovat. Pokud Preview a
Production sdileji databazi, migrace pro Preview zmeni i produkcni databazi;
nejprve overte cil a zalohu. Stavajici prihlasovaci tokeny zustanou platne,
dokud jejich uzivatel nezmeni heslo nebo jim nevyprsi platnost.

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
