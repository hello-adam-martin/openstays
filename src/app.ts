import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config';
import { authenticateApiKey, authenticateOAuth } from './middleware/auth';
import { rateLimiter, setRateLimitHeaders } from './middleware/rateLimiter';
import { validate, schemas } from './middleware/validation';
import * as propertyController from './controllers/propertyController';

export function createApp(): Express {
  const app = express();

  // Basic middleware
  app.use(helmet());
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (config.server.nodeEnv !== 'test') {
    app.use(morgan('combined'));
  }

  // Request ID middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.headers['x-request-id'] = req.header('X-Request-ID') || 
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.headers['x-request-id']);
    next();
  });

  // Health check endpoints
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/ready', async (_req: Request, res: Response) => {
    try {
      const { testConnection } = await import('./database');
      const { testRedisConnection } = await import('./database/redis');
      
      const dbOk = await testConnection();
      const redisOk = await testRedisConnection();
      
      if (dbOk && redisOk) {
        res.json({ 
          status: 'ready', 
          services: { database: 'ok', redis: 'ok' },
          timestamp: new Date().toISOString() 
        });
      } else {
        res.status(503).json({ 
          status: 'not ready', 
          services: { 
            database: dbOk ? 'ok' : 'error', 
            redis: redisOk ? 'ok' : 'error' 
          },
          timestamp: new Date().toISOString() 
        });
      }
    } catch (error) {
      res.status(503).json({ 
        status: 'error', 
        message: 'Failed to check service readiness',
        timestamp: new Date().toISOString() 
      });
    }
  });

  // API routes with authentication and rate limiting
  const apiRouter = express.Router();

  // Apply authentication middleware
  apiRouter.use(authenticateApiKey);
  apiRouter.use(authenticateOAuth);

  // Apply rate limiting
  apiRouter.use(rateLimiter);
  apiRouter.use(setRateLimitHeaders);

  // Properties endpoints
  apiRouter.get(
    '/properties',
    validate({ 
      query: {
        ...schemas.pagination,
        ...schemas.propertyFilters,
      } 
    }),
    propertyController.listProperties
  );

  apiRouter.get(
    '/properties/:id',
    validate({
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      query: {
        type: 'object',
        properties: {
          address_masking: { type: 'boolean' },
          mask_precision: { type: 'integer', minimum: 0, maximum: 5 },
          img_w: { type: 'integer', minimum: 16, maximum: 4096 },
          img_h: { type: 'integer', minimum: 16, maximum: 4096 },
          img_fit: { enum: ['cover', 'contain', 'fill', 'inside', 'outside'] },
          img_q: { type: 'integer', minimum: 1, maximum: 100 },
          img_dpr: { type: 'number', minimum: 0.5, maximum: 4 },
        },
      },
    }),
    propertyController.getPropertyById
  );

  // Mount API router
  app.use('/v1', apiRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      request_id: req.header('X-Request-ID'),
    });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      request_id: req.header('X-Request-ID'),
    });
  });

  return app;
}