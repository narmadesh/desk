"use client"
import { SessionProvider } from "@/context/SessionContext";
import { SocketProvider } from "@/context/SocketContext";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <SocketProvider>{children}</SocketProvider>
        </SessionProvider>
    )
}