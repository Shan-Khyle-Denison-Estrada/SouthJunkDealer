const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware
app.use(cors());
// INCREASE LIMIT to 50mb to allow image uploads (Base64)
app.use(express.json({ limit: "50mb" }));

// --- ROUTES ---

// 1. REGISTER
app.post("/auth/register", async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      contactNumber,
      address,
      affiliation,
      password,
    } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length > 0)
      return res.status(401).json("User already exists!");

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // Note: We are not inserting profile_photo here, it starts null
    const newUser = await pool.query(
      "INSERT INTO users (first_name, middle_name, last_name, email, contact_number, address, affiliation, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        firstName,
        middleName,
        lastName,
        email,
        contactNumber,
        address,
        affiliation,
        bcryptPassword,
      ],
    );

    const token = jwt.sign(
      { user_id: newUser.rows[0].user_id },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1h" },
    );
    return res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 2. SIGN IN
app.post("/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0)
      return res.status(401).json("Password or Email is incorrect");

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password_hash,
    );
    if (!validPassword)
      return res.status(401).json("Password or Email is incorrect");

    const token = jwt.sign(
      { user_id: user.rows[0].user_id },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1h" },
    );
    return res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 3. GET PROFILE
app.get("/auth/account", async (req, res) => {
  try {
    const token = req.header("token");
    if (!token) return res.status(403).json("Not Authorized");
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret_key");

    // FIX: Selecting 'profile_photo' specifically
    const user = await pool.query(
      "SELECT user_id, first_name, middle_name, last_name, email, contact_number, affiliation, address, profile_photo FROM users WHERE user_id = $1",
      [payload.user_id],
    );

    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 4. UPDATE PROFILE
app.put("/auth/account", async (req, res) => {
  try {
    const token = req.header("token");
    if (!token) return res.status(403).json("Not Authorized");
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret_key");

    const {
      firstName,
      middleName,
      lastName,
      contactNumber,
      affiliation,
      address,
      email,
      profilePhoto, // Frontend sends this as 'profilePhoto' (camelCase)
    } = req.body;

    // FIX: Updating 'profile_photo' (snake_case) in database
    const updateUser = await pool.query(
      "UPDATE users SET first_name = $1, middle_name = $2, last_name = $3, contact_number = $4, affiliation = $5, address = $6, email = $7, profile_photo = $8 WHERE user_id = $9 RETURNING *",
      [
        firstName,
        middleName,
        lastName,
        contactNumber,
        affiliation,
        address,
        email,
        profilePhoto,
        payload.user_id,
      ],
    );

    res.json(updateUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 5. DELETE ACCOUNT
app.delete("/auth/account", async (req, res) => {
  try {
    const token = req.header("token");
    if (!token) return res.status(403).json("Not Authorized");
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret_key");

    await pool.query("DELETE FROM users WHERE user_id = $1", [payload.user_id]);

    res.json("User Deleted");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server starting on port ${PORT}`));
