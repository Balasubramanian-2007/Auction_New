import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

let instance = null;

export const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error('Razorpay test keys are not set in .env (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)');
    }

    if (!instance) {
        instance = new Razorpay({ key_id, key_secret });
    }
    return instance;
};

// Safe proxy object so server startup never throws even if keys are not yet configured
const razorpay = {
    get orders() {
        return getRazorpayInstance().orders;
    }
};

export default razorpay;
