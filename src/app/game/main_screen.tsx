import { GameOverScreen } from "../components/game_over_screen";
import { useSocket } from "../socket-context";
import { Lobby } from "./lobby";
import { PlayingScreen } from "./playing_screen";

export function MainScreen() {
    const { state } = useSocket();

    if (state.connectionStatus !== "playing") return <Lobby />;
    if (state.gameState.isGameOver) return <GameOverScreen />;
    if (state.gameState.isGameOver) return <GameOverScreen />;
    return <PlayingScreen />;
}
