import express from 'express';
import { verifyToken, isAdmin } from '../middleware/verifyToken.js';

import { coreBidding } from '../controller/bidController.js';
import { createAuction, endAuctionManually } from '../controller/auctionCreationController.js';
import { viewPublicAuctions, changeAuctionStatus, viewAllAuctionsAdmin, getAuctionById, getMyAuctions } from '../controller/auctionViewController.js';
import { auctionHistory, getAuctionBidLog } from '../controller/bidHistoryController.js';
import { watchRequest, getMyWatchlist } from '../controller/watchlistController.js';
import { userJoinRequest, requestList, acceptUserRequest, updateParticipantStatus, getMyParticipationStatus, requestToWatch } from '../controller/JoinApprovalController.js';
import { submitShipmentProof, getShipmentProof } from '../controller/shipmentController.js';

const router = express.Router();

// --- Static/specific GET routes MUST come before dynamic :id routes ---
router.get('/auctions/public', viewPublicAuctions);
router.get('/auctions/mine', verifyToken, getMyAuctions);
router.get('/auctions/requests/all', verifyToken, requestList);
router.get('/watchlist/mine', verifyToken, getMyWatchlist);
router.get('/admin/auctions/all', verifyToken, isAdmin, viewAllAuctionsAdmin);

// --- Auction creation & lifecycle ---
router.post('/auctions/create', verifyToken, createAuction);
router.post('/auctions/:id/end', verifyToken, endAuctionManually);

// --- Participation PUT routes MUST come before the generic /:id/:status admin route ---
router.put('/auctions/:id/participants', verifyToken, updateParticipantStatus);
router.put('/auctions/:id/:status', verifyToken, isAdmin, changeAuctionStatus);

// --- Dynamic :id GET routes ---
router.get('/auctions/:id', verifyToken, getAuctionById);
router.get('/auctions/:id/bids', verifyToken, getAuctionBidLog);
router.get('/auctions/:id/history', verifyToken, auctionHistory);
router.get('/auctions/:id/requests', verifyToken, acceptUserRequest);
router.get('/auctions/:id/my-participation', verifyToken, getMyParticipationStatus);

// --- Bidding ---
router.post('/auctions/:id/bid', verifyToken, coreBidding);

// --- Join / participation ---
router.post('/auctions/:id/join', verifyToken, userJoinRequest);
router.post('/auctions/:id/watch-request', verifyToken, requestToWatch);

// --- Watchlist (public auctions only — see watchlistController) ---
router.post('/auctions/:id/watchlist', verifyToken, watchRequest);

// --- Shipment Proof (post-auction delivery tracking) ---
router.post('/auctions/:id/shipment-proof', verifyToken, submitShipmentProof);
router.get('/auctions/:id/shipment-proof', verifyToken, getShipmentProof);

export default router;