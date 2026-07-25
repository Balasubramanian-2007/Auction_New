import pool from "../config/db.js";
import jwt from 'jsonwebtoken';

// This is for everyone to view all auction records with Auction ID
const auctionHistory=async(req,res)=>{
    const {id}=req.params;
    const auctionType= await pool.query("SELECT auction_type FROM auction WHERE auction_id=$1",[id]);
    if(auctionType.rows[0]==="PVT"){
        return privateAuctionHistory(req,res);
    }
    try{
        const auctionData=await pool.query(
            "SELECT * FROM auction WHERE auction_id=$1 AND auction_type='PUB'",[id]
        );

        if(auctionData.rows.length === 0){
            return res.json({message:"No Past Auction available"});
        }
        console.log("Auction History retrieved from DB " + id);
        res.status(200).json(
            {
                message : "History Retrieved",
                data:auctionData.rows[0]
            }
        );
    }
    catch(err){
        console.log("Error retriving data from DB in Auction History ");
        res.status(500).json({message:err});
    }
}

// For Private Auction the Auction initiater alone can see the auction history

const privateAuctionHistory=async(req,res)=>{
    const {id}=req.params;
    const auctionInitiaterID = await pool.query("SELECT initiator_id FROM auction WHERE auction_id=$1",[id]);
    if (req.user && req.user.userid === auctionInitiaterID.rows[0].initiater_id) {
        try{
            const auctionData=await pool.query(
                "SELECT auction_id,title,description,initiater_id,status,start_time,end_time FROM auction WHERE auction_id=$1",[id]
            );

            if(auctionData.rows.length===0){
                return res.json({message:"No Past Auction available"});
            }
            console.log("Auction History retrieved from DB " + id);
            res.status(200).json(
                {
                    message : "History Retrieved",
                    data:auctionData.rows[0]
                }
            );
        }
        catch(err){
            console.log("Error retriving data from DB in Auction History ");
            res.status(500).json({message:err});
        }
    }
    else{
        res.status(403).json({
            message:"Auction Initiater can only able to view Private auction history"
        });
    }
}

export {auctionHistory,privateAuctionHistory};