import { Router } from "express";
import { createPin, getPins, getPinById, updatePin, deletePin, getPinsByUserId, getPinsByCategory, getPinsByTitle, getCategories } from "./pins.controller";
import { uploadPinImages } from "../../middlewares/multer";
import { auth } from "../../middlewares/auth";

const pinsRouter = Router();

// Public endpoints - anyone can view pins and categories
pinsRouter.get('/categories', getCategories);
pinsRouter.get('/', getPins);
pinsRouter.get('/:id', getPinById);
pinsRouter.get('/user/:userId', getPinsByUserId);
pinsRouter.get('/category/:category', getPinsByCategory);
pinsRouter.get('/title/:title', getPinsByTitle);

// Protected endpoints - require authentication
pinsRouter.post('/', auth, uploadPinImages, createPin);
pinsRouter.put('/:id', auth, uploadPinImages, updatePin);
pinsRouter.delete('/:id', auth, deletePin);

export default pinsRouter;