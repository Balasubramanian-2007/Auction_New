import pool from "../config/db.js";
import cron from 'node-cron';
import { notificationQueue } from '../queues/notificationQueue.js';

const checkSchedular = cron.schedule('* * * * *', async () => {
    const now = new Date();
    try {
        await pool.query("UPDATE auction SET status='LIVE' WHERE start_time <= $1 AND status='UPCOMING'", [now]);
        await pool.query("UPDATE auction SET status='COMPLETED' WHERE status='LIVE' AND end_time <= $1", [now]);
    } catch (err) {
        console.error("Error in status check cron:", err);
    }
});

const watchListStatusUpdate = cron.schedule('*/5 * * * *', async () => {
    console.log("Watchlist Cron triggered: Enqueuing job to BullMQ...");
    await notificationQueue.add('processWatchlist', { enqueuedAt: new Date() });
});

export { checkSchedular, watchListStatusUpdate };