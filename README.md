# Darbna Backend API Documentation

[Darbna Frontend](https://github.com/mja09h/Darbna-FE)

## Base URL

```
http://localhost:8000/api
```

## Authentication

Most endpoints require authentication using a Bearer token. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Note:** Tokens are returned on registration and login, and expire after 30 days.

---

## API Endpoints

### 🔐 Authentication Endpoints

#### Register User

```http
POST /api/users
```

**Public Endpoint** - No authentication required

**Request Body:**

```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "country": "USA"
}
```

**Response (201):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "country": "USA",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Login

```http
POST /api/users/login
```

**Public Endpoint** - No authentication required

**Request Body:**

```json
{
  "identifier": "john@example.com", // Can be email or username
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### Google Login

```http
POST /api/auth/google
```

**Public Endpoint** - No authentication required

**Request Body:**

```json
{
  "idToken": "google_id_token_here"
}
```

**Response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### Apple Login

```http
POST /api/auth/apple
```

**Public Endpoint** - No authentication required

**Request Body:**

```json
{
  "identityToken": "apple_identity_token",
  "email": "user@example.com",
  "fullName": {
    "givenName": "John",
    "familyName": "Doe"
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### Forgot Password

```http
POST /api/auth/forgot-password
```

**Public Endpoint** - No authentication required

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200):**

```json
{
  "message": "If an account with that email exists, a password reset link has been sent.",
  "success": true,
  "resetToken": "reset_token_here" // Only in development
}
```

#### Reset Password

```http
POST /api/auth/reset-password
```

**Public Endpoint** - No authentication required

**Request Body:**

```json
{
  "token": "reset_token_from_forgot_password",
  "newPassword": "newsecurepassword123"
}
```

**Response (200):**

```json
{
  "message": "Password reset successfully",
  "success": true
}
```

---

### 👤 User Endpoints

#### Get All Users

```http
GET /api/users
```

**🔒 Requires Authentication**

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "profilePicture": "/uploads/profile.jpg",
      "bio": "Adventure enthusiast",
      "country": "USA"
    }
  ]
}
```

#### Get User by ID

```http
GET /api/users/:id
```

**Public Endpoint** - No authentication required

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "profilePicture": "/uploads/profile.jpg",
    "bio": "Adventure enthusiast",
    "country": "USA",
    "followers": [],
    "following": []
  }
}
```

#### Get User by Username

```http
GET /api/users/username/:username
```

**Public Endpoint** - No authentication required

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

#### Get User Profile

```http
GET /api/users/:id/profile
```

**Public Endpoint** - No authentication required

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

#### Update User

```http
PUT /api/users/:id
```

**🔒 Requires Authentication** - Users can only update their own profile

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request Body (Form Data):**

```
name: John Doe
country: USA
bio: Adventure enthusiast
phone: +1234567890
profilePicture: <file>  // Optional image file
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "profilePicture": "/uploads/profile.jpg",
    "bio": "Adventure enthusiast",
    "country": "USA"
  }
}
```

#### Update Password

```http
PUT /api/users/:id/password
```

**🔒 Requires Authentication** - Users can only update their own password

**Request Body:**

```json
{
  "oldPassword": "oldpassword123", // Required if user has password
  "newPassword": "newpassword123"
}
```

**Response (200):**

```json
{
  "message": "Password updated successfully",
  "success": true
}
```

#### Delete User

```http
DELETE /api/users/:id
```

**🔒 Requires Authentication** - Users can only delete their own account

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

#### Follow User

```http
POST /api/users/:id/follow
```

**🔒 Requires Authentication**

