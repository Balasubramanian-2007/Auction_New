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
            return res.json({
                message:"This is a private auction . You can't able to add it to watchlist"
            });
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
    catch(err){
        console.log("Error in data retrieval in watchlistController.js");
        return res.status(500).json({
            error:err
        });
    }

}