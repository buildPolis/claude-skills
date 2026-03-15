import { createDatabase } from './db/sqlite.js';
import { initSchema } from './db/schema.js';
import { loadConfig } from './config.js';
import { createApiServer } from './api/server.js';

async function main() {
  const config = loadConfig();
  const db = createDatabase(config.dbPath);
  initSchema(db);

  const apiServer = createApiServer({
    db,
    jwtSecret: config.auth.jwtSecret,
    jwtExpiresIn: config.auth.jwtExpiresIn,
    port: config.auth.apiPort,
  });

  await new Promise<void>((resolve) => {
    apiServer.on('listening', () => {
      console.log(`API server listening on port ${config.auth.apiPort}`);
      resolve();
    });
  });

  const shutdown = () => {
    console.log('Shutting down...');
    apiServer.close(() => {
      console.log('API server closed');
      db.close();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
