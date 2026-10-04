import pool from '../config/db.js';

const searchUsers = async (req, res) => {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
        return res.json({ message: "Enter at least 2 characters", data: [] });
    }
    const like = `%${q}%`;
    try {
        const customAuthResults = await pool.query(
            "SELECT userid AS user_id, username, email_id AS email FROM AuthTable WHERE username ILIKE $1 OR email_id ILIKE $1 LIMIT 20",
            [like]
        );
        const googleResults = await pool.query(
            "SELECT userid AS user_id, username, email_id AS email FROM googleUserTable WHERE username ILIKE $1 OR email_id ILIKE $1 LIMIT 20",
            [like]
        );
        const merged = [...customAuthResults.rows, ...googleResults.rows];
        return res.json({ message: "Search results", data: merged });
    } catch (err) {
        console.error("Error in userSearchController:", err);
        return res.status(500).json({ message: "Search failed" });
    }
};

export { searchUsers };
