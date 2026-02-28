"use client";
import { CIRCLE_POSITIONS, ColorKey } from "../consts";
import { CircleWithTiles } from "../components/circle";
import "./phase_one.css";

const onClickHandler = () => {};

export function PhaseOne() {
    const colors: Array<Array<ColorKey>> = [
        ["RED", "RED", "GREEN", "ORANGE"],
        ["RED", "RED", "GREEN", "ORANGE"],
        ["RED", "RED", "GREEN", "ORANGE"],
        ["RED", "RED", "GREEN", "ORANGE"],
        ["RED", "RED", "GREEN", "ORANGE"],
    ];


    return (
        <div className="phase-one">
            <div className="tiles-box">
                <p className="tiles-box-title">Your Tiles</p>
            </div>

            <div className="game-board">
                {colors.map((color, idx) => (
                    <CircleWithTiles
                        colors={color}
                        onClickHandler={onClickHandler}
                        position={CIRCLE_POSITIONS[idx]}
                        key={idx}
                    />
                ))}

                <div className="center-pool">
                </div>
            </div>

            <div className="tiles-box">
                <p className="tiles-box-title">Opponent</p>
            </div>
        </div>
    );
}
