-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Games" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameState" JSONB,
    "time" DATETIME NOT NULL,
    "finished" BOOLEAN NOT NULL
);
INSERT INTO "new_Games" ("finished", "gameState", "id", "time") SELECT "finished", "gameState", "id", "time" FROM "Games";
DROP TABLE "Games";
ALTER TABLE "new_Games" RENAME TO "Games";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
