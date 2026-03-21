import "@/app/static/style/main_screen.css";
import { useEffect, useRef, useState } from "react";
import { GameOverScreen } from "../components/game_over_screen";
import { NotificationContainer } from "../components/notification";
import { NOTIFICATION_DURATION } from "../consts";
import { useSocket } from "../utils/socket-context";
import { NotificationType } from "../utils/types";
import { Lobby } from "./lobby";
import { PhaseOne } from "./phase_one";
import { PhaseTwo } from "./phase_two";

export function MainScreen() {
    const { gameState, playerNumber, connectionStatus } = useSocket();
    const [visibleNotifs, setVisibleNotifs] = useState<NotificationType[]>([]);
    const seenIdsRef = useRef<Set<number>>(new Set());
    const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    const notifications = gameState.players[playerNumber - 1].notifications;

    useEffect(() => {
        const newNotifs = notifications.filter(
            (n) => !seenIdsRef.current.has(n.id),
        );
        if (newNotifs.length === 0) return;

        for (const n of newNotifs) {
            seenIdsRef.current.add(n.id);
        }

        const timers = timersRef.current;
        for (const [id, timer] of timers) {
            clearTimeout(timer);
            timers.delete(id);
        }

        const newest = newNotifs[newNotifs.length - 1];
        setVisibleNotifs([newest]);

        const timer = setTimeout(() => {
            setVisibleNotifs((prev) => prev.filter((v) => v.id !== newest.id));
            timers.delete(newest.id);
        }, NOTIFICATION_DURATION);
        timers.set(newest.id, timer);

        return () => {
            const t = timers.get(newest.id);
            if (t) {
                clearTimeout(t);
                timers.delete(newest.id);
            }
        };
    }, [notifications]);

    if (connectionStatus !== "playing") return <Lobby />;
    if (gameState.isGameOver) return <GameOverScreen />;

    return (
        <>
            <div
                className="game-header flex gap-10 items-center justify-center"
                style={{
                    padding: "0.75rem 1.5rem",
                    background:
                        "linear-gradient(135deg, rgba(92,61,26,0.08), rgba(196,162,101,0.12))",
                    borderBottom: "2px solid rgba(196,162,101,0.3)",
                }}
            >
                <div className="flex items-center">
                    <span
                        className={`turn-badge ${gameState.currentPlayer === playerNumber ? "turn-badge--yours" : "turn-badge--theirs"}`}
                    >
                        {gameState.currentPlayer === playerNumber ? (
                            <>
                                <svg
                                    className="turn-arrow turn-arrow--left"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Your Turn
                            </>
                        ) : (
                            <>
                                Opponent&apos;s Turn
                                <svg
                                    className="turn-arrow turn-arrow--right"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </>
                        )}
                    </span>
                </div>
            </div>
            <NotificationContainer notifications={visibleNotifs} />
            {gameState.phase === 1 ? <PhaseOne /> : <PhaseTwo />}
        </>
    );
}
