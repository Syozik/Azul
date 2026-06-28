import { useState } from "react";
import { useSocket } from "../socket-context";
import "@/app/style/name_prompt.css";

export function NamePrompt({ callback }: { callback?: () => void }) {
    const { state, changePlayerName } = useSocket();
    const [input, setInput] = useState<string>("");

    if (state.playerName !== null) return;

    const onSave = () => {
        const trimmedInput = input.trim();
        if (!trimmedInput) return;
        changePlayerName(trimmedInput);
        if (callback) callback();
    };

    return (
        <div
            className="name-prompt-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="name-prompt-title"
        >
            <div className="name-prompt-popover">
                <h2 id="name-prompt-title" className="name-prompt-title">
                    Please add your name.
                </h2>
                <input
                    className="name-prompt-input"
                    value={input}
                    onChange={(ev) => setInput(ev.target.value)}
                    onKeyDown={(ev) => {
                        if (ev.key === "Enter") onSave();
                    }}
                    placeholder="Your name"
                    maxLength={24}
                />
                <button
                    className="name-prompt-save"
                    onClick={onSave}
                    disabled={!input.trim().length}
                >
                    Save
                </button>
            </div>
        </div>
    );
}
