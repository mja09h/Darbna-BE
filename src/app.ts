import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import connectDB from './database';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import usersRoutes from './apis/users/users.routes';
import authRoutes from './apis/auth/auth.routes';

import path from 'path';

const app = express();
dotenv.config({ path: path.join(__dirname, '../.env') });
connectDB();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);


app.use(notFound);
app.use(errorHandler);

app.listen(Number(PORT), HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});