import pool from '../config/db.js';
import redis from '../config/redis.js';

const userJoinRequest=async(req,res)=>{
    const auction_id=req.params.id;
    const user_id=req.user.userid;
    const username=req.user.username;
    try{
        const checkAuctionExists=await pool.query("SELECT initiator_id,status FROM auction WHERE auction_id=$1",[auction_id]);
        if(checkAuctionExists.rows.length===0){
            return res.json({
                message:"No auction found"
            });
        }
        
        const insertionQuery = await pool.query(
            "INSERT INTO participants(user_id, auction_id, username) VALUES($1, $2, $3) ON CONFLICT DO NOTHING",
            [user_id, auction_id, username]
        );

        if (insertionQuery.rowCount === 0) {
            return res.json({ message: "You already requested to join" });
        }
        return res.status(200).json({
            message:"Request send successfully"
        })
    }
    catch(err){
        console.log("Error in JoinApprovalController userJoinRequest");
        console.log(`Error : ${err}`);
        return res.json({
            error:err
        });
    }
}

// This is a general endpoint which shows all pending request
const requestList=async(req,res)=>{
    const currentUserID = req.user.userid;
    try{
        const dbqueryForAllPendingRequests=await pool.query(
            "SELECT user_id,username,approval_status FROM participants WHERE auction_id IN (SELECT auction_id FROM auction WHERE initiator_id=$1) AND approval_status='PENDING'",
            [currentUserID]
        );
        if(dbqueryForAllPendingRequests.rows.length===0){
            return res.json({
                message:"No Pending requests"
            });
        }
        return res.json({
            message:"Pending List",
            data:dbqueryForAllPendingRequests.rows
        });
    }
    catch(err){
        console.log("Error retrieveing pending list data from DB . Check JoinApprovalController.js file");
        return res.status(500).json({
            error:err
        });
    }
}

const acceptUserRequest=async(req,res)=>{
    const  {id}=req.params;
    const currentUserID=req.user.userid;

    try{
        const dbquery_for_specific_auction_pending_requests=await pool.query(
            "SELECT user_id,username,approval_status FROM participants WHERE auction_id=$1 AND auction_id IN (SELECT auction_id FROM auction WHERE initiator_id=$2) AND approval_status='PENDING'",
            [id,currentUserID]
        );
        if(dbquery_for_specific_auction_pending_requests.rows.length===0){
            return res.json({
                message:"No Pending requests"
            });
        }
        return res.json({
            message:`Pending List for the auction ${id}`,
            data:dbquery_for_specific_auction_pending_requests.rows
        });
    }
    catch(err){
        console.log("Error retriving data from Pending list of participants for Specific Auction ");
        console.log(err);
        return res.json({
            error:err
        });
    }
}

const updateParticipantStatus = async (req, res) => {
    const { id } = req.params; 
    const { target_user_id, status } = req.body; 
    const currentUserID = Number(req.user.userid); 

    try {
        const checkOwner = await pool.query(
            "SELECT initiator_id FROM auction WHERE auction_id=$1", 
            [id]
        ); 

        if (checkOwner.rows.length === 0 || checkOwner.rows[0].initiator_id !== currentUserID) {
            return res.status(403).json({ message: "Unauthorized: You are not the owner of this auction" });
        }

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

        return res.status(200).json({ message: `Participant status updated to ${status}` });
        
    } catch (err) {
        console.log("Error updating participant status:", err);
        return res.status(500).json({ error: err.message });
    }
};

export {userJoinRequest,requestList,acceptUserRequest,updateParticipantStatus};