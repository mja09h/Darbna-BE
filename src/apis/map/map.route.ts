import express from "express";
import {
  getNearbyLocations,
  getPOIsWithinPolygon,
  getAllRoutes,
  getTile,
} from "./map.Controller";

const router = express.Router();

router.get("/locations", getNearbyLocations);
router.post("/pois/within", getPOIsWithinPolygon);
router.get("/routes", getAllRoutes);
router.get("/tiles/:z/:x/:y.png", getTile);

// The /heatmap route has been removed

export default router;