**Request Body:** (No body needed - uses authenticated user)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "followers": ["507f1f77bcf86cd799439012"]
  }
}
```

#### Unfollow User

```http
POST /api/users/:id/unfollow
```

**🔒 Requires Authentication**

**Request Body:** (No body needed - uses authenticated user)

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

#### Get Followers

```http
GET /api/users/:id/followers
```

**🔒 Requires Authentication**

**Response (200):**

```json
{
  "success": true,
  "data": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
}
```

#### Get Following

```http
GET /api/users/:id/following
```

**🔒 Requires Authentication**

**Response (200):**

```json
{
  "success": true,
  "data": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
}
```

---

### 📍 Routes Endpoints

**All routes endpoints require authentication.**

#### Create Route

```http
POST /api/routes
```

**🔒 Requires Authentication**

**Request Body:**

```json
{
  "name": "Mountain Trail",
  "description": "Beautiful mountain trail",
  "path": {
    "type": "LineString",
    "coordinates": [
      [longitude1, latitude1],
      [longitude2, latitude2],
      [longitude3, latitude3]
    ]
  },
  "startTime": "2024-01-01T10:00:00.000Z",
  "points": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2024-01-01T10:00:00.000Z",
      "elevation": 100,
      "speed": 5.5
    }
  ]
}
```

**Response (201):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "name": "Mountain Trail",
  "description": "Beautiful mountain trail",
  "path": {
    "type": "LineString",
    "coordinates": [[...]]
  },
  "startTime": "2024-01-01T10:00:00.000Z",
  "distance": 0,
  "duration": 0,
  "points": [...],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Get User Routes

```http
GET /api/routes
```

**🔒 Requires Authentication**

**Response (200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "name": "Mountain Trail",
    "path": { ... },
    "points": [ ... ]
  }
]
```

#### Get Route by ID

```http
GET /api/routes/:id
```

**🔒 Requires Authentication**

**Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "name": "Mountain Trail",
  "path": { ... },
  "points": [ ... ]
}
```

#### Get Routes Near Location

```http
GET /api/routes/nearby?longitude=-74.0060&latitude=40.7128&maxDistance=5000
```

**🔒 Requires Authentication**

**Query Parameters:**

- `longitude` (required): Longitude coordinate
- `latitude` (required): Latitude coordinate
- `maxDistance` (optional): Maximum distance in meters (default: 5000)

**Response (200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Mountain Trail",
    "path": { ... }
  }
]
```

#### Update Route

```http
PUT /api/routes/:id
```

**🔒 Requires Authentication** - Users can only update their own routes

**Request Body:**

```json
{
  "name": "Updated Route Name",
  "description": "Updated description",
  "path": { ... },
  "endTime": "2024-01-01T12:00:00.000Z",
  "distance": 5000,
  "duration": 7200,
  "points": [ ... ]
}
```

**Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Updated Route Name",
  ...
}
```

#### Delete Route

```http
DELETE /api/routes/:id
```

**🔒 Requires Authentication** - Users can only delete their own routes

**Response (200):**

```json
{
  "message": "Route deleted successfully"
}
```

---

### 📌 Pins Endpoints

#### Get Pin Categories

```http
GET /api/pins/categories
```

**Public Endpoint** - No authentication required

**Response (200):**

```json
{
  "categories": [
    "mountain",
    "desert",
    "valley",
    "canyon",
    "cave",
    "waterfall",
    "lake",
    "river",
    "spring",
    "oasis",
    "forest",
    "trail",
    "campsite",
    "viewpoint",
    "rock_formation",
    "wildlife_area",
    "emergency_shelter",
    "landmark",
    "other"
  ]
}
```

#### Get All Pins

```http
GET /api/pins
```

**Public Endpoint** - No authentication required

**Response (200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Beautiful Waterfall",
    "description": "Amazing waterfall in the mountains",
    "category": "waterfall",
    "isPublic": true,
    "userId": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "johndoe"
    },
    "location": {
      "type": "Point",
      "coordinates": [longitude, latitude]
    },
    "images": ["/uploads/pin1.jpg", "/uploads/pin2.jpg"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Get Pin by ID

```http
GET /api/pins/:id
```

**Public Endpoint** - No authentication required

**Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Beautiful Waterfall",
  "category": "waterfall",
  "location": { ... },
  "images": [ ... ]
}
```

