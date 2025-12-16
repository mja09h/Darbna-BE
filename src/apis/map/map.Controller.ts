import { Request, Response } from "express";
import axios from "axios";
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

export const getTile = async (req: Request, res: Response) => {
  const { z, x, y } = req.params;

  try {
    // Validate tile coordinates
    const zoom = parseInt(z);
    const tileX = parseInt(x);
    const tileY = parseInt(y.replace('.png', '')); // Remove .png extension if present

    // Validate zoom level (0-19 is standard for OSM)
    if (isNaN(zoom) || zoom < 0 || zoom > 19) {
      return res.status(400).json({ message: "Invalid zoom level. Must be between 0 and 19." });
    }

    // Validate tile coordinates
    const maxTile = Math.pow(2, zoom);
    if (isNaN(tileX) || tileX < 0 || tileX >= maxTile) {
      return res.status(400).json({ message: "Invalid tile X coordinate." });
    }
    if (isNaN(tileY) || tileY < 0 || tileY >= maxTile) {
      return res.status(400).json({ message: "Invalid tile Y coordinate." });
    }

    // Fetch tile from OpenStreetMap with proper headers
    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;

    const response = await axios.get(tileUrl, {
      headers: {
        'User-Agent': 'DarbnaApp/1.0 (Server)',
        'Referer': process.env.APP_URL || 'https://darbna.app'
      },
      responseType: 'arraybuffer',
      timeout: 10000 // 10 second timeout
    });

    // Set appropriate response headers
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    // Send the tile image
    res.send(response.data);
  } catch (err: any) {
    // Handle different error types
    if (err.response) {
      // OSM server returned an error
      const status = err.response.status;
      if (status === 404) {
        return res.status(404).json({ message: "Tile not found." });
      } else if (status === 403) {
        return res.status(403).json({ message: "Access forbidden. Please check tile usage policy." });
      }
      return res.status(status).json({ message: "Failed to fetch tile from OpenStreetMap." });
    } else if (err.request) {
      // Request was made but no response received
      return res.status(503).json({ message: "OpenStreetMap server is unavailable." });
    } else {
      // Error setting up the request
      console.error("Tile proxy error:", err.message);
      return res.status(500).json({ message: "Internal server error while fetching tile." });
    }
  }
};
