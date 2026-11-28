# Uživatelské nastavení v databázi

Stav: návrh. Sledování: [issue #23](https://github.com/vaj041/AlcoholConsumption/issues/23).

## Současný stav a cíl

Vzhled, jazyk a výchozí nápoj se nyní automaticky ukládají do `localStorage`
prohlížeče přes Zustand, nikoli do session ani do databáze. Nastavení se má
ukládat k uživatelskému účtu a synchronizovat mezi zařízeními. Změny se mají
projevit až po stisknutí tlačítka Uložit, nikoli jako okamžitý náhled.

## Rozsah

- Ukládat vzhled, jazyk a volitelný výchozí nápoj pro přihlášeného uživatele
  na serveru. Po přihlášení načíst uložené hodnoty. Neuložené změny zůstávají
  jen ve formuláři a účinnými se stanou až po úspěšném uložení.
- Přidat tlačítko Uložit, indikaci probíhajícího ukládání a přeložené potvrzení
  nebo chybu. Při chybě ponechat poslední účinné nastavení a umožnit pokus
  opakovat. Změna hesla zůstává samostatným formulářem.
- API chránit autentizací a vlastnictvím. Výchozí nápoj musí patřit aktuálnímu
  uživateli; ošetřit jeho smazání. Hodnoty různých účtů na stejném zařízení se
  nesmějí směšovat.
- Navrhnout migrace pro PostgreSQL i lokální SQLite a ošetřit stávající
  nastavení v prohlížeči bez tichého přepsání existujících serverových hodnot.
  Ujasnit výchozí chování před přihlášením a při nedostupném serveru; chybný
  zápis nesmí vypadat jako úspěšný.
- Zachovat oba jazyky a vzhledy i použití výchozího nápoje na stránkách, které
  jej využívají.

## Akceptace

- [ ] Neuložená změna nemění účinné nastavení; úspěšné uložení ji použije a
  přežije obnovení stránky i přihlášení na jiném zařízení.
- [ ] Dva účty mají oddělené hodnoty; cizí či smazaný nápoj nelze použít jako
  výchozí.
- [ ] Chyba uložení a odchod s neuloženými změnami jsou srozumitelné a
  nezpůsobí tichou ztrátu nebo falešný úspěch.
- [ ] Testy ověřují serverovou validaci a vlastnictví, UI úspěchu a chyby a obě
  databázová schémata a migrace.
