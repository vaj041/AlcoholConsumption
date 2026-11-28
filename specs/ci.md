# CI pro frontend a backend

Stav: návrh. Sledování: [issue #20](https://github.com/vaj041/AlcoholConsumption/issues/20).
Původní výukový postup: `devops-plan.md`.

## Současný stav a cíl

V aktuálním `main` není adresář `.github/workflows`. Při každém pull requestu
do `main` chceme automaticky zkontrolovat frontend a backend. Změny mají být
provedeny po malých krocích podle výukového plánu.

## Rozsah

- Vytvořit `.github/workflows/ci.yml` se spuštěním při pull requestu do `main`.
- Nezávislý frontend job: v `frontend/` spustit `npm ci`, `npm run lint` a
  `npm run build`.
- Nezávislý backend job: v `backend/` spustit `npm ci` a `npm run build`;
  pokud čistý build vyžaduje generování Prisma Clienta, provést je explicitně.
- Použít lockfiles. Nepřidávat secrets, nenasazovat a nespouštět migrace ani
  seed proti produkčním datům.
- Smoke test backendu zatím do CI nezařazovat; před budoucím zařazením ověřit,
  zda potřebuje běžící server nebo databázi.

## Akceptace

- [ ] Oba joby se spustí na PR a výsledek je viditelný v GitHubu.
- [ ] Chyba lintování nebo sestavení způsobí selhání příslušné kontroly.
- [ ] Workflow funguje v čistém prostředí bez produkčních secrets a nasazení.
