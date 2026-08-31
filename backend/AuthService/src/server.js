import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import app from './app.js';


const server=app;
const PORT=4000;
server.listen(PORT,()=>{
    console.log(`Auth Server running in PORT : ${PORT}`);
});