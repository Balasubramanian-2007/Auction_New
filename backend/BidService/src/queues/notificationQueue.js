import { Queue } from 'bullmq';
import dotenv from 'dotenv';
dotenv.config();

export const notificationQueue = new Queue('watchlistNotificationQueue', {
    connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379
    }
});