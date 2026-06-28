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
} from "../../shared/consts";
import { CircleWithTiles } from "../components/circle";
import "@/app/style/phase_one.css";
import { useSocket } from "../socket-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { PlayerDeskContext } from "./phase_two";
import { PlayerDesk } from "../components/player_desk";
import { Tile } from "../components/tile";
import { ColorKey } from "../../shared/types";

export function PhaseOne() {
    const { state, sendGameAction } = useSocket();
    const [shouldShowDesk, setShouldShowDesk] = useState<boolean>(false);

    const outerRef = useRef<HTMLDivElement>(null);
    const [parentWidth, setParentWidth] = useState(0);

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

    if (!state.gameState) {
        return <div className="phase-one">Loading game...</div>;
    }

    const handleKeyDown = (ev: KeyboardEvent) => {
        if (shouldShowDesk && ev.key === "Escape") {
            setShouldShowDesk(false);
        }
    };
    window.addEventListener("keydown", handleKeyDown);

    const isMyTurn = state.gameState.currentPlayer === state.playerNumber;
    const myIndex = state.playerNumber - 1;
    const opponentIndex = state.playerNumber === 1 ? 1 : 0;

    return (
        <div className="phase-one">
            <div className="tiles-box">
                <p className="tiles-box-title">{state.gameState.players[myIndex].name}</p>
                <div className="picked-tiles">
                    {state.gameState.players[myIndex].pickedTiles.map((color, i) => (
                        <span
                            key={i}
                            className="box-tile"
                            style={{ backgroundColor: COLORS[color] }}
                        />
                    ))}
                    {state.gameState.players[myIndex].pickedTiles.length === 0 && (
                        <span className="no-tiles">No tiles picked yet</span>
                    )}
                </div>
            </div>

            <div className="game-board">
                <div
                    className="jokers-order"
                    style={{
                        paddingLeft: `${jokerPaddingLeft}px`,
                        gap: `${jokerGap}px`,
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
                                className={`round-number ${state.gameState.round === idx + 1 ? "active" : ""}`}
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
                <button
                    className="check-desk"
                    style={{ marginTop: "10px" }}
                    onClick={() => setShouldShowDesk(true)}
                >
                    Check desk
                </button>
                <div className="circles">
                    {state.gameState.factories.map((factoryTiles, idx) => (
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
                    {state.gameState.centerPool.map((color, i) => (
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
                <p className="tiles-box-title">{state.gameState.players[opponentIndex].name}</p>
                <div className="picked-tiles">
                    {state.gameState.players[opponentIndex].pickedTiles.map((color, i) => (
                        <span
                            key={i}
                            className="box-tile"
                            style={{ backgroundColor: COLORS[color] }}
                        />
                    ))}
                    {state.gameState.players[opponentIndex].pickedTiles.length === 0 && (
                        <span className="no-tiles">No tiles picked yet</span>
                    )}
                </div>
            </div>
            {shouldShowDesk && (
                <div className="desk-popover">
                    <div className="pointer-events-none">
                        <PlayerDeskContext.Provider value={state.playerNumber}>
                            <PlayerDesk />
                        </PlayerDeskContext.Provider>
                    </div>
                    <button className="close-popover" onClick={() => setShouldShowDesk(false)}>
                        x
                    </button>
                </div>
            )}
        </div>
    );
}
