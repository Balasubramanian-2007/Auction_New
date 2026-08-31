import { Worker } from 'bullmq';
import pool from '../config/db.js';
import { sendReportEmail } from '../services/emailsender.js';
import jwt from 'jsonwebtoken';

export const startNotificationWorker = () => {
    const worker = new Worker('watchlistNotificationQueue', async (job) => {
        console.log(`Processing BullMQ Notification Job ID: ${job.id}`);

        // Fetch completed auctions that have unnotified watchers
        const queryResult = await pool.query(`
            SELECT 
                w.user_id AS user_id,
                a.auction_id AS auction_id,
                a.title AS title,
                b.bid_amount AS winning_amount
            FROM watchlist w
            JOIN auction a ON w.auction_id = a.auction_id
            LEFT JOIN LATERAL (
                SELECT bid_amount 
                FROM bids 
                WHERE auction_id = a.auction_id AND bidstatus = 'ACC'
                ORDER BY bid_amount DESC 
                LIMIT 1
            ) b ON true
            WHERE a.status = 'COMPLETED' AND w.notified = false
        `);

        if (queryResult.rows.length === 0) {
            console.log("No pending watchlist notifications.");
            return;
        }

        const notifications = queryResult.rows;
        const userIds = [...new Set(notifications.map(n => n.user_id))];

        // Generate internal system token for AuthService
        const systemToken = jwt.sign(
            { userid: 'SYSTEM_SCHEDULER', role: 'admin' }, 
            process.env.JWT_SECRET || 'secretKey', 
            { expiresIn: '5m' }
        );

        // Batch call to AuthService
        const authResponse = await fetch("http://localhost:4000/getUserEmailID", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${systemToken}`
            },
            body: JSON.stringify({ ids: userIds })
        });

        const authData = await authResponse.json();
        const emailMap = new Map((authData.data || []).map(u => [u.user_id, u.email]));

        // Dispatch Emails
        for (const item of notifications) {
            const email = emailMap.get(item.user_id);
            if (email) {
                const message = `Auction "${item.title}" has ended. Final winning bid: $${item.winning_amount || 'No bids placed'}`;
                await sendReportEmail(email, message);
            }
        }

        // Mark as notified in DB
        const notifiedUserIds = notifications.map(n => n.user_id);
        const notifiedAuctionIds = notifications.map(n => n.auction_id);

        await pool.query(`
            UPDATE watchlist 
            SET notified = true 
            WHERE (user_id, auction_id) IN (
                SELECT * FROM UNNEST($1::int[], $2::int[])
            )
        `, [notifiedUserIds, notifiedAuctionIds]);

        console.log(`Dispatched emails to ${notifications.length} watchers.`);

    }, {
        connection: {
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: process.env.REDIS_PORT || 6379
        },
        concurrency: 3
    });

    worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed:`, err);
    });
};