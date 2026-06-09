"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { connectSocket, disconnectSocket } from "@/utils/socket";
import { getToken } from "@/utils/auth";

const SocketContext = createContext<any>(null);

export const SocketProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [socket, setSocket] = useState<any>(null);
    useEffect(() => {
        const token = getToken();
        if (!token) return;

        const s = connectSocket(token);

        if (!s.connected) {
            s.connect();
        }

        setSocket(s);

        return () => {
            disconnectSocket();
            setSocket(null);
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);