import "@/app/static/style/base.css";
import { BaseSnowflakes } from "./base_snowflakes";
import { COLORS, JOKERS } from "../consts";
import { Tile } from "./tile";
import { ColorKey } from "../utils/types";
import { useSocket } from "../utils/socket-context";

export function Base() {
    const { gameState } = useSocket();

    return (
        <div className="base">
            <div className="jokers-order">
                {JOKERS.map((color, idx) => (
                    <div className="base-round" key={color}>
                        <Tile
                            color={COLORS[color as ColorKey]}
                            transformAngle={0}
                            size={30}
                        />
                        <p className={`round-number ${gameState.round === idx + 1 ? "active" : ""}`} style={{ transform: "translate(-14px)" }}>
                            {idx + 1}
                        </p>
                    </div>
                ))}
            </div>
            <BaseSnowflakes />
        </div>
    );
}
