import { createApp } from './app';
import { config } from './config';
import { testConnection } from './database';
import { testRedisConnection } from './database/redis';

async function startServer() {
  try {
    // Test database connections
    console.log('Testing database connections...');
    const dbConnected = await testConnection();
    const redisConnected = await testRedisConnection();

    if (!dbConnected) {
      console.error('Failed to connect to PostgreSQL database');
      process.exit(1);
    }

    if (!redisConnected) {
      console.error('Failed to connect to Redis');
      process.exit(1);
    }

    // Create and start Express app
    const app = createApp();
    
    app.listen(config.server.port, config.server.host, () => {
      console.log(`
🚀 OpenStays API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment: ${config.server.nodeEnv}
🌐 Server: http://${config.server.host}:${config.server.port}
📚 API Base: http://${config.server.host}:${config.server.port}/v1
💾 Database: ${config.database.host}:${config.database.port}/${config.database.name}
📦 Redis: ${config.redis.host}:${config.redis.port}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();