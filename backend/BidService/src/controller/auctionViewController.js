import pool from "../config/db.js";
import { isAdmin } from "../middleware/verifyToken.js";

const viewPublicAuctions = async(req,res)=>{
    try{
        // Show public auctions that haven't ended yet, ordered by start time
        const publicAuctionsList=await pool.query(
            `SELECT auction_id, title, description, initiator_id, starting_price, 
                    auction_type, status, start_time, end_time, created_at,
                    CASE 
                        WHEN start_time > NOW() THEN 'UPCOMING'
                        WHEN end_time > NOW() THEN 'LIVE'
                        ELSE 'ENDED'
                    END as actual_status,
                    (SELECT MAX(bid_amount) FROM bids WHERE auction_id = auction.auction_id) as high_bid
             FROM auction 
             WHERE auction_type='PUB' AND end_time > NOW() 
             ORDER BY start_time ASC`
        );

        if(publicAuctionsList.rows.length===0){
            return res.json({
                message: "No auctions available",
                no_of_live_auctions: 0,
                data: []
            });
        }
        const publicAuctionsListToSend=publicAuctionsList.rows;
        const liveAuctionCount=publicAuctionsListToSend.length;

        return res.json({
            message:"Public auctions available",
            no_of_live_auctions:liveAuctionCount,
            data:publicAuctionsListToSend
        });
    }
    catch(err){
        console.log("Error retriving from DB in viewPublicAuctions");
        console.log(`Error : ${err}`);
        return res.status(500).json({
            error:"Internal Server Error"
        });
    }
}

const changeAuctionStatus = async(req,res)=>{
    try{
        const {id,status} = req.params;
        await pool.query("UPDATE auction SET status=$1 WHERE auction_id=$2",[status,id]);
        res.json({
            message:"Status changes Successfully"
        });
        console.log("Admin changed the status for the auction id "+id);
    }
    catch(err){
        res.status(403).json({
            message:"Admin only have the Privileage to change the Status"
        });
    }
}

const viewAllAuctionsAdmin = async(req,res)=>{
    try{
        const auctions = await pool.query(
            `SELECT auction.auction_id, auction.title, auction.description,
                    auction.initiator_id, auction.starting_price, auction.auction_type,
                    auction.status, auction.start_time, auction.end_time, auction.created_at,
                    CASE
                        WHEN auction.status = 'CANCELLED' THEN 'CANCELLED'
                        WHEN auction.status = 'COMPLETED' THEN 'COMPLETED'
                        WHEN auction.start_time > NOW() THEN 'UPCOMING'
                        WHEN auction.end_time > NOW() THEN 'LIVE'
                        ELSE 'COMPLETED'
                    END AS actual_status,
                    (SELECT MAX(bid_amount) FROM bids WHERE bids.auction_id = auction.auction_id) AS high_bid,
                    (SELECT COUNT(*) FROM bids WHERE bids.auction_id = auction.auction_id) AS total_bids
             FROM auction
             ORDER BY auction.created_at DESC, auction.auction_id DESC`
        );

        return res.json({ message: 'All auctions retrieved', data: auctions.rows });
    }
    catch(err){
        console.log("Error retrieving all auctions for admin");
        console.log(`Error : ${err}`);
        return res.status(500).json({ message: "Unable to retrieve auctions" });
    }
}
const getAuctionById = async (req, res) => {
    const { id } = req.params;
    try {
        const auctionQuery = await pool.query(
            `SELECT auction_id, title, description, initiator_id, starting_price,
                    auction_type, status, start_time, end_time, created_at,
                    CASE
                        WHEN status = 'CANCELLED' THEN 'CANCELLED'
                        WHEN status = 'COMPLETED' THEN 'COMPLETED'
                        WHEN start_time > NOW() THEN 'UPCOMING'
                        WHEN end_time > NOW() THEN 'LIVE'
                        ELSE 'COMPLETED'
                    END as actual_status,
                    (SELECT MAX(bid_amount) FROM bids WHERE auction_id = auction.auction_id) as high_bid,
                    (SELECT COUNT(*) FROM bids WHERE auction_id = auction.auction_id) as total_bids
             FROM auction WHERE auction_id = $1`,
            [id]
        );

        if (auctionQuery.rows.length === 0) {
            return res.status(404).json({ message: "Auction not found" });
        }

        const auction = auctionQuery.rows[0];

        // Gate private auctions to owner or approved participants
        if (auction.auction_type === 'PVT') {
            const isOwner = req.user.userid === auction.initiator_id;
            if (!isOwner) {
                const approvedCheck = await pool.query(
                    "SELECT 1 FROM participants WHERE auction_id=$1 AND user_id=$2 AND approval_status='APPROVED'",
                    [id, req.user.userid]
                );
                if (approvedCheck.rows.length === 0) {
                    return res.status(403).json({ message: "This is a private auction you don't have access to" });
                }
            }
        }

        return res.json({ message: "Auction retrieved", data: auction });
    } catch (err) {
        console.error("Error retrieving auction by id:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getMyAuctions = async (req, res) => {
    const userid = req.user.userid;
    try {
        const auctions = await pool.query(
            `SELECT auction_id, title, description, initiator_id, starting_price,
                    auction_type, status, start_time, end_time, created_at,
                    CASE
                        WHEN status = 'CANCELLED' THEN 'CANCELLED'
                        WHEN status = 'COMPLETED' THEN 'COMPLETED'
                        WHEN start_time > NOW() THEN 'UPCOMING'
                        WHEN end_time > NOW() THEN 'LIVE'
                        ELSE 'COMPLETED'
                    END AS actual_status,
                    (SELECT MAX(bid_amount) FROM bids WHERE bids.auction_id = auction.auction_id) AS high_bid,
                    (SELECT COUNT(*) FROM bids WHERE bids.auction_id = auction.auction_id) AS total_bids
             FROM auction
             WHERE initiator_id = $1
             ORDER BY created_at DESC`,
            [userid]
        );
        return res.json({ message: "Your auctions retrieved", data: auctions.rows });
    } catch (err) {
        console.error("Error retrieving user's auctions:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export {viewPublicAuctions,changeAuctionStatus,viewAllAuctionsAdmin,getAuctionById,getMyAuctions};