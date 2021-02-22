const express = require("express");
const app = express();
const cors = require('cors');
const url = require('url');
var port = process.env.PORT || 4000;

let data = require('./data')

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.sendStatus(200)
});

app.get("/list", (req, res) => {
    if (Object.keys(data).length - 1 >= 0) {
        res.json(data)
    } else {
        res.sendStatus(404)
    }
});

app.get("/list/:id", (req, res) => {
    const elemId = req.params.id
    if (Object.keys(data).length - 1 >= elemId) {
        res.json(data[elemId])
    } else {
        res.sendStatus(404)
    }
});

app.get("/category/:category", (req, res) => {
    const category = req.params.category
    let response = []
    let categories = []

    data.forEach(dataCategory => {
        categories.push(dataCategory.sport)
    })

    if (categories.includes(category)) {
        if (Object.keys(data).length - 1 >= 0) {
            data.forEach(element => {
                if (element.sport == category) {
                    response.push(element)
                }
            })
            res.json(response)
        }
    } else {
        res.sendStatus(404)
    }
});

app.listen(port, function () {
    console.log(`API running on port: ${port}`);
});