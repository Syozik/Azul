import { BONUSES, JOKERS, TILE_COLORS } from "@/shared/consts";
import { initCoveredTiles, numberOf } from "@/shared/helpers";
import {
    ColorKey,
    NotificationType,
    PlayerState,
    TileColor,
} from "@/shared/types";
import { shuffle } from "./utils";
import { Game } from "./game-logic";

export class Player {
    private readonly game: Game;
    public playerNumber: number;
    pickedTiles: ColorKey[] = [];
    coveredTiles: Record<TileColor, (boolean | string)[]> = initCoveredTiles();
    savedTilesForNextRound: (ColorKey | null)[] = Array(4).fill(null);
    canTakeBaseTiles: number = 0;
    score: number = 5;
    hasPassed: boolean = false;
    notifications: NotificationType[] = [];

    public constructor(playerNumber: number, game: Game) {
        this.playerNumber = playerNumber;
        this.game = game;
        Object.defineProperty(this, "game", { enumerable: false });
    }

    public applyPickAction(color: ColorKey, factoryIndex?: number) {
        if (this.game.state.currentPlayer !== this.playerNumber) {
            throw new Error("It's not your turn");
        }
        let pool;
        if (factoryIndex !== undefined) {
            if (
                factoryIndex < 0 ||
                factoryIndex >= this.game.state.factories.length
            )
                throw new Error("Invalid factory index");
            pool = this.game.state.factories[factoryIndex];
        } else {
            pool = this.game.state.centerPool;
        }
        if (!pool.length) {
            throw new Error("Selected pool is empty");
        }
        if (!pool.includes(color)) {
            throw new Error(`Color ${color} not in the selected pool`);
        }
        const joker: ColorKey = JOKERS[this.game.state.round - 1];
        if (color === joker && pool.some((color) => color !== joker)) {
            throw new Error(`Can't choose the current joker`);
        }

        // Split tiles: picked (matching color) vs remaining (go to center)
        const picked = pool.filter((t) => t === color);
        const remaining = pool.filter((t) => t !== color);

        const jokerIdx = remaining.indexOf(joker);
        if (jokerIdx !== -1) {
            picked.push(joker);
            remaining.splice(jokerIdx, 1);
        }

        this.pickedTiles.push(...picked);
        if (factoryIndex !== undefined) {
            this.game.state.factories[factoryIndex] = [];
            this.game.state.centerPool.push(...remaining);
        } else {
            this.game.state.centerPool = remaining;
            if (this.game.state.isFirstCenterPick) {
                this.game.state.firstPlayer = this.playerNumber;
                this.score = Math.max(this.score - picked.length, 0);
                this.game.state.isFirstCenterPick = false;
            }
        }
        this.game.pushNotification(
            this.playerNumber - 1,
            "success",
            `You picked up ${picked.join(" ")} tiles`,
            true,
        );
    }

    public applyCoverAction(
        color: TileColor,
        points: number,
        usedTiles: ColorKey[],
    ) {
        if (this.game.state.currentPlayer !== this.playerNumber) {
            throw new Error("It's not your turn");
        }
        if (this.canTakeBaseTiles) {
            throw new Error("You need to pick from the base first");
        }
        if (this.coveredTiles[color][points - 1]) {
            throw new Error("This tile has already been closed");
        }

        const joker = JOKERS[this.game.state.round - 1];
        const isCenter = color === "CENTER";
        let res: ColorKey | boolean = true;
        if (!isCenter) {
            usedTiles = usedTiles.filter(
                (tile) => tile === color || tile === joker,
            );
        } else {
            const usedTilesSet = new Set(usedTiles);
            if (
                usedTilesSet.size > 2 ||
                (usedTilesSet.size == 2 && !usedTilesSet.has(joker))
            ) {
                throw new Error("You can't use these tiles");
            }
            const centerColor = usedTiles.find((tile) => tile !== joker);
            if (
                !centerColor ||
                this.coveredTiles[color].includes(centerColor)
            ) {
                throw new Error(
                    `You can place ${centerColor} in the center only once.`,
                );
            }
            res = centerColor;
        }
        if (usedTiles.length !== points) {
            throw new Error("Not the right number of tiles");
        }
        const pickedTilesCopy = [...this.pickedTiles];
        for (const usedTile of usedTiles) {
            const tileIdx = pickedTilesCopy.indexOf(usedTile);
            if (tileIdx === -1) {
                throw new Error("You don't have the tiles you tried to use.");
            }
            pickedTilesCopy.splice(tileIdx, 1);
        }
        this.pickedTiles = pickedTilesCopy;
        this.game.state._trash.push(...usedTiles);
        // res is true if it's not a colored tile, and a color if it's center
        this.coveredTiles[color][points - 1] = res;

        this.score += this.getBonus(color, points);
        this.canTakeBaseTiles += this.checkForCombinations(color, points);
        this.game.pushNotification(
            this.playerNumber - 1,
            "success",
            `You covered ${points} ${color} tile`,
            true,
        );
    }

