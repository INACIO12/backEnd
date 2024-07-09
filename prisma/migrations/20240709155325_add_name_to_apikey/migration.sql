/*
  Warnings:

  - You are about to drop the column `nameKEY` on the `ApiKey` table. All the data in the column will be lost.
  - Added the required column `name` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApiKey" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ApiKey" ("createdAt", "id", "key", "userId") SELECT "createdAt", "id", "key", "userId" FROM "ApiKey";
DROP TABLE "ApiKey";
ALTER TABLE "new_ApiKey" RENAME TO "ApiKey";
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
