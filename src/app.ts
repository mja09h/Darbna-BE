import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import connectDB from './database';

const app = express();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

connectDB();

app.listen(Number(PORT), HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});