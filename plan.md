# **Alcohol Tracker – Projektový plán (aktualizováno o uživatele)**

Jednoduchá webová aplikace pro sledování vypitého alkoholu, výpočet čistého alkoholu a zobrazení statistik. Projekt je navržen tak, aby byl snadno rozšiřitelný a v budoucnu mohl fungovat i jako mobilní aplikace (iOS/Android).  
Aplikace podporuje **uživatelské účty**, aby bylo možné synchronizovat data mezi zařízeními a oddělit data jednotlivých uživatelů.

---

## **1. Cíle projektu**

- Umožnit registraci a přihlášení uživatelů.
- Umožnit zaznamenávání vypitých alkoholických nápojů podle data.
- Definovat vlastní typy drinků (název, objem, procenta alkoholu).
- Ukládat data do lokální databáze během vývoje.
- Zobrazovat statistiky za týden, měsíc nebo vlastní období.
- Použít React pro frontend, Node.js/Express pro backend a Prisma + SQLite pro databázi.
- Připravit architekturu vhodnou pro budoucí mobilní aplikaci.

---

## **2. Technologický stack**

### **Frontend**
- React (doporučeno Vite)
- TypeScript
- UI knihovna (volitelné): Chakra UI / Tailwind with Daisy UI (prefered)
- Grafy: Recharts nebo Chart.js

### **Backend**
- Node.js + Express
- TypeScript
- Prisma ORM
- JWT autentizace
- bcrypt pro hashování hesel

### **Databáze**
- SQLite (lokální soubor, žádná instalace, ideální pro vývoj)

### **Budoucí mobilní aplikace**
- React Native nebo Expo  
  nebo  
- PWA podpora v rámci webové aplikace

---

## **3. Hlavní funkce**

### **3.1 Uživatelské účty**
- Registrace pomocí emailu a hesla
- Přihlášení pomocí emailu a hesla
- Ukládání hesel bezpečně (bcrypt)
- Autentizace pomocí JWT tokenu
- Endpoint `/auth/me` pro ověření přihlášení
- Všechna data (drinky, záznamy, statistiky) jsou vázána na `userId`

### **3.2 Definice drinků**
Každý drink obsahuje:
- `name` – název
- `volumeMl` – objem v ml
- `alcoholPct` – procento alkoholu
- `userId` – vlastník drinku
- odvozená hodnota: čistý alkohol v gramech  
  ```
  pureAlcoholGrams = volumeMl * (alcoholPct / 100) * 0.789
  ```
- odvozena hodnota cisty alkohol v ml

### **3.3 Denní záznamy**
- Výběr data
- Výběr drinku
- Počet kusů
- Uložení do databáze pod `userId`

### **3.4 Kalendář**
- Měsíční přehled
- Součet alkoholu za den
- Kliknutí na den → detail záznamů

### **3.5 Statistiky**
- Součet čistého alkoholu za:
  - posledních 7 dní
  - posledních 30 dní
  - vlastní období
- Grafy (sloupcový nebo liniový graf)

---

## **4. Návrh API**

### **Autentizace**
```
POST /auth/register
POST /auth/login
GET  /auth/me
```

### **Drinks**
```
GET    /drinks
POST   /drinks
PUT    /drinks/:id
DELETE /drinks/:id
```

### **Entries**
```
GET    /entries?from=...&to=...
POST   /entries
DELETE /entries/:id
```

### **Statistics**
```
GET /stats?from=...&to=...
```

Všechny endpointy kromě `/auth/*` vyžadují JWT token.

---

## **5. Databázové schéma (Prisma)**

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  drinks    Drink[]
  entries   Entry[]
}

model Drink {
  id         Int      @id @default(autoincrement())
  name       String
  volumeMl   Int
  alcoholPct Float
  userId     Int
  user       User     @relation(fields: [userId], references: [id])
  entries    Entry[]
}

model Entry {
  id        Int      @id @default(autoincrement())
  date      DateTime
  quantity  Int
  drinkId   Int
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  drink     Drink    @relation(fields: [drinkId], references: [id])
}
```

---

## **6. Struktura projektu**

### **Backend**
```
backend/
  src/
    index.ts
    middleware/
      auth.ts
    routes/
      auth.ts
      drinks.ts
      entries.ts
      stats.ts
    prisma/
      client.ts
  prisma/
    schema.prisma
```

### **Frontend**
```
frontend/
  src/
    components/
    pages/
      LoginPage.tsx
      RegisterPage.tsx
      CalendarPage.tsx
      StatsPage.tsx
      DrinksPage.tsx
    api/
      auth.ts
      drinks.ts
      entries.ts
      stats.ts
```

---

## **7. Doporučený postup vývoje**

### **Krok 1: Backend – uživatelé**
- Přidat User model do Prisma
- Migrace databáze
- Implementovat `/auth/register`
- Implementovat `/auth/login`
- Implementovat `/auth/me`
- Přidat middleware pro ověřování JWT

### **Krok 2: Backend – chráněné endpointy**
- Upravit `/drinks`, `/entries`, `/stats` tak, aby používaly `req.userId`
- Omezit přístup jen na data přihlášeného uživatele

### **Krok 3: Frontend – autentizace**
- Vytvořit stránky Login a Register
- Uložit JWT token (localStorage)
- Přidat wrapper pro API volání s tokenem
- Přesměrování po přihlášení

### **Krok 4: Správa drinků**
- Formulář pro přidání/úpravu drinku
- Seznam drinků
- Napojení na API

### **Krok 5: Záznamy**
- Kalendářová komponenta
- Formulář pro přidání záznamu
- Napojení na API

### **Krok 6: Statistiky**
- Výpočet agregací
- Zobrazení grafů

### **Krok 7: UI vylepšení**
- Validace
- Lepší layout
- Dark mode (volitelné)

### **Krok 8: Mobilní příprava**
- PWA  
  nebo  
- React Native / Expo

---

## **9. Možná budoucí rozšíření**

- Uživatelské profily
- Export dat (CSV)
- Týdenní limity a cíle
- Notifikace
- Zdravotní doporučení
- Sdílení statistik s lékařem nebo partnerem
- Cloud synchronizace (Supabase / Firebase / vlastní backend)

## **10. Hosting a dalsi**

- https://www.forpsicloud.cz/vps.aspx
