import pool from "../config/db.js";
import { isAdmin } from "../middleware/verifyToken.js";

const viewPublicAuctions = async(req,res)=>{
    try{
        const publicAuctionsList=await pool.query(
        "SELECT * FROM auction WHERE auction_type='PUB' AND status='LIVE'"
        );

        if(publicAuctionsList.rows.length===0){
            return res.json({
                message: "No Auctions is going on",
                no_of_live_auctions: 0,
                data: []
            });
        }
        const publicAuctionsListToSend=publicAuctionsList.rows;
        const liveAuctionCount=publicAuctionsListToSend.length;

        res.json({
            message:"Live Auctions ongoing",
            no_of_live_auctions:liveAuctionCount,
            data:publicAuctionsListToSend
        });
    }
    catch(err){
        console.log("Error retriving from DB in /view endpoint file");
        console.log(`Error : ${err}`);
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

export {viewPublicAuctions,changeAuctionStatus};