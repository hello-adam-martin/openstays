import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { redis } from '../database/redis';
import { config } from '../config';
import { AuthRequest } from './auth';

interface RateLimitStore {
  increment: (key: string) => Promise<{ totalHits: number; resetTime?: Date }>;
  decrement: (key: string) => Promise<void>;
  resetKey: (key: string) => Promise<void>;
}

class RedisStore implements RateLimitStore {
  private windowMs: number;
  
  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime?: Date }> {
    const multi = redis.multi();
    const keyExpiry = Math.ceil(this.windowMs / 1000);
    
    multi.incr(key);
    multi.expire(key, keyExpiry);
    
    const results = await multi.exec();
    
    if (!results) {
      throw new Error('Redis transaction failed');
    }
    
    const totalHits = results[0][1] as number;
    const ttl = await redis.ttl(key);
    const resetTime = new Date(Date.now() + (ttl * 1000));
    
    return { totalHits, resetTime };
  }

  async decrement(key: string): Promise<void> {
    await redis.decr(key);
  }

  async resetKey(key: string): Promise<void> {
    await redis.del(key);
  }
}

const redisStore = new RedisStore(config.rateLimit.windowMs);

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: async (req: AuthRequest) => {
    if (req.auth?.apiKeyId) {
      const customLimit = await redis.get(`rate_limit:${req.auth.apiKeyId}`);
      if (customLimit) {
        return parseInt(customLimit, 10);
      }
    }
    return config.rateLimit.maxRequests;
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore as any,
  keyGenerator: (req: AuthRequest) => {
    if (req.auth?.apiKeyId) {
      return `rate_limit:api_key:${req.auth.apiKeyId}`;
    }
    if (req.auth?.clientId) {
      return `rate_limit:oauth:${req.auth.clientId}`;
    }
    return `rate_limit:ip:${req.ip}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      request_id: req.header('X-Request-ID'),
    });
  },
  skip: (_req: Request) => {
    return config.server.nodeEnv === 'test';
  },
});

export function setRateLimitHeaders(
  _req: Request,
  res: Response,
  next: () => void
): void {
  const limit = res.getHeader('X-RateLimit-Limit');
  const remaining = res.getHeader('X-RateLimit-Remaining');
  const reset = res.getHeader('X-RateLimit-Reset');
  
  if (limit) res.setHeader('X-RateLimit-Limit', limit);
  if (remaining) res.setHeader('X-RateLimit-Remaining', remaining);
  if (reset) res.setHeader('X-RateLimit-Reset', reset);
  
  next();
}