const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json())

const uri = "mongodb+srv://freelance_market_place:ZttvQebeqBV4Hgrq@cluster0.shyhiog.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// app.get('/hello',(req,res)=>{
//   res.send('how are you!')

// })


async function run() {
  try {
    await client.connect();

    const db = client.db('freelance_db')
    const jobsCollection = db.collection('jobs');

    app.get('/jobs' ,async(req,res)=>{

      console.log(req.query)
      const email = req.query.email;
      const query ={}
      if(email){
        query.userEmail = email;
      }



      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    });

    app.get('/jobs/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await jobsCollection.findOne(query);
      res.send(result);

    })

    app.post('/jobs', async(req,res) => {
      const newJob = req.body
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    })
    app.patch('/jobs/:id', async(req,res)=>{
      const id = req.params.id;
      const updatedJob = req.body;
      const query ={_id: new ObjectId(id) }
      const update ={
        $set: {
          name:updatedJob.name,
          price:updatedJob.price
        }
      }
      const result = await jobsCollection.updateOne(query,update)
      res.send(result)

})
    app.delete('/jobs/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    })






    // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);

 // Confirm connection
    await db.command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");

  } catch (err) {
    console.error(err);
  }
}

run();


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`server is listening on port ${port}`)
})
