import { io, type Socket } from "socket.io-client";
import { BASE_URL } from "@/lib/constants";

let socket: Socket | null = null;

const getSocketServerUrl = () => {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return new URL(BASE_URL).origin;
  } catch {
    return window.location.origin;
  }
};

export const getSocketClient = () => {
  if (!socket) {
    socket = io(getSocketServerUrl(), {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
};
