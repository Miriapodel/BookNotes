import express from "express";
import axios from "axios";
import pg from "pg";
import bodyParser from "body-parser";


const app = express();
const port = 3000;
const urlForIBN = "https://openlibrary.org/search.json?title=";
const urlForCover = "https://covers.openlibrary.org/b/isbn/";
const sizeAndType = "-M.jpg";
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


let books = [];


app.get("/", async (req, res) =>
{
    try
    {
        books = (await db.query("SELECT * FROM BOOK")).rows;
        console.log(books);
    }
    catch(e)
    {
        console.log("Unable to reload books");
    }

    res.render("index.ejs", { books : books });
});


app.post("/addBook", async (req, res) =>
{
    const titlu = req.body.titlu;
    const autor = req.body.autor;
    const descriere = req.body.descriere;
    const response = await axios.get(urlForIBN + titlu);
    const ISBN = response.data.docs.filter(book => book.author_name)
                                   .filter(book => book.author_name.includes(autor))[0]
                                   .isbn[0];

    console.log(response.data.docs.filter(book => book.author_name).filter(book => book.author_name.includes(autor))[0].isbn);


    if (ISBN)
    {
        try
        {
            const imgResponse = await axios.get(urlForCover + ISBN + sizeAndType);

            const imgUrl = imgResponse.request.res.responseUrl;

            await db.query("INSERT INTO BOOK(TITLE, AUTOR, DESCRIERE, COPERTA) VALUES($1, $2, $3, $4)", [titlu, autor, descriere, imgUrl]);
        }
        catch (e)
        {
            console.log("Unable to add book");
            console.log(e.stack);
        }
    }
    else
    {
        console.log("Unable to retrieve ISBN");
    }

    res.redirect("/");

});

app.listen(port, () =>
{
    console.log(`Server is running on port ${port}`);
})