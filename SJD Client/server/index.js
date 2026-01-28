const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to access req.body

// Routes

// Simple test route to check DB connection
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Server is running!", db_time: result.rows[0].now });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is starting on port ${PORT}`);
});
