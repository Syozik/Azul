/*
  Warnings:

  - You are about to drop the column `roomId` on the `Game` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameState" JSONB,
    "playersOrder" JSONB NOT NULL,
    "time" DATETIME NOT NULL,
    "finished" BOOLEAN NOT NULL
);
INSERT INTO "new_Game" ("finished", "gameState", "id", "playersOrder", "time") SELECT "finished", "gameState", "id", "playersOrder", "time" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
