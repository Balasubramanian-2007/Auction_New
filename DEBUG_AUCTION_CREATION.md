# Auction Creation Debugging Guide

## Current Status
- Form successfully appears and accepts input
- Backend returns "Internal Server Error during auction generation"
- Services running: AuthService (4000), BidService (3000), Frontend (5174)

## Step 1: Verify Database Schema
Run this SQL query in pgAdmin against the BidForM database:

```sql
-- Check if auction table exists and its exact columns
\d auction
```

This will show you the actual columns, data types, and constraints.

## Step 2: Test INSERT Directly in pgAdmin
Replace with your actual user ID and run:

```sql
INSERT INTO auction(
  title,
  description,
  initiator_id,
  starting_price,
  auction_type,
  start_time,
  end_time,
  status
) VALUES(
  'Test Auction',
  'This is a test auction description',
  1,
  100,
  'PUB',
  '2026-09-02 14:00:00',
  '2026-09-02 16:00:00',
  'UPCOMING'
) RETURNING auction_id;
```

If this works in pgAdmin, the table is correct.

## Step 3: Check Backend Logs
The BidService should now log detailed debugging information when you try to create an auction:

```
Create auction request received:
  title: [value]
  description: [value]
  starting_price: [value] type: [type]
  auction_type: [value]
  initiator_id: [value]
  start_time (input): [value]
  start_time (Date): [value]
  end_time (input): [value]
  end_time (Date): [value]
  Inserting with:
    start_time (DB): [value]
    end_time (DB): [value]
```

## Step 4: Test Create Auction via Frontend
1. Go to http://localhost:5174/dashboard
2. Fill in the form:
   - Title: "Test Bike"
   - Description: "A test auction"
   - Starting Price: 5000
   - Auction Type: Public
   - Start Time: (tomorrow at 10:00)
   - End Time: (tomorrow at 12:00)
3. Click "List Auction"
4. Check terminal output for debug logs

## Possible Issues

### Issue 1: status Column Doesn't Exist
**Fix**: Remove 'status' from INSERT statement, let it use the DEFAULT

### Issue 2: Timestamp Format Wrong
**Current Fix**: Converting ISO to "YYYY-MM-DD HH:MM:SS" format

### Issue 3: Integer Conversion Failed
**Current Fix**: Ensuring starting_price is Math.round(Number(...))

### Issue 4: Foreign Key Constraint
**Check**: Verify initiator_id exists in the users table (if there's a foreign key)

## Files Modified
- `backend/BidService/src/controller/auctionCreationController.js` - Added debug logging, timestamp conversion, non-blocking Redis
- `frontend/auction/src/pages/DashboardPage.jsx` - Ensure starting_price is integer

## Next Steps If Still Failing
1. Share the console output from BidService when form is submitted
2. Share the result of the direct SQL INSERT test in pgAdmin
3. Run `\d auction` in pgAdmin to show actual table schema
