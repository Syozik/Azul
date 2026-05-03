"use client";
import {
    CIRCLE_POSITIONS,
    COLORS,
    DEFAULT_BASE_WIDTH,
    DEFAULT_JOKER_GAP,
    DEFAULT_JOKER_PADDING_LEFT,
    DEFAULT_JOKER_TILE_SIZE,
    DEFAULT_ROUND_TRANSLATE_X,
    JOKERS,
} from "../consts";
import { CircleWithTiles } from "../components/circle";
import "@/app/static/style/phase_one.css";
import { useSocket } from "../utils/socket-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { PlayerDeskContext } from "./phase_two";
import { PlayerDesk } from "../components/player_desk";
import { Tile } from "../components/tile";
import { ColorKey } from "../utils/types";

export function PhaseOne() {
    const { gameState, playerNumber, sendGameAction } = useSocket();
    const [shouldShowDesk, setShouldShowDesk] = useState<boolean>(false);

    const outerRef = useRef<HTMLDivElement>(null);
    const [parentWidth, setParentWidth] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const el = outerRef.current?.parentElement;
        if (!el) return;

        const observer = new ResizeObserver(([entry]) => {
            const width = entry.contentRect.width;
            if (width > 0) {
                setParentWidth(width);
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const scale = useMemo(() => {
        if (parentWidth <= 0) return 1;
        return Math.min(1, parentWidth / DEFAULT_BASE_WIDTH);
    }, [parentWidth]);

    const jokerTileSize = Math.round(DEFAULT_JOKER_TILE_SIZE * scale);
    const jokerPaddingLeft = Math.round(DEFAULT_JOKER_PADDING_LEFT * scale);
    const jokerGap = Math.round(DEFAULT_JOKER_GAP * scale);
    const roundTranslateX = Math.round(DEFAULT_ROUND_TRANSLATE_X * scale);

    if (!gameState) {
        return <div className="phase-one">Loading game...</div>;
    }

    const handleKeyDown = (ev: KeyboardEvent) => {
        if (shouldShowDesk && ev.key === "Escape") {
            setShouldShowDesk(false);
        }
    };
    window.addEventListener("keydown", handleKeyDown);

    const isMyTurn = gameState.currentPlayer === playerNumber;
    const myIndex = playerNumber ? playerNumber - 1 : 0;
    const opponentIndex = playerNumber === 1 ? 1 : 0;

    return (
        <div className="phase-one">
            <div className="tiles-box">
                <p className="tiles-box-title">Your Tiles </p>
                <div className="picked-tiles">
                    {gameState.players[myIndex].pickedTiles.map((color, i) => (
                        <span
                            key={i}
                            className="box-tile"
                            style={{ backgroundColor: COLORS[color] }}
                        />
                    ))}
                    {gameState.players[myIndex].pickedTiles.length === 0 && (
                        <span className="no-tiles">No tiles picked yet</span>
                    )}
                </div>
            </div>

            <div className="game-board">
                {!isMobile && (
                    <div
                        className="jokers-order"
                        style={{
                            paddingLeft: `${jokerPaddingLeft}px`,
                            gap: `${jokerGap}px`,
                            marginTop: "-25px",
                        }}
                    >
                        {JOKERS.map((color, idx) => (
                            <div className="base-round" key={color}>
                                <Tile
                                    color={COLORS[color as ColorKey]}
                                    transformAngle={0}
                                    size={jokerTileSize}
                                />
                                <p
                                    className={`round-number ${gameState.round === idx + 1 ? "active" : ""}`}
                                    style={{
                                        transform: `translate(${roundTranslateX}px)`,
                                        width: `${Math.round(27 * scale)}px`,
                                        height: `${Math.round(27 * scale)}px`,
                                        fontSize: `${Math.round(14 * scale)}px`,
                                    }}
                                >
                                    {idx + 1}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
                <button
                    className="check-desk"
                    style={{ marginTop: "10px" }}
                    onClick={() => setShouldShowDesk(true)}
                >
                    Check desk
                </button>
                <div className="circles">
                    {gameState.factories.map((factoryTiles, idx) => (
                        <CircleWithTiles
                            colors={factoryTiles}
                            factoryIndex={idx}
                            position={CIRCLE_POSITIONS[idx]}
                            isMyTurn={isMyTurn}
                            sendGameAction={sendGameAction}
                            key={idx}
                        />
                    ))}
                </div>

                <div className="center-pool">
                    {gameState.centerPool.map((color, i) => (
                        <span
                            key={i}
                            className={`box-tile ${isMyTurn ? "clickable" : ""}`}
                            style={{ backgroundColor: COLORS[color] }}
                            onClick={() => {
                                if (isMyTurn) {
                                    sendGameAction({
                                        type: "pick",
                                        color,
                                    });
                                }
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="tiles-box">
                <p className="tiles-box-title">Opponent</p>
                <div className="picked-tiles">
                    {gameState.players[opponentIndex].pickedTiles.map(
                        (color, i) => (
                            <span
                                key={i}
                                className="box-tile"
                                style={{ backgroundColor: COLORS[color] }}
                            />
                        ),
                    )}
                    {gameState.players[opponentIndex].pickedTiles.length ===
                        0 && (
                        <span className="no-tiles">No tiles picked yet</span>
                    )}
                </div>
            </div>
            {shouldShowDesk && (
                <div className="desk-popover">
                    <div className="pointer-events-none">
                        <PlayerDeskContext.Provider value={playerNumber}>
                            <PlayerDesk />
                        </PlayerDeskContext.Provider>
                    </div>
                    <button
                        className="close-popover"
                        onClick={() => setShouldShowDesk(false)}
                    >
                        x
                    </button>
                </div>
            )}
        </div>
    );
}
