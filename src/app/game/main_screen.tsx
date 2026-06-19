import { GameOverScreen } from "../components/game_over_screen";
import { useSocket } from "../socket-context";
import { Lobby } from "./lobby";
import { PlayingScreen } from "./playing_screen";

export function MainScreen() {
    const { gameState, connectionStatus } = useSocket();

    if (connectionStatus !== "playing") return <Lobby />;
    if (gameState.isGameOver) return <GameOverScreen />;
    return <PlayingScreen />;
}
