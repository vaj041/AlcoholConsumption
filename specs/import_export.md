# Export a import dat

## Cíl a rozsah

Uživatel může exportovat své nápoje a záznamy o konzumaci do souboru otevřitelného v Excelu a později je importovat zpět, včetně importu do jiného účtu nebo nové instalace. Opakovaný import stejného souboru nesmí vytvářet duplicity.

Tento dokument je návrh; funkce zatím není implementovaná. Import existující data nepřepisuje ani nemaže. Export neobsahuje účet, heslo, tokeny, role, auditní záznamy ani překlady. Nastavení vzhledu, jazyka a výchozího nápoje se nyní ukládá v prohlížeči a do první verze nepatří. Statistiky a čistý alkohol se znovu vypočítají z importovaných dat.

## Formát

- **XML Spreadsheet 2003 (SpreadsheetML)**, přípona `.xml`, kódování UTF-8. Jde o skutečný tabulkový XML formát s více listy, který Excel podporuje; nestačí vytvořit libovolné XML.
- Excel umí také `.xlsx`, ale to je jiný, balený XML formát. První verze podporuje import pouze SpreadsheetML `.xml`, nikoli `.xlsx`, CSV ani libovolné XML. Uživatel, který soubor upraví v Excelu, jej musí uložit opět jako **XML Spreadsheet 2003**; Excel může upozornit na omezení formátu.
- Verze formátu je `1`. Názvy listů a hlaviček jsou strojové a při změně jazyka aplikace se nemění. Aplikace zobrazuje návod, že listy, hlavičky a identifikátory je nutné zachovat. Vytvoření nových řádků nebo ruční změna identifikátorů není v první verzi podporována.
- Při otevření a opětovném uložení v podporovaném desktopovém Excelu musí import fungovat; kompatibilita s jinými editory a verzemi Excelu není bez samostatného ověření zaručena.

