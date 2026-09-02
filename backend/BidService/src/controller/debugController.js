import pool from "../config/db.js";

const debugAllAuctions = async(req,res)=>{
    try{
        const allAuctions = await pool.query(
            "SELECT auction_id, title, auction_type, status, start_time, end_time, NOW() as current_time FROM auction ORDER BY created_at DESC LIMIT 10"
        );
        
        console.log("=== DEBUG: All Auctions ===");
        console.log("Current server time:", new Date().toISOString());
        allAuctions.rows.forEach(row => {
            console.log(`
ID: ${row.auction_id}
Title: ${row.title}
Type: ${row.auction_type}
Status: ${row.status}
Start: ${row.start_time}
End: ${row.end_time}
DB Now: ${row.current_time}
---`);
        });
        
        return res.json({
            debug: true,
            server_time: new Date().toISOString(),
            data: allAuctions.rows
        });
    }
    catch(err){
        console.error("Debug error:", err);
        return res.status(500).json({error: err.message});
    }
}

export {debugAllAuctions};
