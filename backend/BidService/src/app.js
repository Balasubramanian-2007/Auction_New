import express from 'express';
import cors from 'cors';
import bidRoutes from './routes/bidRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'BidService', timestamp: new Date() });
});

app.use('/api/v1', bidRoutes);
app.use('/api/v1', paymentRoutes);
app.use('/api/v1', ratingRoutes);

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

export default app;