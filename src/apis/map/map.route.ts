import { Router } from "express";
import { getNearbyLocations, getPOIsWithinPolygon, getAllRoutes, getHeatmapData, getTile } from "./map.Controller";

const mapRouter = Router();

mapRouter.get("/locations/nearby", getNearbyLocations);
mapRouter.post("/pois/within", getPOIsWithinPolygon);
mapRouter.get("/routes", getAllRoutes);
mapRouter.get("/heatmap", getHeatmapData);
mapRouter.get("/tiles/:z/:x/:y.png", getTile);

export default mapRouter;