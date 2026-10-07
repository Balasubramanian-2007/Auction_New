import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Uploads a file buffer to Cloudinary using upload_stream.
 * @param {Buffer} buffer - File buffer from Multer memoryStorage
 * @param {Object} options - Cloudinary upload options (e.g. folder, resource_type)
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadBufferToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'bidpulse_auctions',
                resource_type: 'auto',
                ...options,
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

export default cloudinary;
