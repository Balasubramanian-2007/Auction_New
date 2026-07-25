import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

/**
 * @param {string} userid - The unique database ID of the user
 * @param {string} username - The profile name of the user
 * @param {string} role - The role tier ('user' or 'admin')
 */

export const generateToken = (userid, username, role = 'user') => {
    const payload = { userid, username, role };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

