CREATE TABLE AuthTable (
    user_id VARCHAR(50) PRIMARY KEY,       
    username VARCHAR(100) NOT NULL,        
    email_id VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,                
    phone_number VARCHAR(10),
    address VARCHAR(500),
    creation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isverified BOOLEAN DEFAULT FALSE,     
    otp_code VARCHAR(6)                    
);

CREATE TABLE googleUserTable (
    userid VARCHAR(50) PRIMARY KEY,      
    username VARCHAR(100) NOT NULL,        
    email_id VARCHAR(100) UNIQUE NOT NULL, 
    google_sub_id VARCHAR(100) UNIQUE NOT NULL, 
    creation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);