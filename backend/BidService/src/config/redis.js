import Redis from 'ioredis';

// Create a new Redis client connection
// If running locally, default host is 127.0.0.1 and port is 6379
const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    // password: process.env.REDIS_PASSWORD || undefined
});

redis.on('connect', () => {
    console.log('Connected to Redis successfully');
});

redis.on('error', (err) => {
    console.error('Redis Connection Error:', err);
});

export default redis;