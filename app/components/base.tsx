"use client";
import "@/app/static/style/base.css";
import { COLORS, JOKERS } from "../consts";
import { Tile } from "./tile";
import { ColorKey } from "../utils/types";
import { useSocket } from "../utils/socket-context";
import { useState, useRef, useEffect, useMemo } from "react";

function getAngle(i: number, j: number): number {
    return Math.PI * (-1 / 3 + i / 1.5 + (2 * j) / 5);
}

const DEFAULT_BASE_WIDTH = 400;
const DEFAULT_JOKER_TILE_SIZE = 30;
const DEFAULT_BASE_TILE_SIZE = 40;
const DEFAULT_JOKER_PADDING_LEFT = 35;
const DEFAULT_JOKER_GAP = 10;
const DEFAULT_ROUND_TRANSLATE_X = -14;

const DEFAULT_SNOWFLAKE_MARGINS = [
    { top: 100, right: 0, bottom: 0, left: 100 },
    { top: 220, right: 0, bottom: 300, left: 170 },
];

export function Base() {
    const { gameState, sendGameAction, playerNumber } = useSocket();
    const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
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
    const baseTileSize = Math.round(DEFAULT_BASE_TILE_SIZE * scale);
    const jokerPaddingLeft = Math.round(DEFAULT_JOKER_PADDING_LEFT * scale);
    const jokerGap = Math.round(DEFAULT_JOKER_GAP * scale);
    const roundTranslateX = Math.round(DEFAULT_ROUND_TRANSLATE_X * scale);

    const snowflakeMargins = DEFAULT_SNOWFLAKE_MARGINS.map((m) => ({
        top: Math.round(m.top * scale),
        right: Math.round(m.right * scale),
        bottom: Math.round(m.bottom * scale),
        left: Math.round(m.left * scale),
    }));

    const numberOfTilesToTake =
        gameState.players[playerNumber - 1].canTakeBaseTiles;

    const onConfirm = () => {
        sendGameAction({
            type: "base-pick",
            selectedTiles,
        });
        setSelectedTiles([]);
    };

    const onTileSelect = (idx1: number, idx2: number, color: string) => {
        const newTile = `${idx1}_${idx2}_${color}`;
        if (selectedTiles.includes(newTile)) {
            const newSelectedTiles = selectedTiles.filter(
                (tile) => tile !== newTile,
            );
            setSelectedTiles(newSelectedTiles);
        } else if (selectedTiles.length < numberOfTilesToTake) {
            setSelectedTiles([...selectedTiles, newTile]);
        }
    };

    return (
        <div
            ref={outerRef}
            className={`base ${numberOfTilesToTake ? "active" : ""}`}
        >
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
            <hr className="jokers-divider" />
            {numberOfTilesToTake > 0 && (
                <div className="base-message">
                    <p>You can take {numberOfTilesToTake} tiles!</p>
                    <span
                        className={`checkmark ${selectedTiles.length < numberOfTilesToTake ? "disabled" : ""}`}
                        onClick={
                            selectedTiles.length >= numberOfTilesToTake
                                ? onConfirm
                                : undefined
                        }
                    />
                </div>
            )}
            {gameState.baseTiles.map((snowflake, i) => {
                const margin = snowflakeMargins[i] || snowflakeMargins[0];
                return (
                    <div
                        className={`base-snowflake base-snowflake-${i}`}
                        key={i}
                        style={{
                            margin: `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`,
                        }}
                    >
                        {snowflake.map((tile, idx) => (
                            <Tile
                                color={COLORS[tile]}
                                transformAngle={getAngle(i, idx)}
                                onClickHandler={() =>
                                    onTileSelect(i, idx, tile)
                                }
                                isCovered={selectedTiles.includes(
                                    `${i}_${idx}_${tile}`,
                                )}
                                size={baseTileSize}
                                key={idx}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
}