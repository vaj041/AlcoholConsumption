# Obnova hesla ze Seznam e-mailového účtu

Stav: návrh. Sledování: [issue #24](https://github.com/vaj041/AlcoholConsumption/issues/24).

## Současný stav a cíl

Obnova hesla aktuálně používá Mailjet API v
`backend/src/utils/passwordResetEmail.ts`; postup nasazení je ve
`vercel-deploy.md`. Cílem je odesílat e-maily pro obnovu hesla ze Seznam účtu,
nikoli jen umožnit doručování příjemcům se Seznam adresou. Jiné druhy e-mailů
nejsou součástí tohoto úkolu.

## Rozsah

- Ověřit aktuální možnosti Seznamu a jeho požadavky na autentizaci, zabezpečení
  a adresu odesílatele. Navrhnout a implementovat odesílání pro existující tok
  obnovy hesla bez předpokladů o dostupných přihlašovacích údajích.
- Před výběrem transportu ověřit kompatibilitu s Vercel serverless prostředím
  i s lokálním během. Pokud přímé SMTP není dostupné, zaznamenat omezení a
  použitelný postup nejprve projednat s vlastníkem.
- Konfiguraci a citlivé údaje předávat pouze přes environment variables nebo
  správu secrets, nikdy je neukládat do repozitáře ani logovat. Aktualizovat
  příklady konfigurace a návod pro nasazení.
- Zachovat generické odpovědi bez prozrazení existence účtu, omezení pokusů,
  jednorázový a časově omezený token a lokalizaci `cs`/`en`. Selhání odeslání
  musí být provozně dohledatelné bez logování tokenů nebo obsahu zprávy.
- Před implementací vyjasnit, zda má Mailjet zůstat volitelnou alternativou,
  nebo být nahrazen. Nepoužívat tichý fallback při chybě odeslání.

## Akceptace

- [ ] Automatické testy úspěchu, selhání poskytovatele, chybějící konfigurace a
  zachování bezpečnosti obnovy.
- [ ] Doručení ověřeno s reálným Seznam účtem v cílovém prostředí po jeho
  konfiguraci, bez vystavení přihlašovacích údajů.
- [ ] Nastavení a známá omezení jsou zdokumentována.
