export type ColorKey = "PURPLE" | "GREEN" | "ORANGE" | "YELLOW" | "BLUE" | "RED" | "CENTER";

export interface GameState {
    factories: ColorKey[][];
    centerPool: ColorKey[];
    players: [PlayerState, PlayerState];
    currentPlayer: 1 | 2;
    round: number;
    phase: 1 | 2;
}

export interface PlayerState {
    pickedTiles: ColorKey[]; // tiles the player has picked this round
    coveredTiles: Record<ColorKey, boolean[]>;
    score: number;
    hasPassed: boolean;
}

// The action a player sends when clicking a tile color on a factory
export interface PickTilesAction {
    type: "pick";
    color: ColorKey;
    factoryIndex: number | undefined;
}

export interface CoverTileAction {
    type: "cover";
    color: ColorKey;
    points: number;
    usedTiles: ColorKey[];
}

export interface PassAction {
    type: "pass";
}

export type GameAction = Partial<PickTilesAction> | CoverTileAction | PassAction;
export type TileColor = ColorKey;
