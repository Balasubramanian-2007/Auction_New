import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/auth', authRoutes); 
app.use('/auth', searchRoutes);

export default app;