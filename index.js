import express from "express";
import axios from "axios";
import pg from "pg";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const db = new pg.Client(
    {
        user: "postgres",
        password: "1234",
        host: "localhost",
        port: 5432,
        database: "BookNotes"
    }
);

db.connect();

app.listen(port, () =>
{
    console.log(`Server is running on port ${port}`);
})