    private getBonus(color: TileColor, points: number) {
        let bonus = 1;
        let i = points - 2;
        while (this.coveredTiles[color][(i + 6) % 6] && bonus < 6) {
            bonus += 1;
            i -= 1;
        }
        i = points;
        while (this.coveredTiles[color][i % 6] && bonus < 6) {
            bonus += 1;
            i += 1;
        }

        if (1 <= points && points <= 4) {
            if (
                Object.values(this.coveredTiles).every(
                    (color) => !!color[points - 1],
                )
            ) {
                bonus += points * 4;
            }
        }

        if (this.coveredTiles[color].every((point) => !!point)) {
            bonus += BONUSES[color];
            this.game.pushNotification(
                this.playerNumber - 1,
                "success",
                `You covered all ${color} tiles`,
                true,
            );
        }

        return bonus;
    }

    private checkForCombinations(color: TileColor, points: number) {
        let numberOfPilesToTake = 0;
        if (color !== "CENTER") {
            if (points === 5 || points === 6) {
                if (
                    this.coveredTiles[color][4] &&
                    this.coveredTiles[color][5]
                ) {
                    this.game.pushNotification(
                        this.playerNumber - 1,
                        "success",
                        `You covered ${color} mirror tiles!`,
                        true,
                    );
                    numberOfPilesToTake += 3;
                    return numberOfPilesToTake;
                }
            }
            if (points === 3 || points === 4) {
                if (
                    this.coveredTiles[color][2] &&
                    this.coveredTiles[color][3]
                ) {
                    const previousColor =
                        TILE_COLORS[(5 + TILE_COLORS.indexOf(color)) % 6];
                    if (
                        this.coveredTiles[previousColor][0] &&
                        this.coveredTiles[previousColor][1]
                    ) {
                        this.game.pushNotification(
                            this.playerNumber - 1,
                            "success",
                            `You covered a statue!`,
                            true,
                        );
                        numberOfPilesToTake += 2;
                    }
                }
            }
            if (points === 2 || points === 3) {
                if (
                    this.coveredTiles[color][1] &&
                    this.coveredTiles[color][2]
                ) {
                    const idx = TILE_COLORS.indexOf(color);
                    if (
                        this.coveredTiles["CENTER"][idx] &&
                        this.coveredTiles["CENTER"][(idx + 1) % 6]
                    ) {
                        this.game.pushNotification(
                            this.playerNumber - 1,
                            "success",
                            `You covered a fountain!`,
                            true,
                        );
                        numberOfPilesToTake += 1;
                    }
                }
            }
            if (points === 1 || points === 2) {
                if (
                    this.coveredTiles[color][0] &&
                    this.coveredTiles[color][1]
                ) {
                    const nextColor =
                        TILE_COLORS[(1 + TILE_COLORS.indexOf(color)) % 6];
                    if (
                        this.coveredTiles[nextColor][2] &&
                        this.coveredTiles[nextColor][3]
                    ) {
                        this.game.pushNotification(
                            this.playerNumber - 1,
                            "success",
                            `You covered a statue!`,
                            true,
                        );
                        numberOfPilesToTake += 2;
                    }
                }
            }
        } else {
            const checkColor = (color: ColorKey) =>
                this.coveredTiles[color][1] && this.coveredTiles[color][2];
            if (this.coveredTiles[color][points]) {
                if (checkColor(TILE_COLORS[points - 1])) {
                    numberOfPilesToTake += 1;
                    this.game.pushNotification(
                        this.playerNumber - 1,
                        "success",
                        `You covered ${color} a fountain!`,
                        true,
                    );
                }
            }
            if (this.coveredTiles[color][(4 + points) % 6]) {
                if (checkColor(TILE_COLORS[(4 + points) % 6])) {
                    numberOfPilesToTake += 1;
                    this.game.pushNotification(
                        this.playerNumber - 1,
                        "success",
                        `You covered ${color} a fountain!`,
                        true,
                    );
                }
            }
        }
        return numberOfPilesToTake;
    }

