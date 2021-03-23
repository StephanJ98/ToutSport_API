const cluster = require('cluster');
cluster.schedulingPolicy = cluster.SCHED_NONE;
const numCPUs = require('os').cpus().length;
const express = require('express');

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Starting another worker.`);
        cluster.fork();
    });
} else {
    const express = require("express");
    const app = express();
    const dotenv = require('dotenv')
    dotenv.config()
    const cors = require('cors');
    const url = require('url');
    const fs = require('fs')

    var port = process.env.PORT || 4000;
    let data = require('./data')

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    app.get("/", (req, res) => {
        res.sendStatus(200)
    });

    app.get("/admin", (req, res) => {
        res.sendFile(`${__dirname}/index.html`);
    });

    app.get("/admin/edit", (req, res) => {
        res.sendFile(`${__dirname}/edit.html`);
    });

    /* Funciones de la pagina de clientes */

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

    app.get("/categories", (req, res) => {
        if (data.length > 0) {
            let response = []
            data.forEach(rawData => {
                if (!response.includes(rawData.sport)) {
                    response.push(rawData.sport)
                }
            })
            res.json(response)
        } else {
            res.sendStatus(404)
        }
    })

    app.get("/search/:elem", (req, res) => {
        if (Object.keys(data).length - 1 >= 0) {
            const tags = req.params.elem.split(',')
            const response = []

            data.forEach(rawData => {
                if (rawData.tags.some(tag => tags.includes(tag))) {
                    response.push(rawData)
                }
            })
            res.json(response)
        } else {
            res.sendStatus(404)
        }
    })

    /* Funciones de la pagina de admin */

    app.post("/delete", (req, res) => {
        let id = req.body.id
        let pass = req.body.pass

        if (pass == process.env.PASS) {
            let arr = data
            let index = arr.findIndex(a => a.id === id)
            if (index > -1) {
                arr.splice(index, 1)
            }
            fs.writeFileSync('./data.json', JSON.stringify(arr), err => {
                if (err) {
                    console.log('Error writing file', err)
                } else {
                    console.log('Successfully wrote file')
                }
            })
            res.sendStatus(200)
        } else {
            res.sendStatus(403)
        }
    })

    app.post("/edit", (req, res) => {
        let pass = req.body.pass

        if (pass == process.env.PASS) {
            let arr = data
            let id = req.body.id
            let title = req.body.title
            let rating = req.body.rating
            let description = req.body.description
            let sport = req.body.sport
            let store = req.body.store
            let peso = req.body.peso
            let creador = req.body.creador
            let talla = req.body.talla
            let tags = req.body.tags.split(',')
            let images = req.body.images.split(',')

            let obj = {
                "id": Number(id),
                "title": title,
                "images": images,
                "rating": Number(rating),
                "description": description,
                "sport": sport,
                "store": store,
                "caracteristicas": {
                    "peso": Number(peso),
                    "talla": talla,
                    "creador": creador
                },
                "tags": tags
            }


            let index = arr.findIndex(a => a.id == req.body.id)
            if (index > -1) {
                /* Work */
                arr[index] = obj
            }
            fs.writeFileSync('./data.json', JSON.stringify(arr), err => {
                if (err) {
                    console.log('Error writing file', err)
                } else {
                    console.log('Successfully wrote file')
                }
            })
            res.sendStatus(200)
        } else {
            res.sendStatus(403)
        }
    })

    app.listen(port, function () {
        console.log(`Worker ${process.pid} started on port: ${port}`);
    });
}
