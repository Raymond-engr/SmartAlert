import http from 'http';
import type { AddressInfo } from 'net';
import app from './app';
import connectDB from './db/database';
import { initSocket } from './sockets';
import emailService from './services/email.service';
import logger from './utils/logger';
import validateEnv from './utils/validateEnv';
import { seedDepartments } from './utils/departments';

validateEnv();

const PORT: number = parseInt(process.env.PORT || '4000', 10);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    // Seed the canonical departments and warm the in-memory cache before the
    // server takes traffic. A failure here must not take the process down: the
    // read functions fall back to the hard-coded seed cache, so the app stays
    // usable while the failure is investigated.
    try {
      await seedDepartments();
      logger.info('Departments seeded and cache warmed');
    } catch (error: unknown) {
      logger.error(
        'Failed to seed departments; serving from in-memory seed cache:',
        error instanceof Error ? error : String(error)
      );
    }

    // Socket.io and Express share one HTTP server (Chapter Four, 4.4.1) so a
    // student's WebSocket and REST calls hit the same origin and port.
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    // Surfaces a bad mailbox config at boot rather than at the first
    // cancellation, when it would silently break one of the two alert channels.
    await emailService.verifyConnection();

    const server = httpServer.listen(PORT, () => {
      const address = server.address();
      if (address) {
        const { port } = address as AddressInfo;
        logger.info(
          `SmartAlert server running in ${process.env.NODE_ENV} mode on port ${port}`
        );
      } else {
        logger.error(
          'Could not determine server address. The server may not be listening correctly.'
        );
      }
    });
  } catch (error: unknown) {
    logger.error(
      'Failed to start server:',
      error instanceof Error ? error : String(error)
    );
    process.exit(1);
  }
};

startServer();
