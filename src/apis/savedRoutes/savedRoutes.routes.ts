import { Router } from "express";
import {
  saveRoute,
  getSavedRoutes,
  getSavedRouteById,
  updateSavedRoute,
  deleteSavedRoute,
  toggleFavorite,
} from "./savedRoutes.controller";
import { auth } from "../../middlewares/auth";

const router = Router();

router.post("/", auth, saveRoute);
router.get("/", auth, getSavedRoutes);
router.get("/:id", auth, getSavedRouteById);
router.put("/:id", auth, updateSavedRoute);
router.delete("/:id", auth, deleteSavedRoute);
router.post("/:id/favorite", auth, toggleFavorite);

export default router;
