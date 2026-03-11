export type ColorKey =
    | "PURPLE"
    | "GREEN"
    | "ORANGE"
    | "YELLOW"
    | "BLUE"
    | "RED"
    | "CENTER";

export interface GameState {
    factories: ColorKey[][];
    centerPool: ColorKey[];
    players: [PlayerState, PlayerState];
    currentPlayer: 1 | 2;
    round: number;
    phase: 1 | 2;
    baseTiles: [ColorKey[], ColorKey[]];
    isGameOver: boolean;
    firstPlayer: 1 | 2;
    isFirstCenterPick: boolean;
}

export interface PlayerState {
    pickedTiles: ColorKey[]; // tiles the player has picked
    coveredTiles: Record<ColorKey, (boolean | string)[]>;
    score: number;
    hasPassed: boolean;
    canTakeBaseTiles: number;
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

export interface BasePickAction {
    type: "base-pick";
    selectedTiles: string[];
}

export type GameAction =
    | Partial<PickTilesAction>
    | CoverTileAction
    | PassAction
    | BasePickAction;

export type TileColor = ColorKey;
