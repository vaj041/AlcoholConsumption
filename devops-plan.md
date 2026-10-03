# DevOps cvičení: CI pro projekt

Cílem je společně připravit automatickou kontrolu, která při každém pull requestu do `main` ověří, že se frontend i backend sestaví. Změny budeme dělat po malých krocích; ty budeš psát konfiguraci a spouštět příkazy, já ti budu vysvětlovat jednotlivé části a pomáhat s chybami.

## Postup

1. Přepni se na pracovní větev `copilot/devops-experimentation`:

   ```bash
   git switch copilot/devops-experimentation
   git pull
   ```

2. Prohlédni si dostupné příkazy:
   - ve `frontend/package.json`: `npm run lint` a `npm run build`
   - v `backend/package.json`: `npm run build`
   - smoke test backendu `npm run test:smoke` zatím do CI nezařazujeme; nejprve zjistíme, zda potřebuje běžící server nebo databázi.

3. Vytvoř `.github/workflows/ci.yml` a nastav spuštění při pull requestu do `main`.

4. Přidej dva nezávislé joby:
   - **Frontend:** instalace závislostí pomocí `npm ci`, lint a build.
   - **Backend:** instalace závislostí pomocí `npm ci` a build.

5. Zkontroluj workflow, commitni změnu a odešli větev na GitHub.

6. Otevři pull request do `main`, projdi výsledek CI a případné chyby společně opravíme.

## Co si při tom procvičíš

- co je GitHub Actions workflow, event, job a krok;
- proč mají frontend a backend oddělené joby;
- rozdíl mezi instalací závislostí, lintem a buildem;
- jak číst výsledek CI a opravit selhání.

Zatím nic nenasazujeme a nepřidáváme secrets. Dalším krokem po úspěšném CI může být automatizovaný test API nebo preview deploy.
