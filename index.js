const express = require("express");
const app = express();
const cors = require('cors');
const url = require('url');
var port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.send(JSON.stringify("OK"));
});

app.listen(port, function () {
    console.log(`API listening!`);
});