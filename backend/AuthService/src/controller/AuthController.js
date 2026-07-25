import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { sendVerificationEmail } from '../utils/emailsender.js';
import pool from '../config/db.js';
import {generateToken} from '../utils/jwtSignCreater.js';

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const initiateGoogleLogin = (req, res) => {
    const url = client.generateAuthUrl({
        access_type: 'offline', // Demands a Refresh Token along with the Access Token
        scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'], 
        prompt: 'consent'       // Forces Google to show the screen every time for testing
    });
    
    res.redirect(url);
};

const handleGoogleCallback = async (req, res) => {
    const { code } = req.query; 

    try {
        // Exchange the 1-time Authorization Code for Tokens
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        // Fetch the user's Google profile information using the active Access Token
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        console.log("User Google Data:", payload);
        const { email, name, picture,sub } = payload;
        try {
            const manualUserCheck = await pool.query("SELECT userid, username, email_id,role FROM AuthTable WHERE email_id = $1", [email]);

            if (manualUserCheck.rows.length > 0) {
                const user = manualUserCheck.rows[0];
                console.log("User found in manual userTable:", user.user_id);
                const JWTtokenForUser=generateToken(user.userid,user.username,user.role);
                return res.json({
                    Status: 200,
                    Message: "Logged in successfully (Manual Account)!",
                    Token:JWTtokenForUser,
                    user: { user_id: user.user_id, username: user.username, email: user.email_id ,role:user.role}
                });
            }

            const googleUserCheck = await pool.query("SELECT userid, username, email_id,role FROM googleUserTable WHERE email_id = $1", [email]);

            if (googleUserCheck.rows.length > 0) {
                const user = googleUserCheck.rows[0];
                console.log("User found in googleUserTable:", user.user_id);
                const JWTtokenForUser=generateToken(user.userid,user.username,user.role);
                return res.json({
                    Status: 200,
                    Message: "Logged in successfully (Google Account)!",
                    Token:JWTtokenForUser,
                    user: { user_id: user.user_id, username: user.username, email: user.email_id,role:user.role}
                });
            }

            const uniqueUserId = `goo_${sub.substring(0, 10)}`;
            const role='user';
            await pool.query(
                `INSERT INTO googleUserTable (userid, username, email_id, google_sub_id,role) VALUES ($1, $2, $3, $4,$5)`,
                [uniqueUserId, name, email, sub,role]
            );

            console.log("Registered new user directly into googleUserTable:", uniqueUserId);

            const JWTtokenForUser=generateToken(uniqueUserId,name,role);
            return res.json({
                Status: 201,
                Token:JWTtokenForUser,
                Message: "Account created via Google successfully!",
                user: { user_id: uniqueUserId, username: name, email:email}
            });
        } 
        catch (dbError) {
            console.error("Database query failed during Google OAuth:", dbError);
            return res.status(500).json({ error: "Internal database server error" });
        }        
    }
    catch (error) {
        console.error("Error during Google OAuth exchange:", error);
        res.status(500).json({ error: "Authentication failed" });
    }
};

const login=async(req,res)=>{
    const {userID,userPassword}=req.body;
    try{
        const dbquery=await pool.query("SELECT username,role,password,isverified FROM AuthTable WHERE userid=$1",[userID]);
        const user = dbquery.rows[0];
        if(dbquery.rows.length===0){
            res.json({message:"User doesn't Exist"});
        }
        const isMatch=await bcrypt.compare(userPassword,dbquery.rows[0].password);
        const isverified=dbquery.rows[0].isverified;
        
        if(isMatch && isverified){
            const JWTtokenForUser=generateToken(userID,user.username,user.role);
            res.json({Token:JWTtokenForUser,
                Status:"Verified",
                Message:"You can enter now",
                user: { user_id: userID, username: user.username, role: user.role }
            });
        }
        else if(!isverified){
            res.json({message:"Verify your account and then login"});
        }
        else{
            res.Status(401);
        }
    }
    catch(err){
        console.log("There is some error in Login part DB");
        res.sendStatus(500);
    }
};

const register=async(req,res)=>{
    const {userid,email_id,password,username,phone_number,address}=req.body;
    const saltRounds=12;
    const hashedPassword=await bcrypt.hash(password,saltRounds);
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp=crypto.randomInt(100000,1000000).toString();
    try{
        
        await pool.query("INSERT INTO AuthTable(userid,email_id,password,username,ph_no,address,otp) VALUES($1,$2,$3,$4,$5,$6,$7)",[userid,email_id,hashedPassword,username,phone_number,address,otp]);
        await sendVerificationEmail(email_id,otp);
        res.json({Status:200,message:"Registered and OTP sent"}); 
    }
    catch(err){
        if(err.code=='23505'){
            res.json({Invalid:"User Already Exists"});
        }
        else {
            res.json({errMsg: "Some fields are invalid !" });
            console.log(err);
        }
    }
};

const verifyRegistration=async(req,res)=>{
    const{userid,otp_received_from_user}=req.body;
    try{
        const dbquery=await pool.query("SELECT otp FROM AuthTable WHERE userid=$1",[userid]);
        if (dbquery.rows.length === 0) {
            return res.json({ error: "User not found" });
        }
        if(dbquery.rows[0].otp===otp_received_from_user){
            await pool.query("UPDATE AuthTable SET isverified=TRUE WHERE userid=$1",[userid]);
            res.json({Status:200,message:"Successfully Verified"});
        }
        else{
            res.json({message:"Invalid OTP"});
        }
    }
    catch(err){
        console.log("There is an error in verifyRegistration");
        res.sendStatus(500);
    }
};

export {login,register,verifyRegistration,initiateGoogleLogin,handleGoogleCallback};