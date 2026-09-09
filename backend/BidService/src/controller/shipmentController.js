import pool from '../config/db.js';
import jwt from 'jsonwebtoken';
import { sendReportEmail } from '../utils/emailsender.js';

/**
 * Submit or update shipment proof for a completed auction.
 * Only the auction initiator (seller) can submit.
 */
export const submitShipmentProof = async (req, res) => {
    const { id } = req.params;
    const seller_id = req.user.userid;
    const { courier_name, tracking_number, notes, receipt_photo_url } = req.body;

    try {
        const auctionRes = await pool.query(
            "SELECT title, initiator_id, status, end_time FROM auction WHERE auction_id = $1",
            [id]
        );

        if (auctionRes.rows.length === 0) {
            return res.status(404).json({ message: "No auction found" });
        }

        const auction = auctionRes.rows[0];

        if (auction.status !== 'COMPLETED') {
            return res.status(400).json({ message: "Cannot submit shipment proof before the auction is completed" });
        }

        if (String(auction.initiator_id) !== String(seller_id)) {
            return res.status(403).json({ message: "Unauthorized: Only the auction seller can submit shipment proof" });
        }

        if (!courier_name || !courier_name.trim() || !tracking_number || !tracking_number.trim()) {
            return res.status(400).json({ message: "Courier name and tracking number are required" });
        }

        const upsertRes = await pool.query(`
            INSERT INTO shipment_proofs (auction_id, seller_id, receipt_photo_url, courier_name, tracking_number, notes, submitted_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (auction_id) DO UPDATE
            SET seller_id = EXCLUDED.seller_id,
                receipt_photo_url = EXCLUDED.receipt_photo_url,
                courier_name = EXCLUDED.courier_name,
                tracking_number = EXCLUDED.tracking_number,
                notes = EXCLUDED.notes,
                submitted_at = NOW()
            RETURNING id, auction_id, seller_id, receipt_photo_url, courier_name, tracking_number, notes, submitted_at
        `, [id, seller_id, receipt_photo_url || null, courier_name.trim(), tracking_number.trim(), notes?.trim() || null]);

        const proof = upsertRes.rows[0];
        const endTime = new Date(auction.end_time);
        const deadline = new Date(endTime.getTime() + 3 * 60 * 60 * 1000);
        const submittedAt = new Date(proof.submitted_at);
        const is_late = submittedAt > deadline;

        // Respond to the seller immediately without blocking on email dispatch
        res.status(200).json({
            message: is_late
                ? "Shipment proof submitted (Note: submitted after the 3-hour deadline)"
                : "Shipment proof submitted successfully",
            data: proof,
            deadline: deadline.toISOString(),
            is_late
        });

        // Fire-and-forget email notification to the winning bidder
        (async () => {
            try {
                const winningBidRes = await pool.query(
                    "SELECT bidder_id, bid_amount FROM bids WHERE auction_id = $1 AND bidstatus = 'ACC' ORDER BY bid_amount DESC LIMIT 1",
                    [id]
                );

                if (winningBidRes.rows.length === 0) {
                    return; // No winning bidder on this auction
                }

                const winner = winningBidRes.rows[0];

                const systemToken = jwt.sign(
                    { userid: 'SYSTEM_SCHEDULER', role: 'admin' },
                    process.env.JWT_SECRET || 'secretKey',
                    { expiresIn: '5m' }
                );

                const authResponse = await fetch("http://localhost:4000/auth/getUserEmailID", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${systemToken}`
                    },
                    body: JSON.stringify({ ids: [winner.bidder_id] })
                });

                if (!authResponse.ok) {
                    console.error(`AuthService /auth/getUserEmailID failed with status ${authResponse.status} during shipment notification`);
                    return;
                }

                const authData = await authResponse.json();
                const winnerEmail = (authData.data || [])[0]?.email;

                if (winnerEmail) {
                    const message = `Your winning item for auction "${auction.title}" (Final bid: $${winner.bid_amount}) has shipped!\n\nCourier: ${proof.courier_name}\nTracking Number: ${proof.tracking_number}${proof.notes ? `\nNotes: ${proof.notes}` : ''}\nSubmitted at: ${new Date(proof.submitted_at).toLocaleString()}`;
                    await sendReportEmail(winnerEmail, message);
                    console.log(`Shipment notification email dispatched to winner (${winner.bidder_id}: ${winnerEmail}) for auction ${id}`);
                }
            } catch (notifyErr) {
                console.error("Error dispatching shipment proof notification email to winner:", notifyErr);
            }
        })();
    } catch (err) {
        console.error("Error submitting shipment proof:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

/**
 * Get shipment proof for an auction (if submitted), along with deadline and overdue status.
 * Any authenticated user can view this.
 */
export const getShipmentProof = async (req, res) => {
    const { id } = req.params;

    try {
        const auctionRes = await pool.query(
            "SELECT initiator_id, status, end_time FROM auction WHERE auction_id = $1",
            [id]
        );

        if (auctionRes.rows.length === 0) {
            return res.status(404).json({ message: "No auction found" });
        }

        const auction = auctionRes.rows[0];
        const endTime = new Date(auction.end_time);
        const deadline = new Date(endTime.getTime() + 3 * 60 * 60 * 1000);
        const now = new Date();
        const is_overdue = now > deadline;

        const proofRes = await pool.query(
            "SELECT id, auction_id, seller_id, receipt_photo_url, courier_name, tracking_number, notes, submitted_at FROM shipment_proofs WHERE auction_id = $1",
            [id]
        );

        if (proofRes.rows.length === 0) {
            return res.status(200).json({
                message: "Shipment proof not yet submitted",
                data: null,
                deadline: deadline.toISOString(),
                is_overdue
            });
        }

        const proof = proofRes.rows[0];
        const submittedAt = new Date(proof.submitted_at);
        const is_late = submittedAt > deadline;

        return res.status(200).json({
            message: "Shipment proof retrieved",
            data: proof,
            deadline: deadline.toISOString(),
            is_overdue,
            is_late
        });
    } catch (err) {
        console.error("Error retrieving shipment proof:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};
