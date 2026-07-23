import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket) {
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_API_URL, {
    path: "/socket.io",
    auth: { token },
    withCredentials: true,
  });

  return socket;
}

export function closeSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
