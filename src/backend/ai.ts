import { ColorKey, TileColor } from "@/shared/types";
import { Player } from "./player";
import { numberOf } from "@/shared/helpers";
import { JOKERS, TILE_COLORS, BONUSES } from "@/shared/consts";

export class AI extends Player {
    public playTurn() {
        console.log(new Date(), "playing turn");
        if (this.game.state.currentPlayer !== this.playerNumber) {
            throw new Error("It's not AI's turn.");
        }

        if (this.game.state.phase === 1) this.pick();
        else if (this.canTakeBaseTiles) this.basePick();
        else this.cover();
    }

    public pick() {
        let max: { points: number; color?: ColorKey; idx?: number } = { points: -1 };
        this.game.state.factories.forEach((factory, idx) => {
            if (factory.length === 0) return;
            const [color, points] = this.computePoints(factory);
            if (color && points > max.points) {
                max = { points, color, idx };
            }
        });
        if (this.game.state.centerPool.length > 0) {
            const [color, points] = this.computePoints(this.game.state.centerPool);
            if (color && points > max.points) {
                max = { points, color };
            }
        }
        if (!max.color) throw new Error("Something went wrong, color is not defined.");

        return this.game.applyAction(this.playerNumber, {
            type: "pick",
            color: max.color,
            factoryIndex: max.idx,
        });
    }

    public cover() {
        const joker = this.game.joker;
        const candidates: { color: TileColor; points: number; usedTiles: ColorKey[]; score: number }[] = [];

        for (const color of TILE_COLORS) {
            const numColor = numberOf(this.pickedTiles, (t) => t === color);
            const numJoker = numberOf(this.pickedTiles, (t) => t === joker);

            for (let points = 1; points <= 6; points++) {
                if (this.coveredTiles[color][points - 1]) continue;

                if (color === joker) {
                    if (numJoker >= points) {
                        const usedTiles = Array(points).fill(joker);
                        candidates.push({
                            color,
                            points,
                            usedTiles,
                            score: this.evaluateCoverAction(color, points, usedTiles),
                        });
                    }
                } else {
                    if (numColor + numJoker >= points) {
                        const useColor = Math.min(numColor, points);
                        const useJoker = points - useColor;
                        const usedTiles = [
                            ...Array(useColor).fill(color),
                            ...Array(useJoker).fill(joker),
                        ];
                        candidates.push({
                            color,
                            points,
                            usedTiles,
                            score: this.evaluateCoverAction(color, points, usedTiles),
                        });
                    }
                }
            }
        }

        const centerColors = this.coveredTiles["CENTER"].filter(
            (t) => typeof t === "string"
        ) as ColorKey[];

        for (const C of TILE_COLORS) {
            if (centerColors.includes(C)) continue;

            const numC = numberOf(this.pickedTiles, (t) => t === C);
            const numJoker = numberOf(this.pickedTiles, (t) => t === joker);

            for (let points = 1; points <= 6; points++) {
                if (this.coveredTiles["CENTER"][points - 1]) continue;

                if (C === joker) {
                    if (numJoker >= points) {
                        const usedTiles = Array(points).fill(joker);
                        candidates.push({
                            color: "CENTER",
                            points,
                            usedTiles,
                            score: this.evaluateCoverAction("CENTER", points, usedTiles),
                        });
                    }
                } else {
                    if (numC > 0 && numC + numJoker >= points) {
                        const useC = Math.min(numC, points);
                        const useJoker = points - useC;
                        const usedTiles = [
                            ...Array(useC).fill(C),
                            ...Array(useJoker).fill(joker),
                        ];
                        candidates.push({
                            color: "CENTER",
                            points,
                            usedTiles,
                            score: this.evaluateCoverAction("CENTER", points, usedTiles),
                        });
                    }
                }
            }
        }

        if (candidates.length > 0) {
            candidates.sort((a, b) => b.score - a.score);
            const best = candidates[0];
            return this.game.applyAction(this.playerNumber, {
                type: "cover",
                color: best.color,
                points: best.points,
                usedTiles: best.usedTiles,
            });
        }

        const emptySlots = [];
        for (let i = 0; i < 4; i++) {
            if (this.savedTilesForNextRound[i] === null) {
                emptySlots.push(i);
            }
        }
        if (emptySlots.length > 0 && this.pickedTiles.length > 0 && this.game.state.round < 6) {
            const nextJoker = JOKERS[this.game.state.round];
            const nextJokerTiles = this.pickedTiles.filter((t) => t === nextJoker);
            const otherTiles = this.pickedTiles.filter((t) => t !== nextJoker);
            const prioritizedTiles = [...nextJokerTiles, ...otherTiles];
            const tilesToSave = prioritizedTiles.slice(0, emptySlots.length);

            this.game.applyAction(this.playerNumber, {
                type: "save-for-next-round",
                slotIdx: emptySlots[0],
                selectedTiles: tilesToSave,
            });
        }

        return this.game.applyAction(this.playerNumber, { type: "pass" });
    }

