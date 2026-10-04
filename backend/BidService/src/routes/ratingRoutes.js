import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { submitRating, getMyRatingStatus, getSellerRating, getSellerRatingsBatch } from '../controller/ratingController.js';

const router = express.Router();

router.post('/auctions/:id/rating', verifyToken, submitRating);
router.get('/auctions/:id/rating/my-status', verifyToken, getMyRatingStatus);
router.get('/users/:userId/rating', verifyToken, getSellerRating);
router.post('/users/ratings', verifyToken, getSellerRatingsBatch);

export default router;
