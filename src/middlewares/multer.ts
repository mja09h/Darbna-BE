import multer from "multer";
import path from "path";

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads"));
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + file.originalname);
  },

});

const upload = multer({ storage: storage });

// Middleware for handling multiple images (max 4) for pins
export const uploadPinImages = upload.array('images', 4);

export default upload;