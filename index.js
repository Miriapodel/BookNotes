import express from "express";
import axios from "axios";
import pg from "pg";
import bodyParser from "body-parser";


const app = express();
const port = 3000;
const urlForIBN = "https://openlibrary.org/search.json?title=";
const urlForCover = "https://covers.openlibrary.org/b/isbn/";
const sizeAndType = "-M.jpg?default=false";
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
    }
    catch(e)
    {
        console.log("Unable to reload books");
    }

    res.render("index.ejs", { books : books });
});


app.get("/edit", async (req, res) =>
{
    const bookId = req.query.id;
    const book = (await db.query("SELECT * FROM BOOK WHERE ID = $1", [bookId])).rows[0];

    res.render("edit.ejs", {book:book});
});


app.post("/cancelEdit", (req, res) =>
{
    res.redirect("/");
});


app.post("/submitEdit", async (req, res) =>
{
    const descriereNoua = req.body.descriere;
    const bookId = req.body.id;

    await db.query("UPDATE BOOK SET DESCRIERE = $1 WHERE ID = $2", [descriereNoua, bookId]);

    res.redirect("/");

});


app.post("/addBook", async (req, res) =>
{
    const titlu = req.body.titlu.trim();
    const autor = req.body.autor.trim();
    const descriere = req.body.descriere;

    if (titlu && autor)
    {


        const response = await axios.get(urlForIBN + titlu);
    
        if ( response.data.numFound  == 0)
        {
            console.log("Unable to find book");
        }
        else
        {
            let listOfISBN = response.data.docs.filter(book => book.author_name); 

            if ( listOfISBN.length == 0 )
                response.data.docs.forEach(book => 
                {
                    listOfISBN.push(...book.isbn);
                });
            
            else
            {

                let auxList = listOfISBN.filter(book => 
                                        {
                                            const authorNames = book.author_name.map(name => name.toLowerCase());

                                            return authorNames.includes(autor.toLowerCase())    // iau toate numele de autori si le convertesc la litera mica
                                                                                        //, la fel si cu numele de autor trimis ca input, ca sa verific corect 
                                                                                        // in cazul in care user-ul  nu trimite numele cu aceeasi capitalization
                                        })
                            
                listOfISBN = [];

                auxList.forEach(book => 
                                    {
                                        listOfISBN.push(...book.isbn); // iau toate ISBN-urile existente pentru carte
                        
                                    }); 
            }           

            if (listOfISBN.length > 0)
            {
                let imgResponse = "";

                for(const isbn of listOfISBN) // iterez prin toata lista pentru ca gasi un ISBN cu care merge sa iau coperta
                {
                    try
                    {
                        imgResponse = await axios.get(urlForCover + isbn + sizeAndType);

                        const imgUrl = imgResponse.request.res.responseUrl;

                        await db.query("INSERT INTO BOOK(TITLE, AUTOR, DESCRIERE, COPERTA) VALUES($1, $2, $3, $4)", [titlu, autor, descriere, imgUrl]);

                        break;
                    }
                    catch (e)
                    {
                        console.log("ISBN not ok for getting cover");
                    }
                }

                if (!imgResponse)
                {
                    console.log("Unable to retrieve cover");

                    await db.query("INSERT INTO BOOK(TITLE, AUTOR, DESCRIERE) VALUES($1, $2, $3)", [titlu, autor, descriere]);
                }
            }
            else
            {
                console.log("Unable to retrieve ISBN");
                await db.query("INSERT INTO BOOK(TITLE, AUTOR, DESCRIERE) VALUES($1, $2, $3)", [titlu, autor, descriere]);
            }

        }

    }
    else
    {
        console.log("Title or author or both not given");
    }
    res.redirect("/");

});


app.post("/delete", async (req, res) =>
{
    await db.query("DELETE FROM BOOK WHERE ID = $1", [req.body.id]);

    res.redirect("/");
});


app.listen(port, () =>
{
    console.log(`Server is running on port ${port}`);
})

//TODO: De adaugat mesaje in pagina cand ceva nu e bine