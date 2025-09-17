import config from './config.js';
import logger from './logger.js';
import storage from './storage.js';
import createApp from './server.js';

const start = async () => {
  await storage.init();
  const app = createApp();

  app.listen(config.port, () => {
    logger.info({ port: config.port }, 'MCP user factory listening');
  });
};

start().catch((error) => {
  logger.error({ err: error }, 'Failed to start application');
  process.exit(1);
});