[Podporované formáty Excelu (Microsoft)](https://support.microsoft.com/en-us/excel/file-formats-that-are-supported-in-excel)

## Obsah souboru

Soubor obsahuje přesně tři listy s následujícími názvy. Import rozpoznává sloupce podle hlaviček, nikoli podle pozice; pořadí datových řádků není významné.

| List | Sloupce v pořadí exportu | Význam |
| --- | --- | --- |
| `Metadata` | `key`, `value` | Povinné řádky `format = alcohol-consumption-tracker` a `version = 1`; volitelně `exportedAt` v UTC. |
| `Drinks` | `exportId`, `name`, `volumeMl`, `alcoholPct`, `createdAt` | Všechny nápoje vlastníka, i bez záznamů. |
| `Entries` | `exportId`, `drinkExportId`, `date`, `quantity`, `createdAt` | Všechny záznamy vlastníka; `drinkExportId` odkazuje na `Drinks.exportId`. |

- `exportId` a `drinkExportId`: stabilní UUID zapsané jako text, nikoli databázová číselná ID.
- `name`: text; zachovat Unicode, mezery a speciální znaky prostřednictvím správného XML escapingu.
- `volumeMl`: kladné celé číslo; `alcoholPct`: konečné číslo v rozsahu 0–100; `quantity`: kladné celé číslo. Export použije v SpreadsheetML buňky typu `Number`; import hodnoty striktně validuje bez tichého zaokrouhlování nebo `parseInt` nad neplatným vstupem.
- `date` a `createdAt`: UTC okamžik v textovém ISO 8601 formátu s milisekundami a `Z`, např. `2026-01-02T12:30:00.000Z`. Text zamezuje změně časového pásma a automatickému převodu Excelu. `date` se nevypočítává z lokálního dne a `createdAt` se při importu zachová.
- V1 nepoužívá XML vzorce ani makra. Export zapisuje názvy jako textové buňky, nikoli vzorce, i když začínají `=`, `+`, `-` nebo `@`; import vzorce a buňky s chybou odmítne. Ochrana nesmí změnit obsah názvu.
- Neznámá verze, chybějící či duplicitní list/hlavička, neznámý list, duplicitní metadata nebo chybějící povinná hodnota znamenají chybu importu. Prázdné datové listy s hlavičkami jsou přípustné. V1 odmítá i neznámé sloupce, aby neignorovala potenciálně důležitá data.

Příklad struktury (identifikátory a data jsou pouze ukázkové):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Metadata"><Table>
    <Row><Cell><Data ss:Type="String">key</Data></Cell><Cell><Data ss:Type="String">value</Data></Cell></Row>
    <Row><Cell><Data ss:Type="String">format</Data></Cell><Cell><Data ss:Type="String">alcohol-consumption-tracker</Data></Cell></Row>
    <Row><Cell><Data ss:Type="String">version</Data></Cell><Cell><Data ss:Type="String">1</Data></Cell></Row>
  </Table></Worksheet>
  <Worksheet ss:Name="Drinks"><Table>
    <Row><Cell><Data ss:Type="String">exportId</Data></Cell><Cell><Data ss:Type="String">name</Data></Cell><Cell><Data ss:Type="String">volumeMl</Data></Cell><Cell><Data ss:Type="String">alcoholPct</Data></Cell><Cell><Data ss:Type="String">createdAt</Data></Cell></Row>
    <Row><Cell><Data ss:Type="String">123e4567-e89b-42d3-a456-426614174000</Data></Cell><Cell><Data ss:Type="String">Drink</Data></Cell><Cell><Data ss:Type="Number">500</Data></Cell><Cell><Data ss:Type="Number">5</Data></Cell><Cell><Data ss:Type="String">2026-01-02T12:00:00.000Z</Data></Cell></Row>
  </Table></Worksheet>
  <Worksheet ss:Name="Entries"><Table>
    <Row><Cell><Data ss:Type="String">exportId</Data></Cell><Cell><Data ss:Type="String">drinkExportId</Data></Cell><Cell><Data ss:Type="String">date</Data></Cell><Cell><Data ss:Type="String">quantity</Data></Cell><Cell><Data ss:Type="String">createdAt</Data></Cell></Row>
    <Row><Cell><Data ss:Type="String">223e4567-e89b-42d3-a456-426614174000</Data></Cell><Cell><Data ss:Type="String">123e4567-e89b-42d3-a456-426614174000</Data></Cell><Cell><Data ss:Type="String">2026-01-02T12:30:00.000Z</Data></Cell><Cell><Data ss:Type="Number">1</Data></Cell><Cell><Data ss:Type="String">2026-01-02T12:31:00.000Z</Data></Cell></Row>
  </Table></Worksheet>
</Workbook>
```

Parser musí podporovat běžné SpreadsheetML vytvářené Excelem, včetně vynechaných buněk a `ss:Index`, escapingu a deklarovaných namespace; nesmí předpokládat, že Excel zachová stejné formátování XML. Chybějící povinnou buňku vyhodnotí jako chybu.

## Identita a opakovaný import

Současné modely `Drink` a `Entry` mají pouze celočíselná ID lokální databáze; ta nejsou bezpečná pro přenos mezi instalacemi. Shoda podle názvu, data nebo obsahu také není spolehlivá: dva odlišné záznamy mohou mít stejné hodnoty.

1. Přidat oběma modelům trvalé neprázdné `exportId` typu UUID. Nový záznam jej dostane při vytvoření; migrace vygeneruje jedinečné hodnoty i pro všechny existující řádky. Identifikátor se nemění při úpravě ani exportu.
2. Databáze vynucuje unikátnost `(userId, exportId)` zvlášť pro nápoje a záznamy. Implementovat a otestovat migrace pro PostgreSQL i lokální SQLite schéma. Export před migrací není podporován.
3. Import zachová UUID ze souboru a vždy přiřadí cílové záznamy přihlášenému uživateli. Stejné UUID v jiném účtu nesmí nic ovlivnit ani prozradit informace o jeho datech.
4. Pro každý nápoj a pak pro každý záznam: existující `(userId, exportId)` se **přeskočí bez změny**, neexistující se vytvoří. Záznam odkazuje na cílový nápoj se stejným `drinkExportId`, který existuje nebo byl vytvořen během importu.
5. Soubor musí obsahovat právě jeden řádek nápoje pro každý odkazovaný `drinkExportId`. Duplicita `exportId` ve stejném listu, chybějící odkaz nebo neplatné UUID znamená chybu celého importu. Shodné hodnoty u různých UUID zůstávají samostatnými záznamy.
6. Existující řádek se stejným UUID, ale jinými hodnotami, se také přeskočí. Náhled upozorní na počet takových konfliktů; existující nápoj zůstává cílem nově importovaných záznamů. Změny v Excelu u již importovaných řádků se tedy nepromítnou. Pro záměrné úpravy slouží aplikace.
7. Současné souběžné importy musí být bezpečné díky databázovým unikátním omezením a transakci; při kolizi provést opětovné vyhodnocení podle pravidla přeskočení nebo bezpečně celý import odmítnout s možností opakování. Částečný import není přípustný.

Opakovaný import již importovaného souboru tedy nevytvoří žádné další řádky, i po přenosu do jiného účtu nebo po opětovném exportu z cílové instalace. Pokud uživatel záznam následně smaže, další import jej může znovu vytvořit; import nepřenáší historii mazání. Smazání nápoje dnes kaskádově smaže jeho záznamy.

## Uživatelský postup

1. V nastavení nabídnout **Export dat** a **Import dat**; všechny texty přidat do `tr` a překladů `cs` i `en`.
2. Export stáhne úplný snapshot dat přihlášeného uživatele jako například `alcohol-consumption-2026-01-02.xml`. Nápoje a záznamy musí pocházet z konzistentního databázového snapshotu; žádné jiné účty se neexportují.
3. Import umožní vybrat soubor `.xml`, provede validaci a zobrazí náhled: počty nových a přeskočených nápojů a záznamů, počet konfliktů a čitelné chyby s listem a číslem řádku. Při chybě se nic nezapíše.
4. Po potvrzení aplikace znovu ověří tentýž obsah souboru a aktuální stav databáze; použije transakci pro celý import. Pokud se situace proti náhledu změnila, uživatel dostane nový náhled a možnost znovu potvrdit. Výsledek uvede počty vytvořených a přeskočených položek.
5. Po dokončení obnovit data v klientovi, aby byly nové nápoje a záznamy ihned viditelné. Upozornit, že soubor obsahuje citlivé osobní údaje a je třeba jej bezpečně uložit.

## API a bezpečnost

- Nový autentizovaný backendový resource, například `GET /data-export` pro stažení, `POST /data-import/preview` pro náhled a `POST /data-import` pro potvrzení. Import používá přiložený soubor; náhled vrátí krátkodobý serverem podepsaný token svázaný s uživatelem, hashem skutečného obsahu a výsledkem náhledu. Potvrzení ověří podpis, expiraci a znovu vypočtený hash i aktuální rozdíly. Nepovažovat klientem dodaný hash za důkaz obsahu.
- Pro export použít `Content-Type: application/xml; charset=utf-8`, `Content-Disposition: attachment` a `Cache-Control: no-store`. Export/import vyžaduje JWT a vždy filtruje podle `req.userId`.
- Validovat strukturu XML, typy a hodnoty pomocí Zod; nepřebírat ze souboru `userId`, číselná ID, role ani cizí vlastnictví. Chyby vracet ve stávajícím tvaru `{ error: string }`, případně s bezpečnými detaily řádků.
- Zakázat DTD, externí entity a externí přístupy; chránit parser před XML entity expansion a příliš hlubokým či rozsáhlým dokumentem. Odmítnout vzorce, nepodporované typy buněk a neplatné XML. Nikdy neprovádět obsah souboru.
- Nastavit a v UI uvést limit souboru **4 MB** a maximálně **10 000 datových řádků celkem**, hlídat limit už při uploadu i parsování. Ověřit limit nasazení na Vercelu včetně režie požadavku; při překročení vrátit srozumitelnou chybu bez částečného zápisu. Export překračující tyto limity nesmí být prezentován jako zpětně importovatelná záloha: oznámit překročení a nenabídnout neúplný soubor.
- Nelogovat obsah souboru, názvy nápojů ani osobní data; chybové a auditní zprávy obsahují pouze bezpečné počty a stav. Žádné trvalé ukládání nahraných souborů.

## Akceptační scénáře

- Export otevřít v podporovaném desktopovém Excelu a uložit jako XML Spreadsheet 2003; import do prázdného účtu zachová všechna pole, české znaky, časové údaje a vazby.
- Import stejného souboru dvakrát i současně nevytvoří duplicity; dva různé záznamy se stejnými hodnotami se zachovají. Export z cílového účtu lze znovu importovat bez duplicit.
- Změněný již existující řádek se nepřepíše, konflikt je viditelný; nový záznam navázaný na existující nápoj použije jeho aktuální podobu.
- Neplatný soubor, duplicitní UUID v listu, chybějící vazba, vzorec, chybná hodnota, neznámá verze či překročení limitu nevytvoří žádné řádky. Otestovat i rollback při databázové chybě.
- Ověřit izolaci dvou účtů, souběžný import, prázdná data, mazání a následné obnovení, escapované znaky a text začínající znakem vzorce.
- Otestovat migrace a round-trip na PostgreSQL i SQLite a snapshot při souběžné změně dat. Ověřit export/import přes skutečné nasazení včetně upload limitu a alespoň jednu podporovanou verzi desktopového Excelu; doložit použitou verzi.
