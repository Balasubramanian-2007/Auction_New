import express from 'express';
import { verifyToken, isAdmin } from '../middleware/verifyToken.js';

import { coreBidding } from '../controller/bidController.js';
import { createAuction } from '../controller/auctionCreationController.js';
import { viewPublicAuctions, changeAuctionStatus } from '../controller/auctionViewController.js';
import { auctionHistory } from '../controller/bidHistoryController.js';
import { watchRequest } from '../controller/watchlistController.js';
import { userJoinRequest, requestList, acceptUserRequest, updateParticipantStatus } from '../controller/JoinApprovalController.js';

const router = express.Router();

// Option 1 Route Update: :id and :status as dynamic params
router.put('/auctions/:id/:status', verifyToken, isAdmin, changeAuctionStatus);

router.post('/auctions/create', verifyToken, createAuction);
router.get('/auctions/public', viewPublicAuctions);
router.get('/auctions/:id/history', verifyToken, auctionHistory);

router.post('/auctions/:id/bid', verifyToken, coreBidding);

router.post('/auctions/:id/join', verifyToken, userJoinRequest);
router.get('/auctions/requests/all', verifyToken, requestList);
router.get('/auctions/:id/requests', verifyToken, acceptUserRequest);
router.put('/auctions/:id/participants', verifyToken, updateParticipantStatus);

router.post('/auctions/:id/watchlist', verifyToken, watchRequest);

export default router;