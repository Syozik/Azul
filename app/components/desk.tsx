import { COLORS } from "../consts";
import { Star } from "./star";

export function Desk() {
    return (
        <div className="desk">
            {(Object.keys(COLORS)).map(
                (color) => (
                    <Star color={color} key={color} />
                ),
            )}
        </div>
    );
}
