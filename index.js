require('dotenv').config()
const express = require('express')
const cors = require("cors")

const app = express()
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middle ware
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bkye2zi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    
    const db = client.db("edu_mate");
    const costCollection = db.collection("cost")
    const noteCollection = db.collection("notes")
    const incomeCollection = db.collection("incomes")
    const studyPlanCollection = db.collection("studyPlan")
    const scheduleCollection = db.collection("schedule")


//  ------------------------------------------------------- ----income data  in database

// get 
app.get("/income",async(req,res)=>{
    const  email = req.query.email
    const result = await incomeCollection.find({email}).toArray()
    res.send(result)
})


// add income
app.post("/income" , async(req,res)=>{
        const newIncome = req.body;
        const result = await incomeCollection.insertOne(newIncome)
        res.send(result);
 })


//  -------------------------------------------------------------- cost related  rest api
app.get("/cost",async(req,res)=>{
    const  email = req.query.email
    const result = await costCollection.find({email}).toArray()
    res.send(result)
})    

 app.post("/cost" , async(req,res)=>{
         
  try {
    const { title, amount, email, date } = req.body;

    // --- Validation checks ---
    if (!title || !amount || !email) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (typeof amount !== "number" || isNaN(amount)) {
      return res.status(400).json({ error: "Amount must be a number" });
    }

    if (amount < 0) {
      return res.status(400).json({ error: "Amount cannot be negative" });
    }

    // Optional: realistic limit (e.g., max 1 lakh tk)
    if (amount > 1000000) {
      return res.status(400).json({ error: "Amount too high!" });
    }

    // --- If valid then insert ---
    const newCost = { title, amount, email, date };
    const result = await costCollection.insertOne(newCost);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error saving cost:", error);
    res.status(500).json({ error: "Server error" });
  }
 })

 // --------------------------------------------------------------------note related api 
app.get("/note", async (req, res) => {
  const { email, subject } = req.query;
  let filter = { email };

  if (subject && subject.length>=2) {
    filter.subject = { $regex: subject, $options: "i" }; // case-insensitive search
  }

  const notes = await noteCollection.find(filter).toArray();
  res.send(notes);
});


 app.post("/note",async(req,res) =>{
     const newNote = req.body;
     const result = await noteCollection.insertOne(newNote)
     res.send(result)
 })

 // --------------------------------------------------------------------  study plan reated data 

// GET study plan by user
app.get("/studyplan", async (req, res) => {
  const email = req.query.email;
  const result = await studyPlanCollection.find({ email }).toArray();
  res.send(result);
});

 // POST study plan
app.post("/studyplan", async (req, res) => {
  const newPlan = req.body;
  const result = await studyPlanCollection.insertOne(newPlan);
  res.send(result);
});

// delete studdy plan
app.delete("/deleteTask/:id", async(req,res) =>{
         const id  = req.params.id;
         const result = await studyPlanCollection.deleteOne({_id: new ObjectId(id) }) 
         res.send(result)
})

// ---------------------------------------------------------------schedule planer related api 

// GET all classes for a user
app.get("/schedules", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send({ error: "Email required" });
  const classes = await scheduleCollection.find({ email }).toArray();
  res.send(classes);
});


   // POST add a new class/task
app.post("/schedules", async (req, res) => {
  let newClass = req.body;

  // ensure date is always YYYY-MM-DD
  if (newClass.date) {
    const d = new Date(newClass.date);
    newClass.date = d.toISOString().split("T")[0];
  }

  if (!newClass.subject || !newClass.date || !newClass.time || !newClass.email) {
    return res.status(400).send({ error: "All fields are required" });
  }

  const result = await scheduleCollection.insertOne(newClass);
  res.send({ insertedId: result.insertedId });
});

// get single data 
app.get("/singleTask/:id",async(req,res) =>{
       const id= req.params.id;
       const result = await scheduleCollection.findOne({_id: new ObjectId(id)})
       res.send(result)
})


// PUT update a class
app.put("/schedules/:id", async (req, res) => {
  const id = req.params.id;
  const { _id, ...updatedTask } = req.body;
  const result = await scheduleCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedTask }
  );
  res.send(result);
});


// DELETE a class
app.delete("/schedules/:id", async (req, res) => {
  const id = req.params.id;
  const result = await scheduleCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
