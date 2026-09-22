-- CreateTable
CREATE TABLE "TranslationTerm" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TranslationValue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "termId" INTEGER NOT NULL,
    "lang" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TranslationValue_termId_fkey" FOREIGN KEY ("termId") REFERENCES "TranslationTerm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TranslationTerm_code_key" ON "TranslationTerm"("code");

-- CreateIndex
CREATE INDEX "TranslationValue_lang_idx" ON "TranslationValue"("lang");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationValue_termId_lang_key" ON "TranslationValue"("termId", "lang");