#### Get Pins by User ID

```http
GET /api/pins/user/:userId
```

**Public Endpoint** - No authentication required

**Response (200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Beautiful Waterfall",
    ...
  }
]
```

#### Get Pins by Category

```http
GET /api/pins/category/:category
```

**Public Endpoint** - No authentication required

**Response (200):**

```json
[ ... ]
```

#### Get Pins by Title

```http
GET /api/pins/title/:title
```

**Public Endpoint** - No authentication required

**Response (200):**

```json
[ ... ]
```

#### Create Pin

```http
POST /api/pins
```

**🔒 Requires Authentication**

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request Body (Form Data):**

```
title: Beautiful Waterfall
description: Amazing waterfall in the mountains
category: waterfall
isPublic: true
latitude: 40.7128
longitude: -74.0060
images: <file1>, <file2>, <file3>, <file4>  // Max 4 images
```

**Alternative (JSON with location object):**

```json
{
  "title": "Beautiful Waterfall",
  "description": "Amazing waterfall in the mountains",
  "category": "waterfall",
  "isPublic": true,
  "location": {
    "coordinates": [longitude, latitude]
  }
}
```

**Response (201):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Beautiful Waterfall",
  "category": "waterfall",
  "userId": "507f1f77bcf86cd799439012",
  "location": { ... },
  "images": ["/uploads/pin1.jpg"],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update Pin

```http
PUT /api/pins/:id
```

**🔒 Requires Authentication** - Users can only update their own pins

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request Body (Form Data):**

```
title: Updated Title
description: Updated description
category: mountain
isPublic: false
latitude: 40.7128
longitude: -74.0060
images: <file1>, <file2>  // Optional, max 4 images
```

**Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Updated Title",
  ...
}
```

#### Delete Pin

```http
DELETE /api/pins/:id
```

**🔒 Requires Authentication** - Users can only delete their own pins

**Response (200):**

```json
{
  "message": "Pin deleted successfully"
}
```

---

### 🆘 SOS Endpoints

#### Get Active SOS Alerts

```http
GET /api/sos/active
```

**Public Endpoint** - No authentication required (for safety/emergency access)

**Response (200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "johndoe"
    },
    "location": {
      "type": "Point",
      "coordinates": [longitude, latitude]
    },
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create SOS Alert

```http
POST /api/sos/create
```

**🔒 Requires Authentication**

**Request Body:**

```json
{
  "latitude": 40.7128,
  "longitude": -74.006
}
```

**Response (201):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "username": "johndoe"
  },
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128]
  },
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Resolve SOS Alert

```http
POST /api/sos/resolve
```

**🔒 Requires Authentication** - Users can only resolve their own alerts

**Request Body:**

```json
{
  "alertId": "507f1f77bcf86cd799439011"
}
```

**Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "RESOLVED",
  "resolvedAt": "2024-01-01T01:00:00.000Z"
}
```

---

### 🗺️ Map Endpoints

#### Get Nearby Locations

```http
GET /api/map/locations/nearby
```

**Query Parameters:**

- `longitude` (required)
- `latitude` (required)
- `radius` (optional)

#### Get POIs Within Polygon

```http
POST /api/map/pois/within
```

**Request Body:**

```json
{
  "polygon": {
    "type": "Polygon",
    "coordinates": [[[longitude, latitude], ...]]
  }
}
```

#### Get All Routes

```http
GET /api/map/routes
```

#### Get Heatmap Data

```http
GET /api/map/heatmap
```

#### Get Tile

```http
GET /api/map/tiles/:z/:x/:y.png
```

---

## Data Structures

### User Object

```typescript
{
  _id: string;
  name: string;
  username: string;
  email: string;
  password?: string;  // Never returned in responses
  country: string;
  phone?: string;
  profilePicture?: string;
  coverPicture?: string;
  bio?: string;
  followers: string[];  // Array of user IDs
  following: string[];  // Array of user IDs
  googleId?: string;
  appleId?: string;
  authProvider: "local" | "google" | "apple";
  location: {
    type: "Point";
    coordinates: [number, number];  // [longitude, latitude]
  };
  pushToken?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Route Object

```typescript
{
  _id: string;
  userId: string;
  name: string;
  description?: string;
  path: {
    type: "LineString";
    coordinates: [number, number][];  // [[longitude, latitude], ...]
  };
  startTime: Date;
  endTime?: Date;
  distance: number;  // in meters
  duration: number;  // in seconds
  points: Array<{
    latitude: number;
    longitude: number;
    timestamp: Date;
    elevation?: number;
    speed?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Pin Object

```typescript
{
  _id: string;
  title: string;
  description: string;
  category: PinCategory;  // See categories endpoint
  isPublic: boolean;
  userId: string | {
    _id: string;
    username: string;
  };
  location: {
    type: "Point";
    coordinates: [number, number];  // [longitude, latitude]
  };
  images: string[];  // Array of image paths (max 4)
  createdAt: Date;
  updatedAt: Date;
}
```

### SOS Alert Object

```typescript
{
  _id: string;
  user: string | {
    _id: string;
    username: string;
  };
  location: {
    type: "Point";
    coordinates: [number, number];  // [longitude, latitude]
  };
  status: "ACTIVE" | "RESOLVED";
  resolvedAt?: Date;
  createdAt: Date;
}
```

### Pin Categories

```typescript
type PinCategory =
  | "mountain"
  | "desert"
  | "valley"
  | "canyon"
  | "cave"
  | "waterfall"
  | "lake"
  | "river"
  | "spring"
  | "oasis"
  | "forest"
  | "trail"
  | "campsite"
  | "viewpoint"
  | "rock_formation"
  | "wildlife_area"
  | "emergency_shelter"
  | "landmark"
  | "other";
```

---

## Error Responses

### 400 Bad Request

```json
{
  "message": "Missing required fields",
  "success": false
}
```

### 401 Unauthorized

```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "message": "You can only update your own profile",
  "success": false
}
```

### 404 Not Found

```json
{
  "message": "User not found",
  "success": false
}
```

### 500 Internal Server Error

```json
{
  "message": "Error processing request",
  "success": false
}
```

---

## File Uploads

### Profile Picture

- **Endpoint:** `PUT /api/users/:id`
- **Content-Type:** `multipart/form-data`
- **Field Name:** `profilePicture`
- **Accepted Formats:** Image files (jpg, png, etc.)

### Pin Images

- **Endpoint:** `POST /api/pins` or `PUT /api/pins/:id`
- **Content-Type:** `multipart/form-data`
- **Field Name:** `images` (multiple files)
- **Max Files:** 4 images per pin
- **Accepted Formats:** Image files

**Uploaded files are accessible at:**

```
http://localhost:8000/uploads/<filename>
```

---

## Socket.IO Events

The backend uses Socket.IO for real-time features:

### Client → Server

- Connect to `ws://localhost:8000`

### Server → Client

#### New SOS Alert

```javascript
socket.on("new-sos-alert", (alert) => {
  // alert: SOS Alert Object
});
```

#### SOS Alert Resolved

```javascript
socket.on("sos-alert-resolved", (data) => {
  // data: { alertId: string }
});
```

---

## Notes

1. **Authentication:** Most endpoints require a valid JWT token in the Authorization header
2. **Ownership:** Users can only modify their own resources (routes, pins, profile, etc.)
3. **Coordinates:** All geographic coordinates use GeoJSON format: `[longitude, latitude]`
4. **File Uploads:** Use `multipart/form-data` for endpoints that accept file uploads
5. **Token Expiry:** JWT tokens expire after 30 days
6. **Password Reset:** Reset tokens expire after 1 hour

---

## Environment Variables

Required environment variables:

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `PORT`: Server port (default: 8000)
- `HOST`: Server host (default: 0.0.0.0)
