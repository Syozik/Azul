import "@/app/static/style/base.css";
import { COLORS, JOKERS } from "../consts";
import { Tile } from "./tile";
import { ColorKey } from "../utils/types";
import { useSocket } from "../utils/socket-context";
import { useState } from "react";

function getAngle(i: number, j: number): number {
    return Math.PI * (-1 / 3 + i / 1.5 + (2 * j) / 5);
}

export function Base() {
    const { gameState, sendGameAction, playerNumber } = useSocket();
    const [selectedTiles, setSelectedTiles] = useState<string[]>([]);

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
        <div className={`base ${numberOfTilesToTake ? "active" : ""}`}>
            <div className="jokers-order">
                {JOKERS.map((color, idx) => (
                    <div className="base-round" key={color}>
                        <Tile
                            color={COLORS[color as ColorKey]}
                            transformAngle={0}
                            size={30}
                        />
                        <p
                            className={`round-number ${gameState.round === idx + 1 ? "active" : ""}`}
                            style={{ transform: "translate(-14px)" }}
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
            {gameState.baseTiles.map((snowflake, i) => (
                <div className={`base-snowflake base-snowflake-${i}`} key={i}>
                    {snowflake.map((tile, idx) => (
                        <Tile
                            color={COLORS[tile]}
                            transformAngle={getAngle(i, idx)}
                            onClickHandler={() => onTileSelect(i, idx, tile)}
                            isCovered={selectedTiles.includes(
                                `${i}_${idx}_${tile}`,
                            )}
                            size={40}
                            key={idx}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
