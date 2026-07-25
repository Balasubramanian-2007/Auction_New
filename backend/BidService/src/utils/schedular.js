import pool  from "../config/db";
import cron from 'node-cron';

const checkSchedular = cron.schedule('* * * * *', async()=>
    {
        console.log("Schedular running for StartTime checking ...");
        const now = new Date();
        // const currTime=now.toISOString();
        try{
            await pool.query(
                "UPDATE auction SET status='LIVE' WHERE start_time <= $1",[now]
            );
            console.log(`Schedular Updated status for ${now}`);
        }
        catch(err){
            console.log("Error occured in schedular LIVE part");
            console.log(`Error : ${err}`);
        }
        console.log("Schedular running for EndTime checking ...");
        try{
            await pool.query(
                "UPDATE auction SET status='COMPLETED' WHERE status='LIVE' AND end_time <= $1",[now]
            );
            console.log(`Schedular Updated status for ${now}`);
        }
        catch(err){
            console.log("Error occured in schedular END part");
            console.log(`Error : ${err}`);
        }
    }
)

export {checkSchedular};