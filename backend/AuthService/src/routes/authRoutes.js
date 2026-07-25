import express from 'express';
import { login,register,verifyRegistration } from '../controller/AuthController.js';
import { initiateGoogleLogin, handleGoogleCallback } from '../controller/AuthController.js';
import { verifyAdmin } from '../middleware/verifyToken.js';

const router = express.Router();

router.post("/register", register);       // Step 1: Submits info, sends OTP email
router.post("/verify-signup",verifyRegistration); // Step 2: Validates OTP, activates user
router.post("/login", login);             // Step 3: Normal login (only works if verified)

router.get('/google', initiateGoogleLogin);
router.get('/google/callback', handleGoogleCallback);

router.post('/auction/cancel-bid', verifyAdmin, (req, res) => {
    console.log(`Admin ${req.user.userid} is cancelling a bid.`);
    res.json({ success: true, message: "Bid cancelled successfully by Admin!" });
});

export default router;
