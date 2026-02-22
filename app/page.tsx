import { PlayerDesk } from "./components/desk";

export default function Home() {
    return (
        <div className="flex h-screen items-center justify-between font-sans text-[#2c2a26]">
            <PlayerDesk isOwn={true} />
            <div className="h-3/4 w-px bg-gray-500" />
            <PlayerDesk playerName="Kristina" />
        </div>
    );
}
