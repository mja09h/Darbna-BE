import { Request, Response } from "express";
import { Location } from "../../models/Location";
import Routes from "../../models/Routes";
import { POI } from "../../models/POI";

export const getNearbyLocations = async (req: Request, res: Response) => {
  const { longitude, latitude, maxDistance } = req.query;
  try {
    const locations = await Location.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [
              parseFloat(longitude as string),
              parseFloat(latitude as string),
            ],
          },
          $maxDistance: parseInt(maxDistance as string), // in meters
        },
      },
    });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const getPOIsWithinPolygon = async (req: Request, res: Response) => {
  const { polygonCoordinates } = req.body; // Array of [lng, lat] arrays
  try {
    const pois = await POI.find({
      location: {
        $geoWithin: {
          $geometry: {
            type: "Polygon",
            coordinates: [polygonCoordinates],
          },
        },
      },
    });
    res.json(pois);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const getAllRoutes = async (req: Request, res: Response) => {
  try {
    const routes = await Routes.find();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const getHeatmapData = async (req: Request, res: Response) => {
  try {
    const heatmapData = await Location.aggregate([
      {
        $project: {
          lng: { $trunc: [{ $arrayElemAt: ["$location.coordinates", 0] }, 2] },
          lat: { $trunc: [{ $arrayElemAt: ["$location.coordinates", 1] }, 2] },
        },
      },
      { $group: { _id: { lng: "$lng", lat: "$lat" }, count: { $sum: 1 } } },
      {
        $project: {
          _id: 0,
          lng: "$_id.lng",
          lat: "$_id.lat",
          weight: "$count",
        },
      },
    ]);
    res.json(heatmapData);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
