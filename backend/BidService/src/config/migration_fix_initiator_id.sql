-- Migration to fix schema mismatch between AuthService and BidService
-- The auction table's initiator_id should be VARCHAR to match AuthTable's user_id

-- Run this in pgAdmin on the BidForM database

-- Step 1: Drop the foreign key constraint if it exists
-- ALTER TABLE auction DROP CONSTRAINT IF EXISTS auction_initiator_id_fkey;

-- Step 2: Alter the initiator_id column from INT to VARCHAR
ALTER TABLE auction 
ALTER COLUMN initiator_id SET DATA TYPE VARCHAR(50);

-- Step 3: If there's a participants table that also references user IDs, fix that too
ALTER TABLE participants 
ALTER COLUMN user_id SET DATA TYPE VARCHAR(50);

-- Step 4: Fix bids table if it has bidder_id that should also be VARCHAR
ALTER TABLE bids 
ALTER COLUMN bidder_id SET DATA TYPE VARCHAR(50);

-- Step 5: Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('auction', 'participants', 'bids') 
AND column_name IN ('initiator_id', 'user_id', 'bidder_id')
ORDER BY table_name, column_name;
