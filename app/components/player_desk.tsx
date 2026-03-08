"use client";
import { COLORS } from "../consts";
import { Snowflake } from "./snowflake";
import "@/app/static/style/player_desk.css";
import { Scoreline } from "./scoreline";
import { useSocket } from "../utils/socket-context";
import { groupTilesByColor } from "../utils/helpers";
import { useState } from "react";
import { TileColor } from "../utils/types";
import { usePlayerDesk } from "../game/phase_two";

export function PlayerDesk() {
    const { gameState, playerNumber, sendGameAction } = useSocket();
    const player = usePlayerDesk();
    const [selectedTiles, setSelectedTiles] = useState<string[]>([]);

    const playerState = gameState.players[player - 1];
    const playerTiles = groupTilesByColor(playerState.pickedTiles);
    const isOwner = playerNumber === player;
    const isMyTurn = playerNumber === gameState.currentPlayer;

    const onSnowflakeSelect = (tile: TileColor, points: number) => {
        if (
            !isOwner ||
            !isMyTurn ||
            playerState.coveredTiles[tile][points-1] ||
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
            className={`${isOwner ? "own-desk" : ""} desk flex flex-col items-center h-full mt-[50] gap-10 text-center mx-28`}
        >
            <p className="player-name font-bold text-2xl">
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
            <div className="snowflakes mt-12">
                {(Object.keys(COLORS) as Array<keyof typeof COLORS>).map(
                    (color) => (
                        <Snowflake
                            color={color}
                            key={color}
                            onTileSelect={onSnowflakeSelect}
                        />
                    ),
                )}
            </div>
            <div className="available-tiles flex flex-row gap-5">
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
