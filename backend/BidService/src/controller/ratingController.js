import pool from '../config/db.js';

/**
 * Wilson score lower-bound formula (95% confidence interval, z = 1.96).
 * Derives binary positive signal (stars >= 4) from total ratings.
 */
function wilsonScore(positiveCount, totalCount, z = 1.96) {
    if (totalCount === 0) return 0;
    const phat = positiveCount / totalCount;
    const z2 = z * z;
    const numerator = phat + z2 / (2 * totalCount) - z * Math.sqrt((phat * (1 - phat) + z2 / (4 * totalCount)) / totalCount);
    const denominator = 1 + z2 / totalCount;
    return Math.max(0, numerator / denominator); // 0 to 1
}

/**
 * Submit a rating for the seller of a completed auction.
 * Only the winning bidder can submit within 5 hours of auction end_time.
 */
export const submitRating = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.userid;
    const rawStars = req.body.stars;
    const stars = Number(rawStars);

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
        return res.status(400).json({ message: "Stars rating must be an integer between 1 and 5" });
    }

    try {
        const auctionRes = await pool.query(
            "SELECT initiator_id, status, end_time FROM auction WHERE auction_id = $1",
            [id]
        );

        if (auctionRes.rows.length === 0) {
            return res.status(404).json({ message: "Auction not found" });
        }

        const auction = auctionRes.rows[0];

        if (auction.status !== 'COMPLETED') {
            return res.status(400).json({ message: "This auction hasn't ended yet" });
        }

        const endTime = new Date(auction.end_time);
        const windowClosesAt = new Date(endTime.getTime() + 5 * 60 * 60 * 1000);
        const now = new Date();

        if (now > windowClosesAt) {
            return res.status(400).json({ message: "Rating window has closed (must rate within 5 hours of auction completion)" });
        }

        // Determine winning bidder
        const winningBidRes = await pool.query(
            "SELECT bidder_id, bid_amount FROM bids WHERE auction_id = $1 AND bidstatus = 'ACC' ORDER BY bid_amount DESC LIMIT 1",
            [id]
        );

        if (winningBidRes.rows.length === 0) {
            return res.status(400).json({ message: "No winning bid found for this auction" });
        }

        const winner = winningBidRes.rows[0];

        if (String(currentUserId) !== String(winner.bidder_id)) {
            return res.status(403).json({ message: "Only the winning bidder can rate the seller" });
        }

        // Check if already rated
        try {
            const existingRating = await pool.query(
                "SELECT id FROM ratings WHERE auction_id = $1 AND buyer_id = $2",
                [id, currentUserId]
            );

            if (existingRating.rows.length > 0) {
                return res.status(400).json({ message: "You already rated this seller for this auction" });
            }

            const insertRes = await pool.query(
                "INSERT INTO ratings (auction_id, seller_id, buyer_id, stars) VALUES ($1, $2, $3, $4) RETURNING *",
                [id, auction.initiator_id, currentUserId, stars]
            );

            return res.status(201).json({
                message: "Rating submitted successfully",
                data: insertRes.rows[0]
            });
        } catch (tableErr) {
            if (tableErr.code === '42P01') {
                return res.status(500).json({
                    message: "Ratings table has not been created in PostgreSQL yet. Please run CREATE TABLE ratings."
                });
            }
            throw tableErr;
        }
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: "You already rated this seller for this auction" });
        }
        console.error("Error submitting rating:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

/**
 * Check whether the current user can rate a completed auction right now.
 */
export const getMyRatingStatus = async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.userid;

    try {
        const auctionRes = await pool.query(
            "SELECT initiator_id, status, end_time FROM auction WHERE auction_id = $1",
            [id]
        );

        if (auctionRes.rows.length === 0) {
            return res.status(404).json({ message: "Auction not found" });
        }

        const auction = auctionRes.rows[0];
        const endTime = new Date(auction.end_time);
        const windowClosesAt = new Date(endTime.getTime() + 5 * 60 * 60 * 1000);
        const now = new Date();

        const windowOpen = (auction.status === 'COMPLETED') && (now <= windowClosesAt);

        const winningBidRes = await pool.query(
            "SELECT bidder_id, bid_amount FROM bids WHERE auction_id = $1 AND bidstatus = 'ACC' ORDER BY bid_amount DESC LIMIT 1",
            [id]
        );

        const winner = winningBidRes.rows.length > 0 ? winningBidRes.rows[0] : null;
        const isWinner = Boolean(winner && String(currentUserId) === String(winner.bidder_id));

        let existingRatingRes = { rows: [] };
        try {
            existingRatingRes = await pool.query(
                "SELECT id, stars, created_at FROM ratings WHERE auction_id = $1 AND buyer_id = $2",
                [id, currentUserId]
            );
        } catch (dbErr) {
            if (dbErr.code !== '42P01') {
                throw dbErr;
            }
        }

        const alreadyRated = existingRatingRes.rows.length > 0;
        const rating = alreadyRated ? existingRatingRes.rows[0] : null;
        const canRate = isWinner && windowOpen && !alreadyRated;

        return res.status(200).json({
            canRate,
            alreadyRated,
            rating,
            windowOpen,
            windowClosesAt: windowClosesAt.toISOString(),
            isWinner,
            isCompleted: auction.status === 'COMPLETED'
        });
    } catch (err) {
        console.error("Error getting rating status:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

/**
 * Get the Wilson-score rating summary for a single seller.
 */
export const getSellerRating = async (req, res) => {
    const { userId } = req.params;

    try {
        let rows = [];
        try {
            const ratingsRes = await pool.query(
                "SELECT stars FROM ratings WHERE seller_id = $1",
                [userId]
            );
            rows = ratingsRes.rows;
        } catch (dbErr) {
            if (dbErr.code !== '42P01') {
                throw dbErr;
            }
        }

        const totalCount = rows.length;
        const positiveCount = rows.filter((r) => r.stars >= 4).length;
        const negativeCount = totalCount - positiveCount;
        const score = wilsonScore(positiveCount, totalCount);
        const wilsonPercentage = Math.round(score * 100);
        const averageStars = totalCount > 0 ? Number((rows.reduce((sum, r) => sum + r.stars, 0) / totalCount).toFixed(1)) : 0;

        return res.status(200).json({
            seller_id: userId,
            total_ratings: totalCount,
            positive_count: positiveCount,
            negative_count: negativeCount,
            wilson_score: score,
            wilson_percentage: wilsonPercentage,
            average_stars: averageStars
        });
    } catch (err) {
        console.error("Error retrieving seller rating:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

/**
 * Get Wilson-score ratings for a batch of seller user IDs.
 */
export const getSellerRatingsBatch = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(200).json({ data: {} });
    }

    try {
        let rows = [];
        try {
            const ratingsRes = await pool.query(
                "SELECT seller_id, stars FROM ratings WHERE seller_id = ANY($1)",
                [ids]
            );
            rows = ratingsRes.rows;
        } catch (dbErr) {
            if (dbErr.code !== '42P01') {
                throw dbErr;
            }
        }

        const ratingsBySeller = {};
        for (const id of ids) {
            ratingsBySeller[id] = [];
        }

        for (const row of rows) {
            if (ratingsBySeller[row.seller_id]) {
                ratingsBySeller[row.seller_id].push(row.stars);
            }
        }

        const results = {};
        for (const id of ids) {
            const starList = ratingsBySeller[id] || [];
            const totalCount = starList.length;
            const positiveCount = starList.filter((s) => s >= 4).length;
            const negativeCount = totalCount - positiveCount;
            const score = wilsonScore(positiveCount, totalCount);
            const wilsonPercentage = Math.round(score * 100);
            const averageStars = totalCount > 0 ? Number((starList.reduce((sum, s) => sum + s, 0) / totalCount).toFixed(1)) : 0;

            results[id] = {
                seller_id: id,
                total_ratings: totalCount,
                positive_count: positiveCount,
                negative_count: negativeCount,
                wilson_score: score,
                wilson_percentage: wilsonPercentage,
                average_stars: averageStars
            };
        }

        return res.status(200).json({ data: results });
    } catch (err) {
        console.error("Error retrieving batch seller ratings:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};
