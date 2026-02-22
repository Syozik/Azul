import "./scoreline.css";

interface ScorelineProps {
    range: { start: number; end: number; step: number };
    currentScore: number;
}

export function Scoreline({ range, currentScore }: ScorelineProps) {
    const scores = [];
    for (let i = range.start; i <= range.end; i += range.step) {
        scores.push(i);
    }
    return (
        <div className="scoreline flex justify-center">
            {scores.map((score) => {
                const isCurrent =
                    (currentScore - (currentScore % range.step)) %
                        (range.end + range.step) ===
                    score;
                return (
                    <span
                        className={`score-cell ${
                            score < 100 ? "min-w-7" : "min-w-8"
                        } ${isCurrent ? "current_score" : ""}`}
                        key={score}
                    >
                        {score}
                    </span>
                );
            })}
        </div>
    );
}
