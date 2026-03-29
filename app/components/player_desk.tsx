"use client";
import { COLORS, getSnowflakeBoardSize, DEFAULT_TILE_SIZE } from "../consts";
import { Snowflake } from "./snowflake";
import "@/app/static/style/player_desk.css";
import { Scoreline } from "./scoreline";
import { useSocket } from "../utils/socket-context";
import { groupTilesByColor } from "../utils/helpers";
import { useState, useRef, useEffect, useMemo } from "react";
import { TileColor } from "../utils/types";
import { usePlayerDesk } from "../game/phase_two";

const DEFAULT_BOARD_SIZE = getSnowflakeBoardSize(DEFAULT_TILE_SIZE);

export function PlayerDesk() {
    const { gameState, playerNumber, sendGameAction } = useSocket();
    const player = usePlayerDesk();
    const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        const observer = new ResizeObserver(([entry]) => {
            const width = entry.contentRect.width;
            if (width > 0) {
                setContainerWidth(width);
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Compute tileSize so the board fits the available width, capped at DEFAULT_TILE_SIZE
    const MIN_TILE_SIZE = 25;

    const tileSize = useMemo(() => {
        if (containerWidth <= 0) return DEFAULT_TILE_SIZE;
        // Leave a small padding (10px border total from the border styling)
        const available = containerWidth - 10;
        const scale = available / DEFAULT_BOARD_SIZE;
        if (scale >= 1) return DEFAULT_TILE_SIZE;
        return Math.max(MIN_TILE_SIZE, Math.floor(DEFAULT_TILE_SIZE * scale));
    }, [containerWidth]);

    const boardSize = useMemo(() => getSnowflakeBoardSize(tileSize), [tileSize]);

    const playerState = gameState.players[player - 1];
    const playerTiles = groupTilesByColor(playerState.pickedTiles);
    const isOwner = playerNumber === player;
    const isMyTurn = playerNumber === gameState.currentPlayer;

    const onSnowflakeSelect = (tile: TileColor, points: number) => {
        if (
            !isOwner ||
            !isMyTurn ||
            playerState.coveredTiles[tile][points - 1] ||
            selectedTiles.length < points
        ) {
            return;
        }
        const usedTiles = selectedTiles.map(
            (tile) => tile.split("_")[0] as TileColor,
        );
        sendGameAction({
            type: "cover",
            color: tile,
            points,
            usedTiles,
        });
        setSelectedTiles([]);
        return;
    };

    const onTileSelect = (tile: TileColor, idx: number) => {
        if (!isOwner || !isMyTurn) {
            return;
        }
        const formattedTile = `${tile}_${idx}`;
        if (selectedTiles.includes(formattedTile)) {
            setSelectedTiles(selectedTiles.filter((el) => el != formattedTile));
        } else {
            setSelectedTiles([...selectedTiles, formattedTile]);
        }
    };

    return (
        <div
            className={`${isOwner ? "own-desk" : ""} desk flex flex-col items-center h-auto md:h-full mt-2 md:mt-12.5 gap-3 md:gap-10 text-center mx-1 md:mx-28`}
        >
            <p className="player-name font-bold text-lg md:text-2xl">
                {isOwner ? "Your" : "Opponent's"} Desk
            </p>
            <Scoreline
                range={{ start: 0, end: 160, step: 10 }}
                currentScore={playerState.score}
            />
            <Scoreline
                range={{ start: 0, end: 9, step: 1 }}
                currentScore={playerState.score}
            />
            <div ref={wrapperRef} className="snowflakes-wrapper">
                <div
                    className="snowflakes"
                    style={{
                        width: `${boardSize}px`,
                        height: `${boardSize}px`,
                    }}
                >
                    {(Object.keys(COLORS) as Array<keyof typeof COLORS>).map(
                        (color) => (
                            <Snowflake
                                color={color}
                                key={color}
                                tileSize={tileSize}
                                onTileSelect={onSnowflakeSelect}
                            />
                        ),
                    )}
                </div>
            </div>
            <div className="available-tiles flex flex-row flex-wrap gap-2 md:gap-5 justify-center">
                {playerTiles.map((group) => (
                    <div key={group[0]} className="groupedTiles">
                        {group.map((tile, idx) => (
                            <span
                                className={`box-tile ms-0.5 ${selectedTiles.includes(`${tile}_${idx}`) ? " selected" : ""}`}
                                style={{
                                    backgroundColor: COLORS[tile as TileColor],
                                }}
                                key={idx}
                                onClick={() => onTileSelect(tile, idx)}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
