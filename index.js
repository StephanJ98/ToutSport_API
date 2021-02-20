const express = require("express");
const app = express();
const cors = require('cors');
const url = require('url');
const { ObjectId } = require("mongodb");
const MongoClient = require('mongodb').MongoClient;
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
    const db = await client.db(url.parse(uri).pathname.substr(1))
    cachedDb = db
    return db
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.send(JSON.stringify("OK"));
});

/*
app.get("/events", async (req, res) => {
    try {
        const db = await connectToDatabase(process.env.MONGODB_URI)
        const collection = await db.collection('Eventos')
        let eventos = await collection.find({}).toArray()
        for (const event of eventos) {
            if (event.properties.DATE.split("-")[1] < (new Date().getMonth() + 1)) {
                await collection.deleteOne({ _id: event._id })
            }
            else if (event.properties.DATE.split("-")[1] == (new Date().getMonth() + 1) && event.properties.DATE.split("-")[2] < new Date().getDate()) {
                await collection.deleteOne({ _id: event._id })
            }
        }
        eventos = await collection.find({}).toArray()
        return res.json({ eventos })
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.get("/event/:id", async (req, res) => {
    try {
        const eventClient = req.params.id
        const db = await connectToDatabase(process.env.MONGODB_URI)
        const collection = await db.collection('Eventos')
        const eventDB = await collection.find({ _id: new ObjectId(eventClient) }, {
            projection: {
                _id: 0
            }
        }).toArray()
        if (eventClient !== null && eventDB !== null) {
            return res.json({ event: eventDB[0] })
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.get("/users", async (req, res) => {
    try {
        const db = await connectToDatabase(process.env.MONGODB_URI)
        const collection = await db.collection('Usuarios')
        const users = await collection.find({}).toArray()
        return res.json({ users })
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.get("/user/:email", async (req, res) => {
    try {
        const emailClient = req.params.email
        const db = await connectToDatabase(process.env.MONGODB_URI)
        const collection = await db.collection('Usuarios')
        const emailDB = await collection.find({ Email: emailClient }, {
            projection: {
                _id: 0,
                Email: 1
            }
        }).toArray()
        if (emailDB.length === 0) {
            return res.json({ verif: true })
        } else {
            if (emailClient !== null) {
                if (emailClient === emailDB[0].Email) {
                    return res.json({ verif: false })
                } else {
                    return res.json({ verif: true })
                }
            }
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

app.get("/info/:email", async (req, res) => {
    try {
        const emailClient = req.params.email
        const db = await connectToDatabase(process.env.MONGODB_URI)
        const collection = await db.collection('Usuarios')
        const emailDB = await collection.find({ Email: emailClient }, {
            projection: {
                _id: 0,
                Contrasenha: 0,
                Email: 0
            }
        }).toArray()
        if (emailClient !== null) {
            return res.json({ user: emailDB[0] })
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

app.get("/log/:email", async (req, res) => {
    try {
        const emailClient = req.params.email
        const db = await connectToDatabase(process.env.MONGODB_URI)
        const collection = await db.collection('Usuarios')
        const passDB = await collection.find({ Email: emailClient }, {
            projection: {
                _id: 0,
                Contrasenha: 1
            }
        }).toArray()
        if (passDB.length === 0) {
            return res.json({ pass: '' })
        } else {
            return res.json({ pass: passDB[0].Contrasenha })
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

app.post("/user", async (req, res) => {
    try {
        const db = await connectToDatabase(process.env.MONGODB_URI)
        const collection = await db.collection('Usuarios')
        let prenom = req.body.prenom;
        let nom = req.body.nom;
        let email = req.body.email;
        let anniv = req.body.anniv;
        let motdepasse = req.body.motdepasse;
        let pallote = new RegExp('pallote');
        let payote = new RegExp('payote');
        let pallo = new RegExp('pallo');
        let payo = new RegExp('payo');
        if (pallote.test(prenom.toLowerCase()) || payote.test(prenom.toLowerCase()) || pallo.test(prenom.toLowerCase()) || payo.test(prenom.toLowerCase())) {
            res.sendStatus(403)
        } else {
            collection.insertOne({ Nombre: prenom, Apellidos: nom, Email: email, AnoNacimiento: anniv, Contrasenha: motdepasse, Puntos: 100, Badges: [] })
            res.sendStatus(200);
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.post("/inscripcion", async (req, res) => {
    try {
        let event = req.body.event
        let player = req.body.player
        const db = await connectToDatabase(process.env.MONGODB_URI)
        const collection = await db.collection('Eventos')
        const eventDB = await collection.find({ _id: new ObjectId(event) }).toArray()
        const points = await db.collection('Usuarios')
        if (!eventDB[0].players.includes(player)) {
            const playersArr = eventDB[0].players
            playersArr.push(player)
            const counterArr = eventDB[0].counter + 1
            const user = await points.find({ Email: player.email }).toArray()
            await points.updateOne({ _id: new ObjectId(user[0]._id) }, { $set: { Puntos: user[0].Puntos + 5 } })
            await collection.updateOne({ _id: new ObjectId(event) }, { $set: { counter: counterArr, players: playersArr } })
            await res.sendStatus(200);
        } else {
            await res.sendStatus(201)
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

app.post("/desinscripcion", async (req, res) => {
    try {
        let event = req.body.event
        let player = req.body.player
        const db = await connectToDatabase(process.env.MONGODB_URI)
        const collection = await db.collection('Eventos')
        const eventDB = await collection.find({ _id: new ObjectId(event) }).toArray()
        const points = await db.collection('Usuarios')
        let retPlayers = eventDB[0].players
        if (JSON.stringify(eventDB[0].players).includes(JSON.stringify(player))) {
            const playersArr = eventDB[0].players
            retPlayers = playersArr.filter((jugador) => {
                return jugador.email != player.email
            })
            const counterArr = eventDB[0].counter - 1
            const user = await points.find({ Email: player.email }).toArray()
            await points.updateOne({ _id: new ObjectId(user[0]._id) }, { $set: { Puntos: user[0].Puntos - 5 } })
            await collection.updateOne({ _id: new ObjectId(event) }, { $set: { counter: counterArr, players: retPlayers } })
            await res.sendStatus(200);
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

app.post("/organizar", async (req, res) => {
    try {
        let usuario = req.body.usuario
        let nombre = req.body.nombre
        let descripcion = req.body.descripcion
        let limite = req.body.limite
        let competicion = req.body.competicion
        let agua = req.body.agua
        let hora = req.body.hora
        let fecha = req.body.fecha
        let campo = req.body.campo
        const db = await connectToDatabase(process.env.MONGODB_URI)
        const points = await db.collection('Usuarios')
        const user = await points.find({ Email: usuario.email }).toArray()
        await points.updateOne({ _id: new ObjectId(user[0]._id) }, { $set: { Puntos: user[0].Puntos + 10 } })
        const collection = await db.collection('Eventos')
        collection.insertOne({
            Usuario: usuario,
            properties: {
                KEY: new Date().getTime(),
                NAME: nombre,
                DESCRIPTION: descripcion,
                LIMITE: limite,
                COMPETITION: competicion,
                WATER: agua,
                HOUR: hora,
                DATE: fecha
            },
            geometry: {
                0: campo[0],
                1: campo[1]
            },
            players: [usuario],
            counter: 1
        })
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

app.post("/editarevento", async (req, res) => {
    try {
        let id = req.body.id
        let key = req.body.key
        let nombre = req.body.nombre
        let descripcion = req.body.descripcion
        let limite = req.body.limite
        let competicion = req.body.competicion
        let agua = req.body.agua
        let hora = req.body.hora
        let fecha = req.body.fecha
        let campo = req.body.campo
        const db = await connectToDatabase(process.env.MONGODB_URI)
        const collection = await db.collection('Eventos')
        await collection.updateOne({ _id: new ObjectId(id) }, {
            $set: {
                properties: {
                    KEY: key,
                    NAME: nombre,
                    DESCRIPTION: descripcion,
                    LIMITE: limite,
                    COMPETITION: competicion,
                    WATER: agua,
                    HOUR: hora,
                    DATE: fecha
                },
                geometry: {
                    0: campo[0],
                    1: campo[1]
                }
            }
        })
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})*/

app.listen(port, function () {
    console.log(`API listening!`);
});