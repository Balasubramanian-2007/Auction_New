import multer from 'multer';

// Memory storage keeps file buffers in memory for streaming directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'photo') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed for auction photo.'), false);
        }
    } else if (file.fieldname === 'video') {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files (MP4, WEBM, MOV) are allowed for auction video.'), false);
        }
    } else {
        cb(null, true);
    }
};

export const uploadAuctionMedia = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 60 * 1024 * 1024, // 60MB max file limit (covers HD videos)
    },
}).fields([
    { name: 'photo', maxCount: 1 },
    { name: 'video', maxCount: 1 },
]);
