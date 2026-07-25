import jwt from 'jsonwebtoken';
import pool from '../config/db';

const userJoinRequest=async(req,res)=>{
    const auction_id=req.params.id;
    const user_id=req.user.user_id;
    try{
        const checkAuctionExists=await pool.query("SELECT initiator_id,status FROM auction WHERE auction_id=$1",[auction_id]);
        if(checkAuctionExists.rows.length===0){
            return res.json({
                message:"No auction is taking place"
            })
        }
        await pool.query("INSERT INTO participants(user_id,auction_id) VALUES($1,$2)",[user_id,auction_id]);
        res.status(200).json({
            message:"Request send successfully"
        })
    }
    catch(err){
        console.log("Error in JoinApprovalController userJoinRequest");
        console.log(`Error : ${err}`);
        res.json({
            err:err
        });
    }
}


const acceptUserRequest=async(req,res)=>{
    const  {id}=req.params.id;
    const currentUserID=req.user.user_id;

    try{
        const userList=await pool.query(
            "SELECT "
        )
    }
}