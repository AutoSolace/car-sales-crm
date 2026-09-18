/*
  Warnings:

  - You are about to drop the column `reviewJson` on the `ImportSession` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ImportSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "headers" TEXT NOT NULL,
    "rawDataJson" TEXT NOT NULL,
    "mappingJson" TEXT,
    "reportJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ImportSession" ("createdAt", "filename", "headers", "id", "mappingJson", "rawDataJson") SELECT "createdAt", "filename", "headers", "id", "mappingJson", "rawDataJson" FROM "ImportSession";
DROP TABLE "ImportSession";
ALTER TABLE "new_ImportSession" RENAME TO "ImportSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
