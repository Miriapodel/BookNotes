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

app.use(bodyParser.urlencoded( { extended : true } ));
app.use(express.static("public"));

db.connect();


app.get("/", (req, res) =>
{
    res.render("index.ejs");
});


app.listen(port, () =>
{
    console.log(`Server is running on port ${port}`);
})