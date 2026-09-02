import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const { Pool } = pkg;
const dbPassword = String(process.env.DB_PASSWORD ?? '');

if (!dbPassword || dbPassword === 'undefined' || dbPassword === 'null') {
    throw new Error('AuthService DB_PASSWORD is missing or invalid. Check backend/AuthService/.env');
}

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'AuthForM',
    password: dbPassword,
    port: 5432,
});

export default pool;