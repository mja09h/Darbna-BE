import { Router } from "express";
import {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
} from "./folders.controller";
import { auth } from "../../middlewares/auth";

const router = Router();

router.post("/", auth, createFolder);
router.get("/", auth, getFolders);
router.get("/:id", auth, getFolderById);
router.put("/:id", auth, updateFolder);
router.delete("/:id", auth, deleteFolder);

export default router;
