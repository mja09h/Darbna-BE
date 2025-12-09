import express from 'express';

const app = express();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';


app.listen(Number(PORT), HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});