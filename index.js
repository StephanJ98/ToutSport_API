const cluster = require('cluster');
cluster.schedulingPolicy = cluster.SCHED_NONE;
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, _code, _signal) => {
        console.log(`Worker ${worker.process.pid} died. Starting another worker.`);
        cluster.fork();
    });
} else {
    const express = require("express");
    const app = express();
    require('dotenv').config()
    const cors = require('cors');
    const { MongoClient, ObjectID } = require('mongodb')

    var port = process.env.PORT || 4000;

    const mongodbOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
    let cachedDb = null

    async function connectToDatabase(uri) {
        if (cachedDb) {
            return cachedDb
        }
        const client = await MongoClient.connect(uri, mongodbOptions)
        const db = await client.db(new URL(uri).pathname.substr(1))
        cachedDb = db
        return db
    }

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    app.get("/", (_req, res) => {
        res.sendStatus(200)
    });

    app.get("/admin", (_req, res) => {
        res.sendFile(`${__dirname}/index.html`);
    });

    app.get("/admin/edit", (_req, res) => {
        res.sendFile(`${__dirname}/edit.html`);
    });
    app.get("/admin/add", (_req, res) => {
        res.sendFile(`${__dirname}/add.html`);
    });

    /* Funciones de la pagina de clientes */

    app.get("/list", async (_req, res) => {
        try {
            const cluster = await connectToDatabase(process.env.MONGODB_URI)
            const collection = await cluster.collection('products')
            const db = await collection.find({}).toArray()
            return res.json(db.sort(() => Math.random() - 0.5))
        } catch (e) {
            res.sendStatus(503)
            console.log(e)
        }
    });

    app.get("/list/:id", async (req, res) => {
        try {
            const cluster = await connectToDatabase(process.env.MONGODB_URI)
            const collection = await cluster.collection('products')
            const db = await collection.find({ _id: ObjectID(req.params.id) }, {
                projection: {
                    _id: 0
                }
            }).toArray()
            return res.json(db[0])
        } catch (e) {
            res.sendStatus(503)
            console.log(e)
        }
    });

    app.get("/category/:category", async (req, res) => {
        try {
            const cluster = await connectToDatabase(process.env.MONGODB_URI)
            const collection = await cluster.collection('products')
            const db = await collection.find({}).toArray()
            const category = req.params.category
            let response = []
            let categories = []

            db.forEach(dataCategory => {
                categories.push(dataCategory.sport)
            })

            if (categories.includes(category)) {
                if (Object.keys(db).length - 1 >= 0) {
                    db.forEach(element => {
                        if (element.sport == category) {
                            response.push(element)
                        }
                    })
                    res.json(response)
                }
            } else {
                res.sendStatus(503)
            }
        } catch (e) {
            res.sendStatus(503)
            console.log(e)
        }
    })

    app.get("/categories", async (_req, res) => {
        try {
            const cluster = await connectToDatabase(process.env.MONGODB_URI)
            const collection = await cluster.collection('products')
            const db = await collection.find({}).toArray()
            let response = []
            db.forEach(rawData => {
                if (!response.includes(rawData.sport)) {
                    response.push(rawData.sport)
                }
            })
            res.json(response)
        } catch (e) {
            res.sendStatus(503)
            console.log(e)
        }
    })

    app.get("/search/:elem", async (req, res) => {
        try {
            const cluster = await connectToDatabase(process.env.MONGODB_URI)
            const collection = await cluster.collection('products')
            const db = await collection.find({}).toArray()

            if (Object.keys(db).length - 1 >= 0) {
                const tags = req.params.elem.split(',')
                const response = []

                db.forEach(rawData => {
                    if (rawData.tags.some(tag => tags.includes(tag))) {
                        response.push(rawData)
                    }
                })
                res.json(response)
            } else {
                res.sendStatus(503)
            }
        } catch (e) {
            res.sendStatus(503)
            console.log(e)
        }
    })

    /* Funciones de la pagina de admin */

    app.post("/delete", async (req, res) => {
        let pass = req.body.pass

        try {
            const cluster = await connectToDatabase(process.env.MONGODB_URI)
            const collection = await cluster.collection('products')

            if (pass == process.env.PASS) {
                collection.deleteOne({ _id: ObjectID(req.body.id) })
                res.sendStatus(200)
            } else {
                res.sendStatus(403)
            }
        } catch (error) {
            res.sendStatus(503)
            console.log(error)
        }
    })

    app.post("/edit", async (req, res) => {
        let pass = req.body.pass
        try {
            const cluster = await connectToDatabase(process.env.MONGODB_URI)
            const collection = await cluster.collection('products')

            if (pass == process.env.PASS) {
                collection.updateOne({ _id: ObjectID(req.body.id) }, {
                    $set: {
                        title: req.body.title,
                        images: req.body.images.split(','),
                        rating: Number(req.body.rating),
                        description: req.body.description,
                        sport: req.body.sport,
                        store: req.body.store,
                        caracteristicas: {
                            peso: Number(req.body.peso),
                            talla: req.body.talla,
                            creador: req.body.creador
                        },
                        tags: req.body.tags.split(',')
                    }
                })

                res.sendStatus(200)
            } else {
                res.sendStatus(403)
            }
        } catch (error) {
            res.sendStatus(503)
            console.log(error)
        }
    })

    app.post("/add", async (req, res) => {
        let pass = req.body.pass
        try {
            const cluster = await connectToDatabase(process.env.MONGODB_URI)
            const collection = await cluster.collection('products')
            const db = await collection.find({}).toArray()

            if (pass == process.env.PASS) {
                collection.insertOne({
                    title: req.body.title,
                    images: req.body.images.split(','),
                    rating: Number(req.body.rating),
                    description: req.body.description,
                    sport: req.body.sport,
                    store: req.body.store,
                    caracteristicas: {
                        peso: Number(req.body.peso),
                        talla: req.body.talla,
                        creador: req.body.creador
                    },
                    tags: req.body.tags.split(',')
                })

                res.sendStatus(200)
            } else {
                res.sendStatus(403)
            }
        } catch (error) {
            res.sendStatus(503)
            console.log(error)
        }
    })

    app.listen(port, function () {
        console.log(`Worker ${process.pid} started on port: ${port}`);
    });
}
