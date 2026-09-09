import { bidApi } from './client';

// --- Browsing ---
export const getPublicAuctions = () => bidApi.get('/auctions/public');
export const getAuctionById = (id) => bidApi.get(`/auctions/${id}`);
export const getAuctionBidLog = (id) => bidApi.get(`/auctions/${id}/bids`);
export const getMyAuctions = () => bidApi.get('/auctions/mine');

// --- Seller actions ---
export const createAuction = (payload) => bidApi.post('/auctions/create', payload);
export const endAuctionManually = (id) => bidApi.post(`/auctions/${id}/end`);

// --- Bidding ---
export const placeBid = (id, amount) => bidApi.post(`/auctions/${id}/bid`, { amount });

// --- Join / participation (private auctions) ---
export const requestToJoin = (id) => bidApi.post(`/auctions/${id}/join`);
export const requestToWatch = (id) => bidApi.post(`/auctions/${id}/watch-request`);
export const getAllPendingRequests = () => bidApi.get('/auctions/requests/all');
export const getPendingRequestsForAuction = (id) => bidApi.get(`/auctions/${id}/requests`);
export const updateParticipantStatus = (id, target_user_id, status, field = 'bid') =>
  bidApi.put(`/auctions/${id}/participants`, { target_user_id, status, field });

// --- Watchlist ---
export const toggleWatchlist = (id) => bidApi.post(`/auctions/${id}/watchlist`);
export const getMyWatchlist = () => bidApi.get('/watchlist/mine');

// --- Admin ---
export const adminGetAllAuctions = () => bidApi.get('/admin/auctions/all');
export const adminChangeAuctionStatus = (id, status) => bidApi.put(`/auctions/${id}/${status}`);

export const getMyParticipation = (id) => bidApi.get(`/auctions/${id}/my-participation`);

// --- Shipment Proof ---
export const submitShipmentProof = (id, payload) => bidApi.post(`/auctions/${id}/shipment-proof`, payload);
export const getShipmentProof = (id) => bidApi.get(`/auctions/${id}/shipment-proof`);
