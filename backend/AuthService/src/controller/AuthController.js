import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { sendVerificationEmail } from '../utils/emailsender.js';
import pool from '../config/db.js';
import {generateToken} from '../utils/jwtSignCreater.js';

const getOAuthClient = () => {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!redirectUri) {
        throw new Error('GOOGLE_REDIRECT_URI is not configured');
    }

    return new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );
};

// const client = new OAuth2Client(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI
// );

const initiateGoogleLogin = (req, res) => {
    try {
        const client = getOAuthClient();
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;

        const url = client.generateAuthUrl({
            redirect_uri: redirectUri,
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/userinfo.profile','https://www.googleapis.com/auth/userinfo.email'],
            prompt: 'consent'
        });

        return res.redirect(url);
    } 
    catch (error) {
        console.error('Google OAuth config error:', error.message);
        return res.status(500).json({ error: 'Google OAuth is not configured correctly.' });
    }
};

const handleGoogleCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({ error: 'Missing Google authorization code.' });
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const client = getOAuthClient();

    const redirectWithToken = (token, userData, status = 'Verified') => {
        const params = new URLSearchParams({
            token,
            user: JSON.stringify(userData),
            status
        });
        return res.redirect(`${frontendUrl}/login?${params.toString()}`);
    };
    try {
        const { tokens } = await client.getToken({
            code,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI
        });
        client.setCredentials(tokens);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        console.log("User Google Data:", payload);
        const { email, name, sub } = payload;

        try {
            const manualUserCheck = await pool.query("SELECT userid, username, email_id,role FROM AuthTable WHERE email_id = $1", [email]);

            if (manualUserCheck.rows.length > 0) {
                const user = manualUserCheck.rows[0];
                const userData = { user_id: user.userid, username: user.username, email: user.email_id, role: user.role };
                const JWTtokenForUser = generateToken(user.userid, user.username, user.role);
                return redirectWithToken(JWTtokenForUser, userData, 'Verified');
            }

            const googleUserCheck = await pool.query("SELECT userid, username, email_id,role FROM googleUserTable WHERE email_id = $1", [email]);

            if (googleUserCheck.rows.length > 0) {
                const user = googleUserCheck.rows[0];
                const userData = { user_id: user.userid, username: user.username, email: user.email_id, role: user.role };
                const JWTtokenForUser = generateToken(user.userid, user.username, user.role);
                return redirectWithToken(JWTtokenForUser, userData, 'Verified');
            }

            const uniqueUserId = `goo_${sub.substring(0, 10)}`;
            const role = 'user';
            await pool.query(
                `INSERT INTO googleUserTable (userid, username, email_id, google_sub_id,role) VALUES ($1, $2, $3, $4,$5)`,
                [uniqueUserId, name, email, sub, role]
            );

            const userData = { user_id: uniqueUserId, username: name, email, role };
            const JWTtokenForUser = generateToken(uniqueUserId, name, role);
            return redirectWithToken(JWTtokenForUser, userData, 'Verified');
        } catch (dbError) {
            console.error("Database query failed during Google OAuth:", dbError);
            return res.status(500).json({ error: "Internal database server error" });
        }
    } catch (error) {
        console.error("Error during Google OAuth exchange:", error);
        return res.status(500).json({ error: "Authentication failed" });
    }
};

const login=async(req,res)=>{
    const {userID,userPassword}=req.body;
    try{
        const dbquery=await pool.query("SELECT username,role,password,isverified FROM AuthTable WHERE userid=$1",[userID]);
        const user = dbquery.rows[0];
        if(dbquery.rows.length===0){
            return res.json({message:"User doesn't Exist"});
        }
        const isMatch=await bcrypt.compare(userPassword,dbquery.rows[0].password);
        const isverified=dbquery.rows[0].isverified;
        
        if(isMatch && isverified){
            const JWTtokenForUser=generateToken(userID,user.username,user.role);
            return res.json({Token:JWTtokenForUser,
                Status:"Verified",
                Message:"You can enter now",
                user: { user_id: userID, username: user.username, role: user.role }
            });
        }
        else if(!isverified){
            return res.json({message:"Verify your account and then login"});
        }
        else{
            return res.sendStatus(401);
        }
    }
    catch(err){
        console.log("There is some error in Login part DB");
        return res.sendStatus(500);
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