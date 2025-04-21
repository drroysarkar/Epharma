import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now(); // Unique fallback
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.split('.')[0].replace(/\s+/g, '_').toLowerCase(); // optional
    cb(null, `${safeName}_${timestamp}${ext}`);
  },
});

const upload = multer({ storage });

export default upload;
