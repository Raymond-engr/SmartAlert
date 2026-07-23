import { Server, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import tokenService, { TokenPayload } from '../services/token.service';
import { corsOptions } from '../utils/securityConfig';
import logger from '../utils/logger';

/**
 * Real-Time Notification Transport
 *
 * Socket.io runs on the same HTTP server as Express (Chapter Three), so a
 * student holds one connection for the whole session and the API and the
 * WebSocket share an origin, a port, and a JWT.
 *
 * The `io` instance is held here rather than exported from `index.ts` so that
 * a controller can broadcast without importing the entry point and creating a
 * circular import.
 */

/**
 * userId -> the socket ids that user currently has open.
 *
 * A Set rather than a single id because a student may have the dashboard open
 * in more than one tab; with a single id the older tab would silently stop
 * receiving alerts and the first tab to disconnect would unmap the others.
 */
export const userSocketMap = new Map<string, Set<string>>();

let io: Server | null = null;

/**
 * Attaches Socket.io to the HTTP server, authenticates every handshake with
 * the same access token the REST API uses, and maintains the user map.
 */
export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: corsOptions,
    path: '/socket.io',
  });

  // Handshake authentication: an unauthenticated socket is never connected,
  // so no event can reach a client we cannot identify.
  io.use(async (socket: Socket, next) => {
    try {
      const token: string | undefined =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Access token required'));
      }

      const payload: TokenPayload = await tokenService.verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch (error) {
      logger.warn(
        `Socket handshake rejected: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId: string = socket.data.userId;

    const sockets = userSocketMap.get(userId) ?? new Set<string>();
    sockets.add(socket.id);
    userSocketMap.set(userId, sockets);

    logger.info(
      `Socket connected: user ${userId} (${socket.id}), ${userSocketMap.size} user(s) online`
    );

    socket.on('disconnect', () => {
      const open = userSocketMap.get(userId);
      if (!open) return;

      open.delete(socket.id);
      if (open.size === 0) {
        userSocketMap.delete(userId);
      }

      logger.info(
        `Socket disconnected: user ${userId} (${socket.id}), ${userSocketMap.size} user(s) online`
      );
    });
  });

  logger.info('Socket.io server initialised');
  return io;
};

/**
 * The live Socket.io instance. Throws rather than returning null so a
 * controller cannot silently skip the real-time channel.
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialised');
  }
  return io;
};

/**
 * Emits an event to every socket a user currently has open.
 * Returns true when the user was online and the event was delivered.
 */
export const emitToUser = (
  userId: string,
  event: string,
  payload: unknown
): boolean => {
  const sockets = userSocketMap.get(userId);
  if (!sockets || sockets.size === 0 || !io) return false;

  sockets.forEach((socketId) => io?.to(socketId).emit(event, payload));
  return true;
};

/**
 * Number of users (not sockets) currently connected. Used by the load test
 * and the admin dashboard.
 */
export const getOnlineUserCount = (): number => userSocketMap.size;
