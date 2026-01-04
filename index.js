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

// app.use(cors({
//   origin: "https://freelance-hub-a10.netlify.app",
//   credentials: true
// }));
// app.use(express.json());




admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 🔐 Middleware: Verify Firebase ID Token
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // { uid, email, name, email_verified, ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}


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
    // await client.connect();
    const db = client.db(process.env.DB_NAME);
    const jobsCollection = db.collection('jobs');
    const acceptedCollection = db.collection('acceptedTasks');

    //  Get all jobs or filter by user
    // app.get('/jobs', async (req, res) => {
    //   const email = req.query.email;
    //   const query = email ? { userEmail: email } : {};
    //   const result = await jobsCollection.find(query).toArray();
    //   res.send(result);
    // });

    // GET /jobs — supports ?sort=newest|oldest
// app.get('/jobs', async (req, res) => {
//   const { email, sort = 'newest' } = req.query;
//   const query = email ? { userEmail: email } : {};

//   //  Sort by _id (ObjectId timestamp ≈ createdAt)
//   let sortOption = { _id: -1 }; // newest first
//   if (sort === 'oldest') sortOption = { _id: 1 };

//   try {
//     const result = await jobsCollection.find(query).sort(sortOption).toArray();
//     res.send(result);
//   } catch (err) {
//     console.error('Jobs fetch error:', err);
//     res.status(500).json({ error: 'Failed to fetch jobs' });
//   }
// });


// app.get('/jobs', async (req, res) => {
//   const { email, search, category, sort } = req.query;
  
//   // 1. Build the Query Object
//   let query = {};

//   // Filter by user email (for "My Jobs" page)
//   if (email) {
//     query.userEmail = email;
//   }

//   // Filter by Search Title (Requirement #5)
//   if (search) {
//     // 'i' makes it case-insensitive so "react" matches "React"
//     query.title = { $regex: search, $options: 'i' };
//   }

//   // Filter by Category
//   if (category) {
//     query.category = category;
//   }

//   // 2. Build the Sort Options
//   let sortOption = { _id: -1 }; // Default: Newest first
  
//   if (sort === 'oldest') sortOption = { _id: 1 };
  
//   // Requirement #5: Sort by price
//   if (sort === 'price-asc') sortOption = { minPrice: 1 };
//   if (sort === 'price-desc') sortOption = { minPrice: -1 };

//   try {
//     const result = await jobsCollection.find(query).sort(sortOption).toArray();
//     res.send(result);
//   } catch (err) {
//     console.error('Jobs fetch error:', err);
//     res.status(500).json({ error: 'Failed to fetch jobs' });
//   }
// });

//     //  Get latest 8 jobs
//     app.get('/jobs/latest', async (req, res) => {
//   try {
//     const result = await jobsCollection.find().sort({ _id: -1 }).limit(8).toArray();
//     res.send(result);
//   } catch (err) {
//     res.status(500).send({ error: err.message });
//   }
// });


//     // Get job by ID
//     app.get('/jobs/:id', async (req, res) => {
//       const id = req.params.id;
//       const result = await jobsCollection.findOne({ _id: new ObjectId(id) });
//       res.send(result);
//     });
// 1. Specific routes FIRST
app.get('/jobs/latest', async (req, res) => {
  try {
    const result = await jobsCollection.find().sort({ _id: -1 }).limit(8).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// 2. Dynamic ID routes SECOND
app.get('/jobs/:id', async (req, res) => {
  const id = req.params.id;
  const result = await jobsCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

// 3. General filter/search routes LAST
app.get('/jobs', async (req, res) => {
  const { email, search, category, sort } = req.query;
  let query = {};
  if (email) query.userEmail = email;
  if (search) query.title = { $regex: search, $options: 'i' };
  if (category) query.category = category;

  let sortOption = { _id: -1 };
  if (sort === 'oldest') sortOption = { _id: 1 };
  if (sort === 'price-asc') sortOption = { minPrice: 1 };
  if (sort === 'price-desc') sortOption = { minPrice: -1 };


  try {
    const result = await jobsCollection.find(query).sort(sortOption).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

    //  Add a job
    app.post('/jobs',verifyToken, async (req, res) => {
      const job = req.body;
job.minPrice = parseFloat(job.minPrice);
job.maxPrice = parseFloat(job.maxPrice);
      job.createdAt = new Date();
      // Enforce: userEmail must match token email
  if (job.userEmail !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden: Email mismatch' });
  }
  
      const result = await jobsCollection.insertOne(job);
      res.status(201).send(result);
    });

    // Update a job
    app.put('/jobs/:id',verifyToken, async (req, res) => {
      const id = req.params.id;
      const updated = req.body;

      // Fetch job first to check ownership
  const job = await jobsCollection.findOne({ _id: new ObjectId(id) });
  if (!job) return res.status(404).json({ error: 'Job not found' });
  
  if (job.userEmail !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden: You can only edit your own jobs' });
  }


      const result = await jobsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updated }
      );
      res.send(result);
    });

    //  Delete a job
    app.delete('/jobs/:id',verifyToken, async (req, res) => {
      const id = req.params.id;

      const job = await jobsCollection.findOne({ _id: new ObjectId(id) });
  if (!job) return res.status(404).json({ error: 'Job not found' });

  if (job.userEmail !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden: You can only delete your own jobs' });
  }

      const result = await jobsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    //  Accept a job
    app.post('/accept-job/:id',verifyToken, async (req, res) => {
      console.log("user",req.user.email);
      const jobId = req.params.id;

      const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
  if (!job) return res.status(404).json({ error: 'Job not found' });

      // const { userEmail } = req.body;
      // const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });

      if (job.userEmail === req.user.email) {
        return res.status(403).json({ error: "You can't accept your own job." });
      }

      const acceptedTask = {
        jobId,
        title: job.title,
        category: job.category,
        summary: job.summary,
        coverImage: job.coverImage,
        postedBy: job.postedBy,
        acceptedBy: req.user.email,
        acceptedAt: new Date(),
      };

      const result = await acceptedCollection.insertOne(acceptedTask);
      res.status(201).send(result);
    });

    //  Get accepted tasks
    app.get('/accepted-tasks', async (req, res) => {
      const email = req.query.email;
      const result = await acceptedCollection.find({ acceptedBy: email }).toArray();
      res.send(result);
    });

    //  Remove accepted task (DONE or CANCEL)
    app.delete('/accepted-tasks/:id', verifyToken, async (req, res) => {
      const id = req.params.id;

        const task = await acceptedCollection.findOne({ _id: new ObjectId(id) });

  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.acceptedBy !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden: You can only remove your own accepted tasks' });
  }


      const result = await acceptedCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    //  Ping
    // await db.command({ ping: 1 });
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
