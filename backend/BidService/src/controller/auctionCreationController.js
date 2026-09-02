import pool  from "../config/db.js";
import redis from "../config/redis.js";
import dotenv from 'dotenv';

dotenv.config();

const createAuction=async(req,res)=>{
    const {title,description,starting_price,auction_type,start_time,end_time}=req.body;
    const initiator_id=req.user.userid; // User ID is a string from AuthService

    const start = new Date(start_time);
    const end = new Date(end_time);
    const now = new Date();

    try{
        // Debug logging
        console.log("Create auction request received:");
        console.log("  title:", title);
        console.log("  description:", description);
        console.log("  starting_price:", starting_price, "type:", typeof starting_price);
        console.log("  auction_type:", auction_type);
        console.log("  initiator_id:", initiator_id);
        console.log("  start_time (input):", start_time);
        console.log("  start_time (Date):", start.toISOString());
        console.log("  end_time (input):", end_time);
        console.log("  end_time (Date):", end.toISOString());

        // if(start <= now){
        //     return res.json({message:"Start Time must be Future"});
        // }
        if (start.getTime() < now.getTime() - 60000) { 
            // Allows a 1-minute buffer for request latency
            return res.json({message:"Start Time must be Future"});
        }
        if(start >= end){
            return res.json({message:"Start Time must be lesser than End Time"});
        }

        // Convert ISO strings to PostgreSQL format
        // const startTimeForDB = start.toISOString().replace('T', ' ').replace('Z', '');
        // const endTimeForDB = end.toISOString().replace('T', ' ').replace('Z', '');

        // Pass native JS Date objects directly to pg driver
        const startTimeForDB = start;
        const endTimeForDB = end;

        console.log("  Inserting with:");
        console.log("    start_time (DB):", startTimeForDB);
        console.log("    end_time (DB):", endTimeForDB);

        const newAuction=await pool.query(
            "INSERT INTO auction(title,description,initiator_id,starting_price,auction_type,start_time,end_time,status) VALUES($1,$2,$3,$4,$5,$6,$7,'UPCOMING') RETURNING auction_id",
            [title,description,initiator_id,starting_price,auction_type,startTimeForDB,endTimeForDB]
        );
        const auction_id=newAuction.rows[0].auction_id;
        
        // Fire-and-forget Redis operation - don't block if Redis is down
        redis.set(`auction:${auction_id}:high_bid`, starting_price).catch((redisErr) => {
            console.warn("Redis set operation failed (non-blocking):", redisErr.message);
        });
        
        return res.status(201).json({
            message: "Auction scheduled successfully",
        });
    }
    catch(err){
        console.error("❌ Error creating auction:");
        console.error("   Error Message:", err.message);
        console.error("   Error Code:", err.code);
        console.error("   Error Detail:", err.detail);
        console.error("   Full Error:", JSON.stringify(err, null, 2));
        return res.status(500).json({ message: "Internal Server Error during auction generation" });
    }
}
const endAuctionManually = async (req, res) => {
    const { id } = req.params;
    const initiator_id = req.user.userid; // String ID from JWT via verifyToken

    try {
        // 1. Verify auction exists and check initiator_id
        const auctionQuery = await pool.query(
            "SELECT initiator_id, status FROM auction WHERE auction_id = $1",
            [id]
        );

        if (auctionQuery.rows.length === 0) {
            return res.status(404).json({ message: "Auction not found" });
        }

        const auction = auctionQuery.rows[0];

        // 2. Strict authorization check: Only the creator can end it early
        if (auction.initiator_id !== initiator_id) {
            return res.status(403).json({ message: "Unauthorized: Only the auction creator can end this auction" });
        }

        // 3. Prevent ending an auction that is already completed
        if (auction.status === 'COMPLETED') {
            return res.status(400).json({ message: "Auction is already completed" });
        }

        // 4. Update status in PostgreSQL DB
        await pool.query(
            "UPDATE auction SET status = 'COMPLETED', updated_at = NOW() WHERE auction_id = $1",
            [id]
        );

        // 5. Clean up / mark completed in Redis (non-blocking safety check)
        redis.del(`auction:${id}:high_bid`).catch((redisErr) => {
            console.warn("Redis delete operation failed (non-blocking):", redisErr.message);
        });

        return res.status(200).json({
            message: "Auction ended manually by creator successfully",
            auction_id: id,
            status: "COMPLETED"
        });

    } catch (err) {
        console.error("Error ending auction manually:", err);
        return res.status(500).json({ message: "Internal Server Error while ending auction" });
    }
};

export { createAuction, endAuctionManually };

