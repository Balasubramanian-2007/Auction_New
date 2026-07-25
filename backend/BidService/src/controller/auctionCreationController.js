import pool  from "../config/db.js";
import dotenv from 'dotenv';

dotenv.config();

const createAuction=async(req,res)=>{
    const {title,description,starting_price,auction_type,start_time,end_time}=req.body;
    const initiator_id=req.user.userid;

    const start = new Date(start_time);
    const end = new Date(end_time);
    const now = new Date();

    try{
        if(start <= now){
            return res.json({message:"Start Time must be Future"});
        }
        if(start >= end){
            return res.json({message:"Start Time must be greater than End Time"});
        }

        await pool.query(
            "INSERT INTO auction(title,description,initiator_id,starting_price,auction_type,start_time,end_time) VALUES($1,$2,$3,$4,$5,$6,$7)",
            [title,description,initiator_id,starting_price,auction_type,start_time,end_time]
        );
        return res.status(201).json({
            message: "Auction scheduled successfully",
        });
    }
    catch(err){
        console.error("Error creating auction:", err);
        return res.status(500).json({ message: "Internal Server Error during auction generation" });
    }
}

export {createAuction};