import { Router } from "express";
import { getNearbyLocations, getPOIsWithinPolygon, getAllRoutes, getHeatmapData } from "./map.Controller";

const mapRouter = Router();

mapRouter.get("/locations/nearby", getNearbyLocations);
mapRouter.post("/pois/within", getPOIsWithinPolygon);
mapRouter.get("/routes", getAllRoutes);
mapRouter.get("/heatmap", getHeatmapData);

export default mapRouter;