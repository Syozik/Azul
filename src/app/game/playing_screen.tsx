import "@/app/style/playing_screen.css";
import { useEffect, useRef, useState } from "react";
import { NOTIFICATION_DURATION } from "../../shared/consts";
import { useSocket } from "../socket-context";
import { NotificationType } from "../../shared/types";
import { NotificationContainer } from "../components/notification";
import { PhaseOne } from "./phase_one";
import { PhaseTwo } from "./phase_two";

export function PlayingScreen() {
    const { state, endGame } = useSocket();
    const [visibleNotifs, setVisibleNotifs] = useState<NotificationType[]>([]);
    const isYourTurn = state.gameState.currentPlayer === state.playerNumber;
    // const [showInfo, setShowInfo] = useState<boolean>(false);
    const seenIdsRef = useRef<Set<number>>(new Set());
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const notifications = state.gameState.players[state.playerNumber - 1]?.notifications;
    useEffect(() => {
        const newNotifs = notifications.filter((n) => !seenIdsRef.current.has(n.id));
        if (newNotifs.length === 0) return;

        for (const n of newNotifs) {
            seenIdsRef.current.add(n.id);
        }

        const timers = timersRef.current;
        while (timers.length) {
            clearTimeout(timers.pop());
        }

        setVisibleNotifs(newNotifs);

        const timer = setTimeout(() => {
            setVisibleNotifs((prev) => prev.filter((notif) => !newNotifs.includes(notif)));
            timers.pop();
        }, NOTIFICATION_DURATION);

        timers.push(timer);

        return () => {
            while (timers.length) {
                clearTimeout(timers.pop());
            }
        };
    }, [notifications]);

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
                <div className="flex items-center gap-2.5">
                    <span
                        className={`turn-badge ${isYourTurn ? "turn-badge--yours" : "turn-badge--theirs"}`}
                    >
                        <p className="player-name">
                            {state.gameState.players[state.gameState.currentPlayer - 1].name +
                                "'s Turn"}
                        </p>
                        <svg
                            className={`turn-arrow turn-arrow--${isYourTurn ? "left" : "right"}`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            {isYourTurn ? (
                                <>
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </>
                            ) : (
                                <>
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </>
                            )}
                        </svg>
                    </span>
                    {/*<div className="info">
                        <button
                            className="info-button"
                            onClick={() => setShowInfo(!showInfo)}
                        >
                            Info
                        </button>
                        {showInfo && <InfoBlock />}
                    </div>*/}
                </div>
                <span className="end-game-button">
                    <button onClick={() => endGame()}>End Game</button>
                </span>
            </div>
            <NotificationContainer notifications={visibleNotifs} />
            {state.gameState.phase === 1 ? <PhaseOne /> : <PhaseTwo />}
        </>
    );
}
