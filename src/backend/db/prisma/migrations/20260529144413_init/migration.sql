/*
  Warnings:

  - Added the required column `roomId` to the `Games` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Games" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomId" TEXT NOT NULL,
    "gameState" JSONB,
    "time" DATETIME NOT NULL,
    "finished" BOOLEAN NOT NULL
);
INSERT INTO "new_Games" ("finished", "gameState", "id", "time") SELECT "finished", "gameState", "id", "time" FROM "Games";
DROP TABLE "Games";
ALTER TABLE "new_Games" RENAME TO "Games";
CREATE UNIQUE INDEX "Games_roomId_key" ON "Games"("roomId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
