import { io } from "socket.io-client";

let socketInstance = null;

/**
 * Returns or initializes the singleton Socket.IO client.
 * Connects using HTTP-only cookie credentials.
 *
 * @returns {import("socket.io-client").Socket}
 */
export function getSocket() {
  if (!socketInstance) {
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

    socketInstance = io(serverUrl, {
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("Socket connection warning:", err.message);
    });
  }

  return socketInstance;
}

/**
 * Ensures the socket is actively connected.
 */
export function connectSocket() {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

/**
 * Disconnects and tears down the singleton socket instance.
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
