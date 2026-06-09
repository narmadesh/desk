import { io, Socket } from "socket.io-client";

type AuthenticatedSocketClient = Socket & {
  auth?: {
    token?: string;
  };
};

let socket: AuthenticatedSocketClient | null = null;

export const connectSocket = (token: string) => {
  if (socket && socket.auth?.token !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL || undefined;
    console.debug("Socket URL:", socketUrl);

    socket = io(socketUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      auth: { token },
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connect error:", error);
    });

    // socket.on("message:new", (msg: any) => console.log("New message:", msg));
  }

  return socket;
};

// export const joinGroup = (groupId: string) => socket?.emit("group:join", groupId);
export const sendMessage = (data: any) => socket?.emit("message:send", data);
export const sendGroupMessage = (data: any) => socket?.emit("group-message:send", data);
export const getMessageCount = () => socket?.emit("message:count");
export const getGroupMessageCount = () => socket?.emit("group-message:count");
export const sendReaction = (data: { messageId: string; emoji: string; to: string }) =>
  socket?.emit("message:reaction", data);
export const sendGroupReaction = (data: { messageId: string; emoji: string; to: string }) =>
  socket?.emit("group-message:reaction", data);
export const sendTyping = (otherUserId: string) =>
  socket?.emit("typing", otherUserId);
export const sendStopTyping = (otherUserId: string) =>
  socket?.emit("stop_typing", otherUserId);
export const sendReadReceipt = (payload: { otherUserId: string; tempId?: string }) =>
  socket?.emit("message:read", payload);
// export const sendCallOffer = (payload: CallPayload) => socket?.emit("call:offer", payload);
// export const sendCallAnswer = (payload: CallPayload) => socket?.emit("call:answer", payload);
// export const sendIceCandidate = (payload: CallPayload) => socket?.emit("call:ice-candidate", payload);
export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
