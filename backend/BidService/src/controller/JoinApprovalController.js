import pool from '../config/db.js';
import redis from '../config/redis.js';

// --- Bid participation ---

const userJoinRequest=async(req,res)=>{
    const auction_id=req.params.id;
    const user_id=req.user.userid;
    const username=req.user.username;
    try{
        const checkAuctionExists=await pool.query("SELECT initiator_id,status FROM auction WHERE auction_id=$1",[auction_id]);
        if(checkAuctionExists.rows.length===0){
            return res.json({ message:"No auction found" });
        }

        const upsertQuery = await pool.query(
            `INSERT INTO participants(user_id, auction_id, username, approval_status)
             VALUES($1, $2, $3, 'PENDING')
             ON CONFLICT (user_id, auction_id) DO UPDATE
             SET approval_status = 'PENDING'
             WHERE participants.approval_status IN ('REJECTED', 'NONE')
             RETURNING approval_status`,
            [user_id, auction_id, username]
        );

        if (upsertQuery.rowCount === 0) {
            const existing = await pool.query(
                "SELECT approval_status FROM participants WHERE user_id=$1 AND auction_id=$2",
                [user_id, auction_id]
            );
            const currentStatus = existing.rows[0]?.approval_status;
            if (currentStatus === 'APPROVED') {
                return res.json({ message: "You're already approved to bid on this auction" });
            }
            return res.json({ message: "You already requested to bid — waiting on the seller's decision" });
        }

        return res.status(200).json({ message:"Bid request sent successfully" });
    }
    catch(err){
        console.log("Error in JoinApprovalController userJoinRequest");
        console.log(`Error : ${err}`);
        return res.json({ error:err });
    }
}

// --- Watch participation (private auctions only) ---

const requestToWatch = async (req, res) => {
    const auction_id = req.params.id;
    const user_id = req.user.userid;
    const username = req.user.username;
    try {
        const auctionCheck = await pool.query("SELECT auction_type FROM auction WHERE auction_id=$1", [auction_id]);
        if (auctionCheck.rows.length === 0) {
            return res.status(404).json({ message: "No auction found" });
        }
        if (auctionCheck.rows[0].auction_type !== 'PVT') {
            return res.status(400).json({ message: "Only private auctions require watch approval" });
        }

        const upsertQuery = await pool.query(
            `INSERT INTO participants(user_id, auction_id, username, approval_status, watch_status)
             VALUES($1, $2, $3, 'NONE', 'PENDING')
             ON CONFLICT (user_id, auction_id) DO UPDATE
             SET watch_status = 'PENDING'
             WHERE participants.watch_status IS NULL OR participants.watch_status = 'REJECTED'
             RETURNING watch_status`,
            [user_id, auction_id, username]
        );

        if (upsertQuery.rowCount === 0) {
            const existing = await pool.query(
                "SELECT watch_status FROM participants WHERE user_id=$1 AND auction_id=$2",
                [user_id, auction_id]
            );
            const currentStatus = existing.rows[0]?.watch_status;
            if (currentStatus === 'APPROVED') {
                return res.json({ message: "You're already approved to watch this auction" });
            }
            return res.json({ message: "You already requested to watch — waiting on the seller's decision" });
        }

        return res.status(200).json({ message: "Watch request sent successfully" });
    } catch (err) {
        console.log("Error in JoinApprovalController requestToWatch");
        console.log(`Error : ${err}`);
        return res.status(500).json({ error: err.message });
    }
};

// --- A buyer checking their own status on one auction (bid + watch) ---

