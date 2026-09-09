import pool from "../config/db.js";

export const watchRequest=async(req,res)=>{
    const {id}=req.params;
    const user_id=req.user.userid;

    try{
        const auctionTypeChecker=await pool.query(
            "SELECT auction_type FROM auction WHERE auction_id=$1",
            [id]);
        if(auctionTypeChecker.rows.length===0){
            return res.json({
                message:"No such Auction exist"
            });
        }

        if(auctionTypeChecker.rows[0].auction_type==="PVT"){
            const approvedCheck = await pool.query(
                "SELECT 1 FROM participants WHERE auction_id=$1 AND user_id=$2 AND watch_status='APPROVED'",
                [id, user_id]
            );
            if(approvedCheck.rows.length===0){
                return res.status(403).json({
                    message:"You need the seller's approval before you can watch this private auction"
                });
            }
        }

        const checkExistence=await pool.query("SELECT * FROM watchlist WHERE auction_id=$1 AND user_id=$2",[id,user_id]);
        if(checkExistence.rows.length===0){
            await pool.query(
                "INSERT INTO watchlist(auction_id,user_id) VALUES($1, $2)",
                [id, user_id]
            );
            return res.json({
                message:"Added To Watchlist"
            });
        }
        else{
            await pool.query("DELETE FROM watchlist WHERE auction_id=$1 AND user_id=$2",[id,user_id]);
            return res.json({
                message:"Removed From watchlist"
            });
        }
        
    }
    catch (err) {
        console.error("Error in watchlistController.js:", err.message);
        console.error(err.stack);
        
        return res.status(500).json({
            error: err.message || "Internal Server Error in watchlist"
        });
    }
}

export const getMyWatchlist = async (req, res) => {
    const user_id = req.user.userid;
    try {
        const list = await pool.query(
            `SELECT a.auction_id, a.title, a.description, a.starting_price,
                    a.status, a.start_time, a.end_time,
                    CASE
                        WHEN a.status = 'CANCELLED' THEN 'CANCELLED'
                        WHEN a.status = 'COMPLETED' THEN 'COMPLETED'
                        WHEN a.start_time > NOW() THEN 'UPCOMING'
                        WHEN a.end_time > NOW() THEN 'LIVE'
                        ELSE 'COMPLETED'
                    END AS actual_status,
                    (SELECT MAX(bid_amount) FROM bids WHERE bids.auction_id = a.auction_id) AS high_bid
             FROM watchlist w
             JOIN auction a ON a.auction_id = w.auction_id
             WHERE w.user_id = $1
             ORDER BY a.end_time ASC`,
            [user_id]
        );
        return res.json({ message: "Watchlist retrieved", data: list.rows });
    } catch (err) {
        console.error("Error retrieving watchlist:", err);
        return res.status(500).json({ error: err.message || "Internal Server Error in watchlist" });
    }
};