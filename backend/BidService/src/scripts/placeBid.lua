-- KEYS[1] : Redis Key for high bid (e.g., "auction:101:high_bid")
-- KEYS[2] : Redis Set Key for approved users (e.g., "auction:101:approved_users")
-- ARGV[1] : Incoming bid amount
-- ARGV[2] : Bidder user_id

local is_approved = redis.call('SISMEMBER', KEYS[2], ARGV[2])
if is_approved == 0 then
    return -1 
end

local current_bid = redis.call('GET', KEYS[1])

if tonumber(ARGV[1]) > tonumber(current_bid) then
    redis.call('SET', KEYS[1], ARGV[1])
    return 1 
else
    return 0 
end