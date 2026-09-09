// import dotenv from 'dotenv';
// dotenv.config();

// import app from './app.js';
// import pool from './config/db.js';
// import redis from './config/redis.js';
// // import { checkSchedular, watchListStatusUpdate } from './services/schedular.js';
// import { checkSchedular, watchListStatusUpdate } from './utils/schedular.js';

// const PORT = process.env.PORT || 3000;

// const server = app.listen(PORT, () => {
//     console.log(`BidService running on port ${PORT}`);
// });

// try {
//     checkSchedular.start();
//     watchListStatusUpdate.start();
//     console.log('Cron schedulers initialized successfully.');
// } catch (err) {
//     console.error('Failed to start cron schedulers:', err);
// }

// const shutdown = async (signal) => {
//     console.log(`\n${signal} received. Closing HTTP server and database connections...`);
//     server.close(async () => {
//         try {
//             checkSchedular.stop();
//             watchListStatusUpdate.stop();

//             await redis.quit();
//             await pool.end();
            
//             console.log('Connections closed cleanly. Process exiting.');
//             process.exit(0);
//         } catch (err) {
//             console.error('Error during graceful shutdown:', err);
//             process.exit(1);
//         }
//     });
// };

// process.on('SIGTERM', () => shutdown('SIGTERM'));
// process.on('SIGINT', () => shutdown('SIGINT'));



import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import pool from './config/db.js';
import redis from './config/redis.js';
import { checkSchedular, watchListStatusUpdate } from './utils/schedular.js';
import { startNotificationWorker } from './workers/notificationWorker.js';
// 1. Import the Socket.io Server class
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`BidService running on port ${PORT}`);
});

// 2. Initialize Socket.io and attach it to the HTTP server
// Adjust cors settings as needed for your frontend URL
export const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// 3. Optional: Set up basic connection listener
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

try {
    checkSchedular.start();
    watchListStatusUpdate.start();
    startNotificationWorker();
    console.log('Cron schedulers and notification worker initialized successfully.');
} catch (err) {
    console.error('Failed to start cron schedulers or notification worker:', err);
}

const shutdown = async (signal) => {
    console.log(`\n${signal} received. Closing HTTP server and database connections...`);
    
    // 4. Close io connections gracefully on shutdown
    io.close();

    server.close(async () => {
        try {
            checkSchedular.stop();
            watchListStatusUpdate.stop();

            await redis.quit();
            await pool.end();
            
            console.log('Connections closed cleanly. Process exiting.');
            process.exit(0);
        } catch (err) {
            console.error('Error during graceful shutdown:', err);
            process.exit(1);
        }
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
