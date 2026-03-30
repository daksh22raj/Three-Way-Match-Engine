import multer from 'multer';
import path from 'path';

// Setup storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Will create if using fs later, or just use memory storage for simplicity
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Since Render / Heroku might spin down, memoryStorage is safer unless we just parse on the fly. Let's use memory storage for parsing directly without saving to disk!
const memoryStorage = multer.memoryStorage();

export const upload = multer({ storage: memoryStorage });
