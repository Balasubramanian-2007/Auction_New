# BidPulse

A live auction/bidding platform built to learn and apply microservice architecture, real-time communication, and the practical problems that come up when building a multi-service system from scratch (auth, concurrency, scheduled jobs, and third-party integrations).

## Objective

Build a working auction site where any user can both list items for auction and bid on other users' listings, with:
- Secure authentication (manual signup + Google OAuth)
- Real-time bid updates visible to everyone watching an auction, without polling or manual refresh
- A seller-approval workflow for both bidding and watching, applied consistently to public and private auctions
- Supporting features that a real transactional platform needs: post-sale shipment proof, a payment step, and a seller reputation system

## Outcome

A functioning three-part system:
- **AuthService** — handles signup, OTP email verification, login, and Google OAuth.
- **BidService** — owns everything about auctions: listing, bidding, approvals, watchlisting, live updates, shipment proof, simulated payment, and ratings.
- **Frontend** — a React single-page app covering the full user flow from registration through winning and paying for an auction.

All core flows are working and have been tested across multiple concurrent browser sessions on a local network, including real-time bid propagation via WebSockets.

## Tech stack and why

| Layer | Choice | Reason |
|---|---|---|
| Backend | Node.js + Express | Split into two independent services so identity (AuthService) and auction/bidding logic (BidService) aren't coupled — either can be worked on, deployed, or scaled separately. |
| Database | PostgreSQL | Auctions, bids, participants, ratings, and payments are relational and need consistency (e.g. a bid shouldn't be recorded against an auction that doesn't exist, or twice for the same request). |
| Cache / real-time state | Redis | Used for atomic bid validation — a Lua script checks and updates the current high bid and the approved-bidders set as a single atomic operation, avoiding race conditions when multiple bids land close together. |
| Real-time updates | Socket.IO | Broadcasts new bids to everyone viewing an auction immediately, instead of requiring a page refresh or polling the server. |
| Background jobs | BullMQ + node-cron | A cron job flips auction status on schedule (UPCOMING → LIVE → COMPLETED) and queues watchlist "auction ended" notification emails as jobs rather than sending them inline. |
| Auth | JWT + bcrypt + Google OAuth2 | Stateless tokens shared across both services without a shared session store; bcrypt for password hashing; OAuth as an alternative to manual signup. |
| Frontend | React + Vite | Fast dev feedback loop, component-based structure suited to the number of distinct pages/roles in this app. |
| Payments | Razorpay (test mode) | Demonstrates a full order-creation → checkout → signature-verification payment flow without handling real money. |
| Email | Nodemailer | OTP delivery during signup and auction-result notifications. |

## Core features

- Manual signup with OTP email verification, or Google OAuth login
- Two roles: `user` (can list and bid on different auctions with the same account) and `admin` (platform-wide oversight)
- Public and private auctions — bidding requires seller approval on **every** auction regardless of type; watching requires separate seller approval **only** on private auctions
- Real-time bid updates via WebSocket rooms (one room per auction)
- Mandatory post-auction shipment proof: sellers must submit courier/tracking details within a fixed window after an auction ends, visible only to the seller and the winning bidder
- Simulated payment flow (Razorpay test mode) for the winning bidder
- Seller reputation via a Wilson-score confidence rating (1–3 stars counted as negative, 4–5 as positive), computed from buyer ratings submitted within a time-limited window after an auction ends
- User search by name or email
- Admin panel: view and control every auction's status, look up a user's email by ID

## Architecture

```
mservices/
├── backend/
│   ├── AuthService/      (port 4000 — signup, OTP, login, Google OAuth)
│   └── BidService/        (port 3000 — auctions, bids, approvals, payments, ratings)
└── bidpulse-frontend/      (React + Vite, port 5173 in dev)
```

The two backend services are intentionally separate processes with their own `server.js`, own routes, and no shared code — they communicate over plain HTTP when one needs something from the other (e.g. BidService resolving a user's email via AuthService for notification emails), the same way they'd communicate with any external service.

## Running locally

Prerequisites: Node.js, PostgreSQL, Redis.

```bash
# AuthService
cd backend/AuthService && npm install && node src/server.js

# BidService
cd backend/BidService && npm install && node src/server.js

# Frontend
cd bidpulse-frontend && npm install && npm run dev
```

Each service needs its own `.env`. Variables used across the project:

```
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
EMAIL_USER=
EMAIL_APP_CODE=
REDIS_HOST=
REDIS_PORT=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
FRONTEND_URL=
```

The frontend reads its backend URLs from its own `.env`:
```
VITE_AUTH_API_URL=http://localhost:4000
VITE_BID_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

## Known limitations

- Product images/videos are captured client-side but not yet uploaded to real cloud storage — this is stubbed pending a Multer + Cloudinary integration.
- Payments are Razorpay **test mode only** — no real transactions are possible or intended.
- No horizontal scaling consideration yet (single instance of each service, single Redis/Postgres).