    public basePick() {
        const toPick = this.canTakeBaseTiles;
        const candidates: { points: number; identifier: string }[] = [];
        for (let i = 0; i < this.game.state.baseTiles.length; i++) {
            const tiles = this.game.state.baseTiles[i];
            for (let j = 0; j < tiles.length; j++) {
                const color = tiles[j];
                let points = 0;
                if (color === this.game.joker) {
                    points += 5;
                }
                points += numberOf(this.pickedTiles, (tile) => tile === color);
                const coveredTiles = numberOf(this.coveredTiles[color], (tile) => !!tile);
                if (coveredTiles !== 6 || color === this.game.joker) {
                    points += coveredTiles;
                } else {
                    if (this.coveredTiles["CENTER"].includes(color)) {
                        points = 0;
                    } else {
                        points /= 2;
                    }
                }
                candidates.push({
                    points,
                    identifier: `${i}_${j}_${color}`,
                });
            }
        }

        candidates.sort((a, b) => b.points - a.points);
        const selectedTiles = candidates.slice(0, toPick).map((c) => c.identifier);

        return this.game.applyAction(this.playerNumber, {
            type: "base-pick",
            selectedTiles,
        });
    }

    private evaluateCoverAction(color: TileColor, points: number, usedTiles: ColorKey[]): number {
        const expectedBonus = this.computeExpectedBonus(color, points);
        const expectedCombinations = this.computeExpectedCombinations(color, points);
        const jokerCount = numberOf(usedTiles, (t) => t === this.game.joker);
        const rank = color === "CENTER" ? 0 : 6 - JOKERS.indexOf(color);

        return expectedBonus + points + 5 * expectedCombinations - 0.5 * jokerCount + 0.1 * rank;
    }

    private computeExpectedBonus(color: TileColor, points: number): number {
        const coveredCopy = {} as Record<TileColor, (boolean | string)[]>;
        for (const key of Object.keys(this.coveredTiles) as TileColor[]) {
            coveredCopy[key] = [...this.coveredTiles[key]];
        }
        coveredCopy[color][points - 1] = true;

        let bonus = 1;
        let i = points - 2;
        while (coveredCopy[color][(i + 6) % 6] && bonus < 6) {
            bonus += 1;
            i -= 1;
        }
        i = points;
        while (coveredCopy[color][i % 6] && bonus < 6) {
            bonus += 1;
            i += 1;
        }

        if (1 <= points && points <= 4) {
            if (Object.values(coveredCopy).every((col) => !!col[points - 1])) {
                bonus += points * 4;
            }
        }

        if (coveredCopy[color].every((point) => !!point)) {
            bonus += BONUSES[color];
        }

        return bonus;
    }

    private computeExpectedCombinations(color: TileColor, points: number): number {
        const coveredCopy = {} as Record<TileColor, (boolean | string)[]>;
        for (const key of Object.keys(this.coveredTiles) as TileColor[]) {
            coveredCopy[key] = [...this.coveredTiles[key]];
        }
        coveredCopy[color][points - 1] = true;

        let numberOfPilesToTake = 0;
        if (color !== "CENTER") {
            if (points === 5 || points === 6) {
                if (coveredCopy[color][4] && coveredCopy[color][5]) {
                    numberOfPilesToTake += 3;
                    return numberOfPilesToTake;
                }
            }
            if (points === 3 || points === 4) {
                if (coveredCopy[color][2] && coveredCopy[color][3]) {
                    const previousColor = TILE_COLORS[(5 + TILE_COLORS.indexOf(color)) % 6];
                    if (
                        coveredCopy[previousColor][0] &&
                        coveredCopy[previousColor][1]
                    ) {
                        numberOfPilesToTake += 2;
                    }
                }
            }
            if (points === 2 || points === 3) {
                if (coveredCopy[color][1] && coveredCopy[color][2]) {
                    const idx = TILE_COLORS.indexOf(color);
                    if (
                        coveredCopy["CENTER"][idx] &&
                        coveredCopy["CENTER"][(idx + 1) % 6]
                    ) {
                        numberOfPilesToTake += 1;
                    }
                }
            }
            if (points === 1 || points === 2) {
                if (coveredCopy[color][0] && coveredCopy[color][1]) {
                    const nextColor = TILE_COLORS[(1 + TILE_COLORS.indexOf(color)) % 6];
                    if (coveredCopy[nextColor][2] && coveredCopy[nextColor][3]) {
                        numberOfPilesToTake += 2;
                    }
                }
            }
        } else {
            const checkColor = (color: ColorKey) =>
                coveredCopy[color][1] && coveredCopy[color][2];
            if (coveredCopy[color][points]) {
                if (checkColor(TILE_COLORS[points - 1])) {
                    numberOfPilesToTake += 1;
                }
            }
            if (coveredCopy[color][(4 + points) % 6]) {
                if (checkColor(TILE_COLORS[(4 + points) % 6])) {
                    numberOfPilesToTake += 1;
                }
            }
        }
        return numberOfPilesToTake;
    }

    private computePoints(factory: ColorKey[]): [ColorKey, number] {
        let maxPoints = 0;
        let maxColor;
        const colors = new Set(factory);
        for (const color of [...colors]) {
            let points = 0;
            if (color === this.game.joker && colors.size !== 1) {
                // we can't take a single joker if there are other colors;
                continue;
            }

            const numberOfTiles = numberOf(factory, (el) => el === color);
            points += numberOfTiles * 2;
            if (color === this.game.joker) points += 8;
            else if (colors.has(this.game.joker)) points += 6;

            const coveredTiles = numberOf(this.coveredTiles[color], (tile) => !!tile);
            if (coveredTiles !== 6 || color === this.game.joker) {
                points += 1.5 * coveredTiles;
            } else {
                if (this.coveredTiles["CENTER"].includes(color)) {
                    points = 0;
                } else {
                    points /= 2;
                }
            }
            points += (6 - JOKERS.indexOf(color)) / 2;

            if (points >= maxPoints) {
                maxPoints = points;
                maxColor = color;
            }
        }
        return [maxColor!, maxPoints];
    }
}
