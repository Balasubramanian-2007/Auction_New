import crypto from 'crypto';
import pool from '../config/db.js';
import razorpay from '../config/razorpay.js';

/**
 * Create a Razorpay test-mode payment order for the winning bidder of a completed auction.
 */
export const createPaymentOrder = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.userid;

    try {
        const auctionRes = await pool.query(
            "SELECT initiator_id, status FROM auction WHERE auction_id = $1",
            [id]
        );

        if (auctionRes.rows.length === 0) {
            return res.status(404).json({ message: "Auction not found" });
        }

        const auction = auctionRes.rows[0];

        if (auction.status !== 'COMPLETED') {
            return res.status(400).json({ message: "Auction hasn't ended yet" });
        }

        const winningBidRes = await pool.query(
            "SELECT bidder_id, bid_amount FROM bids WHERE auction_id = $1 AND bidstatus = 'ACC' ORDER BY bid_amount DESC LIMIT 1",
            [id]
        );

        if (winningBidRes.rows.length === 0) {
            return res.status(400).json({ message: "No winning bid for this auction" });
        }

        const winner = winningBidRes.rows[0];

        if (String(currentUserId) !== String(winner.bidder_id)) {
            return res.status(403).json({ message: "Only the winning bidder can pay for this auction" });
        }

        const existingPaymentRes = await pool.query(
            "SELECT id, amount, razorpay_order_id, status FROM payments WHERE auction_id = $1",
            [id]
        );

        if (existingPaymentRes.rows.length > 0) {
            const existing = existingPaymentRes.rows[0];
            if (existing.status === 'PAID') {
                return res.status(400).json({ message: "Already paid" });
            }
            if (existing.status === 'CREATED' && existing.razorpay_order_id) {
                return res.status(200).json({
                    order_id: existing.razorpay_order_id,
                    amount: existing.amount * 100,
                    currency: 'INR',
                    key_id: process.env.RAZORPAY_KEY_ID
                });
            }
        }

        const amountInPaise = Number(winner.bid_amount) * 100;
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `auction_${id}`,
        };

        const order = await razorpay.orders.create(options);

        await pool.query(`
            INSERT INTO payments (auction_id, buyer_id, seller_id, amount, razorpay_order_id, status)
            VALUES ($1, $2, $3, $4, $5, 'CREATED')
            ON CONFLICT (auction_id) DO UPDATE
            SET buyer_id = EXCLUDED.buyer_id,
                seller_id = EXCLUDED.seller_id,
                amount = EXCLUDED.amount,
                razorpay_order_id = EXCLUDED.razorpay_order_id,
                status = 'CREATED'
        `, [id, winner.bidder_id, auction.initiator_id, winner.bid_amount, order.id]);

        return res.status(200).json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error("Error creating payment order:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

/**
 * Verify Razorpay payment signature and mark payment as PAID.
 */
export const verifyPayment = async (req, res) => {
    const { id } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: "Missing required payment verification fields" });
    }

    try {
        const paymentRes = await pool.query(
            "SELECT * FROM payments WHERE auction_id = $1 AND razorpay_order_id = $2",
            [id, razorpay_order_id]
        );

        if (paymentRes.rows.length === 0) {
            return res.status(404).json({ message: "Payment record not found" });
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        const updateRes = await pool.query(`
            UPDATE payments
            SET status = 'PAID',
                razorpay_payment_id = $1,
                razorpay_signature = $2
            WHERE auction_id = $3 AND razorpay_order_id = $4
            RETURNING *
        `, [razorpay_payment_id, razorpay_signature, id, razorpay_order_id]);

        return res.status(200).json({
            message: "Payment verified successfully",
            data: updateRes.rows[0]
        });
    } catch (err) {
        console.error("Error verifying payment:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

/**
 * Get payment status for an auction (visible to buyer and seller).
 */
export const getPaymentStatus = async (req, res) => {
    const { id } = req.params;

    try {
        const paymentRes = await pool.query(
            "SELECT id, auction_id, buyer_id, seller_id, amount, razorpay_order_id, razorpay_payment_id, status, created_at FROM payments WHERE auction_id = $1",
            [id]
        );

        if (paymentRes.rows.length === 0) {
            return res.status(200).json({
                message: "Payment not started",
                data: null,
                status: 'UNPAID'
            });
        }

        const payment = paymentRes.rows[0];
        return res.status(200).json({
            message: "Payment record retrieved",
            data: payment,
            status: payment.status
        });
    } catch (err) {
        console.error("Error retrieving payment status:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};
