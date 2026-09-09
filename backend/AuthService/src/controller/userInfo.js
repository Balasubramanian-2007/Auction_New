// import pool from "../../../Au/src/config/db.js";
import pool from "../config/db.js";

const getUserInfo=async(req,res)=>{
    if(req.user.role!=='admin'){
        return res.status(403).json({
            message:"UnAuthorized ... You don't have rights to access this data"
        });
    }
    const userids=req.body.ids;
    if(userids.length===0){
        console.log("The user ID input array is empty");
        return res.status(200).json({
            message:"No user ID present in request",
            data:[]
        });
    }
    try{
        const userEmailDataFromCustomAuth = await pool.query(
            "SELECT userid AS user_id, email_id AS email FROM AuthTable WHERE userid = ANY($1)",
            [userids]
        );
        const userEmailDataFromOAuth = await pool.query(
            "SELECT userid AS user_id, email_id AS email FROM googleUserTable WHERE userid = ANY($1)",
            [userids]
        );

        const finalUserEmailIDs=[
            ...userEmailDataFromCustomAuth.rows,
            ...userEmailDataFromOAuth.rows
        ];

        if(finalUserEmailIDs.length===userids.length){
            return res.status(200).json({
                message:"User Email ID's",
                data:finalUserEmailIDs
            });
        }

        else{
            return res.status(404).json({
                message:"Not all user email IDs found ..."
            });
        }
    }
    catch(err){
        console.log("Error in retriving data from DB ... Error occured in userInfo.js");
        console.log(`Error:${err}`);
        return res.status(500).json({
            error:err
        });
    }
} 

export {getUserInfo};