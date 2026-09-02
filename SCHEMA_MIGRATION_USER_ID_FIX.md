# Schema Migration Guide - Fix User ID Type Mismatch

## Problem Found
The `auction` table in BidService expects `initiator_id` as `INT`, but AuthService stores user IDs as `VARCHAR(50)` strings (like "user1234", "goo_xxxxx").

This causes error: `invalid input syntax for type integer: "user1234"`

## Solution
Convert the affected columns from INT to VARCHAR(50) in the BidForM database.

## Step-by-Step Instructions

### 1. Open pgAdmin and connect to BidForM database

### 2. Run the following SQL migration script:

```sql
-- Migration: Convert INT user ID columns to VARCHAR(50)
-- This aligns BidService schema with AuthService user ID format

-- Fix the auction table
ALTER TABLE auction 
ALTER COLUMN initiator_id SET DATA TYPE VARCHAR(50);

-- Fix the participants table
ALTER TABLE participants 
ALTER COLUMN user_id SET DATA TYPE VARCHAR(50);

-- Fix the bids table
ALTER TABLE bids 
ALTER COLUMN bidder_id SET DATA TYPE VARCHAR(50);

-- Verify the changes
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('auction', 'participants', 'bids') 
AND column_name IN ('initiator_id', 'user_id', 'bidder_id')
ORDER BY table_name, column_name;
```

### 3. Expected Output
After running the verification query, you should see:

| table_name   | column_name   | data_type   |
|--------------|---------------|-------------|
| auction      | initiator_id  | character varying |
| bids         | bidder_id     | character varying |
| participants | user_id       | character varying |

### 4. Test the fix
1. Go back to http://localhost:5174/dashboard
2. Fill out the auction creation form
3. Click "List Auction"
4. The auction should now be created successfully!

## Why This Works
- AuthService stores user IDs as strings in AuthTable (VARCHAR(50))
- JWT tokens contain these string IDs (userid: "user1234")
- BidService controllers extract req.user.userid as strings
- Database schema now matches this reality

## Affected Endpoints
These endpoints now work with string user IDs:
- POST /api/v1/auctions/create
- POST /api/v1/auctions/:id/bid
- POST /api/v1/auctions/:id/join
- POST /api/v1/auctions/:id/watchlist
- GET /api/v1/auctions/requests/all
- GET /api/v1/auctions/:id/requests
- PUT /api/v1/auctions/:id/participants
