import "@/app/style/notification.css";
import { useEffect, useState } from "react";
import { COLORS, NOTIFICATION_DURATION } from "../../shared/consts";
import { ColorKey, NotificationType } from "../../shared/types";

const EXIT_ANIMATION_DURATION = 350;

function formatMessage(message: string) {
    return (
        <>
            {message.split(" ").map((word, id) =>
                word in COLORS ? (
                    <span
                        className={`box-tile my-0.5`}
                        style={{
                            backgroundColor: COLORS[word as ColorKey],
                        }}
                        key={id}
                    />
                ) : (
                    `${word} `
                ),
            )}
        </>
    );
}

function NotificationToast({
    notification,
}: {
    notification: NotificationType;
}) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const exitTimer = setTimeout(() => {
            setExiting(true);
        }, NOTIFICATION_DURATION - EXIT_ANIMATION_DURATION);

        return () => clearTimeout(exitTimer);
    }, []);

    return (
        <div
            className={`notification-toast ${notification.type} ${exiting ? "exiting" : ""}`}
            style={
                {
                    "--notif-duration": `${NOTIFICATION_DURATION}ms`,
                } as React.CSSProperties
            }
        >
            <div className="notification-grain" />

            <div className="notification-body">
                <span className="notification-text">
                    {formatMessage(notification.message)}
                </span>
            </div>
        </div>
    );
}

export function NotificationContainer({
    notifications,
}: {
    notifications: NotificationType[];
}) {
    return (
        <div className="notification-container">
            {notifications.map((notification) => (
                <NotificationToast
                    notification={notification}
                    key={notification.id}
                />
            ))}
        </div>
    );
}
