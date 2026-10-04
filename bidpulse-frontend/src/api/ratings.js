import { bidApi } from './client';

export const submitRating = (auctionId, { stars }) =>
  bidApi.post(`/auctions/${auctionId}/rating`, { stars });

export const getMyRatingStatus = (auctionId) =>
  bidApi.get(`/auctions/${auctionId}/rating/my-status`);

export const getSellerRating = (userId) =>
  bidApi.get(`/users/${userId}/rating`);

export const getSellerRatingsBatch = (ids) =>
  bidApi.post('/users/ratings', { ids });
