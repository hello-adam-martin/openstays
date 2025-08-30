import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { queryOne } from '../database';
import { config } from '../config';

export interface AuthRequest extends Request {
  auth?: {
    type: 'api_key' | 'oauth';
    clientId?: string;
    scopes?: string[];
    apiKeyId?: string;
  };
}

export async function authenticateApiKey(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      next();
      return;
    }

    if (!apiKey.startsWith(config.auth.apiKeyPrefix)) {
      return res.status(401).json({
        code: 'INVALID_API_KEY',
        message: 'Invalid API key format',
        request_id: req.header('X-Request-ID'),
      });
    }

    const keyHash = await bcrypt.hash(apiKey, 10);
    
    const dbKey = await queryOne<{
      id: string;
      scopes: string[];
      rate_limit: number;
    }>(
      `SELECT id, scopes, rate_limit 
       FROM api_keys 
       WHERE key_hash = $1 
         AND active = true 
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [keyHash]
    );

    if (!dbKey) {
      return res.status(401).json({
        code: 'INVALID_API_KEY',
        message: 'Invalid or expired API key',
        request_id: req.header('X-Request-ID'),
      });
    }

    await queryOne(
      'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
      [dbKey.id]
    );

    req.auth = {
      type: 'api_key',
      apiKeyId: dbKey.id,
      scopes: dbKey.scopes,
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({
      code: 'AUTH_ERROR',
      message: 'Authentication failed',
      request_id: req.header('X-Request-ID'),
    });
  }
}

export async function authenticateOAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    const dbToken = await queryOne<{
      client_id: string;
      scopes: string[];
      expires_at: Date;
    }>(
      `SELECT client_id, scopes, expires_at 
       FROM oauth_tokens 
       WHERE token = $1`,
      [token]
    );

    if (!dbToken) {
      return res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid access token',
        request_id: req.header('X-Request-ID'),
      });
    }

    if (new Date(dbToken.expires_at) < new Date()) {
      return res.status(401).json({
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired',
        request_id: req.header('X-Request-ID'),
      });
    }

    req.auth = {
      type: 'oauth',
      clientId: dbToken.client_id,
      scopes: dbToken.scopes,
    };

    next();
  } catch (error) {
    console.error('OAuth authentication error:', error);
    res.status(500).json({
      code: 'AUTH_ERROR',
      message: 'Authentication failed',
      request_id: req.header('X-Request-ID'),
    });
  }
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void | Response {
  if (!req.auth) {
    return res.status(401).json({
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication is required for this endpoint',
      request_id: req.header('X-Request-ID'),
    });
  }
  next();
}

export function requireScopes(...requiredScopes: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.auth) {
      return res.status(401).json({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required for this endpoint',
        request_id: req.header('X-Request-ID'),
      });
    }

    const userScopes = req.auth.scopes || [];
    const hasRequiredScopes = requiredScopes.every(scope => 
      userScopes.includes(scope)
    );

    if (!hasRequiredScopes) {
      return res.status(403).json({
        code: 'INSUFFICIENT_SCOPE',
        message: `Required scope(s): ${requiredScopes.join(', ')}`,
        request_id: req.header('X-Request-ID'),
      });
    }

    next();
  };
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 10);
}

export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

export function generateApiKey(): string {
  const randomBytes = require('crypto').randomBytes(32).toString('hex');
  return `${config.auth.apiKeyPrefix}${randomBytes}`;
}