import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "Access Denied: No token provided!" });
    }
    
    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedPayload;
        next();
    } 
    catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(403).json({ error: "Invalid, tampered, or expired session token!" });
    }
};

export const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: "Access Denied: You do not have Admin privileges!" });
        }
        next();
    });
};