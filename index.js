const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin");

const serviceAccount = require("./serviceKey.json");
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// MongoDB setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const jobsCollection = db.collection('jobs');
    const acceptedCollection = db.collection('acceptedTasks');

    // ✅ Get all jobs or filter by user
    app.get('/jobs', async (req, res) => {
      const email = req.query.email;
      const query = email ? { userEmail: email } : {};
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });

    // ✅ Get latest 6 jobs
    app.get('/jobs/latest', async (req, res) => {
  try {
    const result = await jobsCollection.find().sort({ _id: -1 }).limit(6).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


    // ✅ Get job by ID
    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const result = await jobsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ✅ Add a job
    app.post('/jobs', async (req, res) => {
      const job = req.body;
      job.createdAt = new Date();
      const result = await jobsCollection.insertOne(job);
      res.send(result);
    });

    // ✅ Update a job
    app.put('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const updated = req.body;
      const result = await jobsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updated }
      );
      res.send(result);
    });

    // ✅ Delete a job
    app.delete('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const result = await jobsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ✅ Accept a job
    app.post('/accept-job/:id', async (req, res) => {
      const jobId = req.params.id;
      const { userEmail } = req.body;
      const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });

      if (job.userEmail === userEmail) {
        return res.status(403).send({ error: "You can't accept your own job." });
      }

      const acceptedTask = {
        jobId,
        title: job.title,
        category: job.category,
        summary: job.summary,
        coverImage: job.coverImage,
        postedBy: job.postedBy,
        acceptedBy: userEmail,
        acceptedAt: new Date(),
      };

      const result = await acceptedCollection.insertOne(acceptedTask);
      res.send(result);
    });

    // ✅ Get accepted tasks
    app.get('/accepted-tasks', async (req, res) => {
      const email = req.query.email;
      const result = await acceptedCollection.find({ acceptedBy: email }).toArray();
      res.send(result);
    });

    // ✅ Remove accepted task (DONE or CANCEL)
    app.delete('/accepted-tasks/:id', async (req, res) => {
      const id = req.params.id;
      const result = await acceptedCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ✅ Ping
    await db.command({ ping: 1 });
    console.log("✅ Connected to MongoDB!");
  } catch (err) {
    console.error(err);
  }
}

run();

app.get('/', (req, res) => {
  res.send('🚀 Freelance MarketPlace Server is running!');
});

app.listen(port, () => {
  console.log(`🌐 Server listening on port ${port}`);
});
