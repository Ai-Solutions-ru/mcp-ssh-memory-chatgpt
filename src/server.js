import express from 'express';
import pinoHttp from 'pino-http';
import routes from './routes.js';
import logger from './logger.js';

const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));
  app.use(pinoHttp({ logger }));
  app.use(routes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (err?.name === 'ZodError') {
      logger.warn({ err }, 'Validation error');
      res.status(400).json({ error: 'Invalid request payload', details: err.issues });
      return;
    }

    const status = err?.statusCode ?? 500;
    const response = {
      error: err?.message || 'Internal Server Error'
    };
    if (err?.details) {
      response.details = err.details;
    }
    if (status >= 500) {
      logger.error({ err }, 'Unhandled error');
    } else {
      logger.warn({ err }, 'Handled error');
    }
    res.status(status).json(response);
  });

  return app;
};

export default createApp;
