import { Router } from "express";
import { createPin, getPins, getPinById, updatePin, deletePin, getPinsByUserId, getPinsByCategory, getPinsByTitle, getCategories } from "./pins.controller";
import upload from "../../middlewares/multer";

const pinsRouter = Router();

pinsRouter.post('/', upload.single('image'), createPin);
pinsRouter.get('/categories', getCategories);
pinsRouter.get('/', getPins);
pinsRouter.get('/:id', getPinById);
pinsRouter.put('/:id', upload.single('image'), updatePin);
pinsRouter.delete('/:id', deletePin);
pinsRouter.get('/user/:userId', getPinsByUserId);
pinsRouter.get('/category/:category', getPinsByCategory);
pinsRouter.get('/title/:title', getPinsByTitle);

export default pinsRouter;