    public applyPassAction() {
        this.hasPassed = true;
        const tilesLeft = this.pickedTiles.length;
        this.score -= tilesLeft;
        let message = "You passed!";
        if (tilesLeft) {
            message += ` You got minus ${tilesLeft} points for unused tiles.`;
        }
        const idx = this.playerNumber - 1;
        this.game.pushNotification(idx, "success", message, true);
        this.game.state._trash.push(...this.pickedTiles);
        this.pickedTiles = [];
    }

    public applyBasePickAction(selectedTiles: string[]) {
        if (this.game.state.currentPlayer !== this.playerNumber) {
            throw new Error("It's not your turn");
        }

        if (this.canTakeBaseTiles < selectedTiles.length) {
            throw new Error("You can't take this many tiles");
        }

        if (this.game.state._bag.length < selectedTiles.length) {
            this.game.state._bag.push(...this.game.state._trash);
            this.game.state._trash = [];
            shuffle(this.game.state._bag);
        }

        const colors: ColorKey[] = [];
        for (const tile of selectedTiles) {
            const [i, j, color] = tile.split("_");
            colors.push(color as ColorKey);
            this.pickedTiles.push(color as ColorKey);
            this.game.state.baseTiles[Number(i)][Number(j)] =
                this.game.state._bag.splice(0, 1)[0];
        }
        this.game.pushNotification(
            this.playerNumber - 1,
            "success",
            `You took ${colors.join(" ")} tiles from the base.`,
            true,
        );
        this.canTakeBaseTiles = 0;
    }

    public applySaveForNextRoundAction(idx: number, selectedTiles: ColorKey[]) {
        const savedTiles = this.savedTilesForNextRound;
        if (savedTiles[idx]) {
            throw new Error("You've already used that slot.");
        }
        const nbAvailable = numberOf(savedTiles, (tile) => !tile);
        if (selectedTiles.length > nbAvailable) {
            throw new Error(`You can't save ${selectedTiles.length} tiles.
                You have only ${nbAvailable} available slots left.`);
        }
        let saved = 0;
        while (saved < selectedTiles.length && idx < 8) {
            if (!savedTiles[idx % 4]) {
                const tile = selectedTiles[saved];
                const idxOfTile = this.pickedTiles.indexOf(tile);
                if (idxOfTile === -1) {
                    throw new Error(`You don't have ${tile} tile!`);
                }
                this.pickedTiles.splice(idxOfTile, 1);
                savedTiles[idx % 4] = tile;
                saved += 1;
            }
            idx += 1;
        }
    }

    public toJSON(): PlayerState & { playerNumber: number } {
        return {
            playerNumber: this.playerNumber,
            pickedTiles: [...this.pickedTiles],
            coveredTiles: Object.fromEntries(
                Object.entries(this.coveredTiles).map(([color, tiles]) => [
                    color,
                    [...tiles],
                ]),
            ) as Record<TileColor, (boolean | string)[]>,
            savedTilesForNextRound: [...this.savedTilesForNextRound],
            canTakeBaseTiles: this.canTakeBaseTiles,
            score: this.score,
            hasPassed: this.hasPassed,
            notifications: [...this.notifications],
        };
    }
}
