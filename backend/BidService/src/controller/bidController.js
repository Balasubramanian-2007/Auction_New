import fs from 'fs';
import pool from "../config/db.js";
import path from 'path';
import redis from '../config/redis.js';


const placeBidLua = fs.readFileSync(
    path.join(process.cwd(), 'src/scripts/placeBid.lua'), 
    'utf8'
);


const coreBidding = async(req,res)=>{
    const incoming_bid_amount=req.body.amount;
    const auction_id=req.params.id;
    const bidder_id=req.user.userid;

    try{
        const result = await redis.eval(
            placeBidLua,
            2, 
            `auction:${auction_id}:high_bid`,       // KEYS[1]
            `auction:${auction_id}:approved_users`, // KEYS[2]
            incoming_bid_amount,                    // ARGV[1]
            bidder_id                               // ARGV[2]
        );

        if (result === -1) {
            return res.status(403).json({ message: "You are not an approved participant for this private auction.You must want to get prior permission" });
        }

        else if (result === 1) {
            const bidstatus="ACC";
            await pool.query("INSERT INTO bids(auction_id,bidder_id,bid_amount,bidstatus) VALUES($1,$2,$3,$4)",[auction_id,bidder_id,incoming_bid_amount,bidstatus])
            console.log(`Bid is accepted and inserted into bids table by user ${bidder_id} for the Auction ${auction_id} with amount ${incoming_bid_amount}`);
            return res.status(200).json({message:"Bidded Successfully and in 1 st position"});
        } 
        else {
            const bidstatus="REJ";
            await pool.query("INSERT INTO bids(auction_id,bidder_id,bid_amount,bidstatus) VALUES($1,$2,$3,$4)",[auction_id,bidder_id,incoming_bid_amount,bidstatus])
            console.log(`Bid is accepted and inserted into bids table by user ${bidder_id} for the Auction ${auction_id} with amount ${incoming_bid_amount}`);
            return res.status(200).json({message:"Bidded Successfully , but your bid is Rejected"});
        }
    }
    catch(err){
        console.log("Error in Core Engine(bidController.js)")
        return res.status(500).json({
            error:err
        });
    }
}

export {coreBidding};
