const express = require('express')
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin");
require("dotenv").config()
// index.js
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);
const app = express()
const port = 3000

app.use(cors())
app.use(express.json())




admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});




const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.xalxakh.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyToken = async (req , res , next) => {
const authorization = req.headers.authorization
if(!authorization) {
 return res.status(401).send ({
    massage: "unauthorized access"
  })
}
const token = authorization.split(' ') [1]




try {
  await admin.auth().verifyIdToken(token)
  
  next()

} catch (error) {
  console.log(error)
  return res.status(401).send ({
    massage: "unauthorized access"
  })
}

  
}
app.get('/', (req, res) => {
  res.send('travel server is running!')
})

async function run() {
  try {
   
    // await client.connect();
    
    const db = client.db("travelDB")
    const travelCollection = db.collection("travel")
    const bookingCollection = db.collection("bookings")
    // const userCollection = db.collection("user")


    app.get("/travel", async (req , res) => {
      const  result = await travelCollection.find().toArray()

        res.send(result)
    })

    app.post("/travel",  async(req , res) => {
      const data = req.body
      
      const result = await travelCollection.insertOne(data)

      res.send({
        success: true,
        result
      })
    })


    app.get("/travel/:id",verifyToken,  async (req , res) => {
      const {id} = req.params
      const result = await travelCollection.findOne({_id: new ObjectId(id)})

      res.send({
        success: true,
        result
      })
    })

    app.put("/travel/:id" , async (req , res) => {
      const {id} = req.params
      const data = req.body
      const newId = new ObjectId(id)
      const filter = {_id:newId}
      const update = {
        $set:data
      }

      const result = await travelCollection.updateOne(filter, update)

      res.send({
        success: true,
        result
      })
    })


    app.delete("/travel/:id" ,async (req , res) => {
      const {id} = req.params
      const newId = new ObjectId(id)
      const filter = {_id:newId}
     const result = await travelCollection.deleteOne(filter) 

      res.send({
        success: true,
        result
      })
    })


    app.get("/latest-travel", async (req , res) => {
      const result = await travelCollection.find().sort({created_at: "desc"}).limit(6).toArray()


      res.send({
        success: true,
        result
      })
    })



    app.get("/my-vehicles" ,async(req , res) => {
      const email = req.query.email
      const result = await travelCollection.find({userEmail:email}).toArray()
      res.send({
        success:true,
        result
      })
    })


    app.post("/booking/:id" , async(req , res) => {
      const data = req.body
      const result = await bookingCollection.insertOne(data)
      res.send({
        success: true,
        result
      })

    })
    app.get("/my-booking" , verifyToken, async(req , res) => {
      const email= req.query.email
      console.log(email ,)
      const result = await bookingCollection.find({userEmail : email}).toArray()
      console.log(result)
      res.send({
        success: true,
        result
      })

    })

    app.get("/search" , async(req , res) => {
      const search_text = req.query.search
      const result = await travelCollection.find({vehicleName: {$regex: search_text, $options: "i"}}).toArray()
      res.send({
        success:true,
        result
      })
    })







    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);









app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
