import { COLORS } from "../consts";
import { Snowflake } from "./snowflake";
import "./player_desk.css";
import { Scoreline } from "./scoreline";

interface deskProps {
    playerName?: string;
    isOwn?: boolean;
}

export function PlayerDesk({ playerName, isOwn = false }: deskProps) {
    return (
        <div className="desk flex flex-col items-center h-full mt-[200] gap-10 text-center mx-28">
            <p className="player-name font-bold text-2xl">
                {isOwn ? "Your" : playerName + "'s"} Desk
            </p>
            <Scoreline
                range={{ start: 0, end: 160, step: 10 }}
                currentScore={100}
            />
            <Scoreline
                range={{ start: 0, end: 9, step: 1 }}
                currentScore={100}
            />
            <div className="snowflakes mt-12">
                {(Object.keys(COLORS) as Array<keyof typeof COLORS>).map(
                    (color) => (
                        <Snowflake color={color} key={color} />
                    ),
                )}
            </div>
        </div>
    );
}
