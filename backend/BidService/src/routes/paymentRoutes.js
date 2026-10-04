import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { createPaymentOrder, verifyPayment, getPaymentStatus } from '../controller/paymentController.js';

const router = express.Router();

router.post('/auctions/:id/payment/order', verifyToken, createPaymentOrder);
router.post('/auctions/:id/payment/verify', verifyToken, verifyPayment);
router.get('/auctions/:id/payment/status', verifyToken, getPaymentStatus);

export default router;
