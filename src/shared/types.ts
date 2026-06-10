import { Game } from "../backend/game-logic";

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

export interface GameBackendState extends GameState {
    _bag: ColorKey[];
    _trash: ColorKey[];
}

export interface LastGame {
    gameState: GameBackendState;
    gameId: number;
    playerIds: string[];
}

export interface PlayerSessionInfo {
    roomId: string;
    id: string;
    number: 1 | 2;
    deleteTimer?: ReturnType<typeof setTimeout>;
}

export interface RoomState {
    game: Game;
    socketIds: string[];
    gameStarted: boolean;
    lastGame?: LastGame | false;
}

export interface PlayerState {
    pickedTiles: ColorKey[]; // tiles the player has picked
    coveredTiles: Record<ColorKey, (boolean | string)[]>;
    score: number;
    hasPassed: boolean;
    canTakeBaseTiles: number;
    notifications: NotificationType[];
}

export interface NotificationType {
    message: string;
    type: "error" | "success" | "info";
    id: number;
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