const getMyParticipationStatus = async (req, res) => {
    const auction_id = req.params.id;
    const user_id = req.user.userid;
    try {
        const result = await pool.query(
            "SELECT approval_status, watch_status FROM participants WHERE auction_id=$1 AND user_id=$2",
            [auction_id, user_id]
        );
        if (result.rows.length === 0) {
            return res.json({ requested: false, approval_status: null, watch_requested: false, watch_status: null });
        }
        const row = result.rows[0];
        return res.json({
            requested: row.approval_status !== 'NONE' && row.approval_status !== null,
            approval_status: row.approval_status === 'NONE' ? null : row.approval_status,
            watch_requested: Boolean(row.watch_status),
            watch_status: row.watch_status,
        });
    } catch (err) {
        console.error("Error checking participation status:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// This is a general endpoint which shows all pending request (bid or watch) across every auction the caller owns
const requestList=async(req,res)=>{
    const currentUserID = req.user.userid;
    try{
        const dbqueryForAllPendingRequests=await pool.query(
            `SELECT user_id,username,approval_status,watch_status
             FROM participants
             WHERE auction_id IN (SELECT auction_id FROM auction WHERE initiator_id=$1)
               AND (approval_status='PENDING' OR watch_status='PENDING')`,
            [currentUserID]
        );
        if(dbqueryForAllPendingRequests.rows.length===0){
            return res.json({ message:"No Pending requests" });
        }
        return res.json({
            message:"Pending List",
            data:dbqueryForAllPendingRequests.rows
        });
    }
    catch(err){
        console.log("Error retrieveing pending list data from DB . Check JoinApprovalController.js file");
        return res.status(500).json({ error:err });
    }
}

// Pending requests (bid or watch) for one specific auction
const acceptUserRequest=async(req,res)=>{
    const  {id}=req.params;
    const currentUserID=req.user.userid;

    try{
        const dbquery_for_specific_auction_pending_requests=await pool.query(
            `SELECT user_id,username,approval_status,watch_status
             FROM participants
             WHERE auction_id=$1
               AND auction_id IN (SELECT auction_id FROM auction WHERE initiator_id=$2)
               AND (approval_status='PENDING' OR watch_status='PENDING')`,
            [id,currentUserID]
        );
        if(dbquery_for_specific_auction_pending_requests.rows.length===0){
            return res.json({ message:"No Pending requests" });
        }
        return res.json({
            message:`Pending List for the auction ${id}`,
            data:dbquery_for_specific_auction_pending_requests.rows
        });
    }
    catch(err){
        console.log("Error retriving data from Pending list of participants for Specific Auction ");
        console.log(err);
        return res.json({ error:err });
    }
}

// Approve/decline either the bid request or the watch request for one participant.
// req.body.field must be 'bid' or 'watch' — defaults to 'bid' if omitted.
const updateParticipantStatus = async (req, res) => {
    const { id } = req.params; 
    const { target_user_id, status, field } = req.body; 
    const currentUserID = req.user.userid; 

    try {
        const checkOwner = await pool.query(
            "SELECT initiator_id FROM auction WHERE auction_id=$1", 
            [id]
        ); 

        if (checkOwner.rows.length === 0 || checkOwner.rows[0].initiator_id !== currentUserID) {
            return res.status(403).json({ message: "Unauthorized: You are not the owner of this auction" });
        }

        if (field === 'watch') {
            await pool.query(
                "UPDATE participants SET watch_status=$1 WHERE auction_id=$2 AND user_id=$3",
                [status, id, target_user_id]
            );
            if (status === 'APPROVED') {
                await pool.query(
                    "INSERT INTO watchlist(auction_id, user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
                    [id, target_user_id]
                );
            } else if (status === 'REJECTED') {
                await pool.query(
                    "DELETE FROM watchlist WHERE auction_id=$1 AND user_id=$2",
                    [id, target_user_id]
                );
            }
        } else {
            await pool.query(
                "UPDATE participants SET approval_status=$1 WHERE auction_id=$2 AND user_id=$3",
                [status, id, target_user_id]
            );

            if (status === 'APPROVED') {
                await redis.sadd(`auction:${id}:approved_users`, target_user_id);
            } 
            else if (status === 'REJECTED') {
                await redis.srem(`auction:${id}:approved_users`, target_user_id);
            }
        }

        return res.status(200).json({ message: `${field === 'watch' ? 'Watch' : 'Bid'} status updated to ${status}` });
        
    } catch (err) {
        console.log("Error updating participant status:", err);
        return res.status(500).json({ error: err.message });
    }
};

export {userJoinRequest,requestToWatch,requestList,acceptUserRequest,updateParticipantStatus,getMyParticipationStatus};