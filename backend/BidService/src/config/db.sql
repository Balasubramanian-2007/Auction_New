CREATE TABLE auction(
    auction_id SERIAL PRIMARY KEY,
    title VARCHAR(100),
    description TEXT,
    initiator_id INT NOT NULL,
    starting_price INT DEFAULT 100,
    auction_type VARCHAR(3) DEFAULT 'PUB', --PUB/PVT
    status VARCHAR(30) DEFAULT 'SCHEDULED', 
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE bids(
    bid_id SERIAL PRIMARY KEY,
    auction_id INT NOT NULL,
    bidder_id INT NOT NULL,
    bid_amount INT NOT NULL,
    bidstatus VARCHAR(3) NOT NULL, 
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(auction_id) REFERENCES auction(auction_id)
)

CREATE TABLE participants(
    participant_id SERIAL PRIMARY KEY ,
    user_id INT NOT NULL,
    username VARCHAR(100),
    auction_id INT REFERENCES auction(auction_id),
    approval_status VARCHAR(30) DEFAULT 'PENDING', --APPROVED / REJECTED
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id,auction_id)
)


CREATE TABLE watchlist(
    auction_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY(auction_id) REFERENCES auction(auction_id),
    CONSTRAINT UNIQUE(auction_id,user_id)
)
