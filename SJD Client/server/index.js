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

// --- AUTH ROUTES ---

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
      profilePhoto,
    } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length > 0)
      return res.status(401).json("User already exists!");

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (first_name, middle_name, last_name, email, contact_number, address, affiliation, password, profile_photo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        firstName,
        middleName,
        lastName,
        email,
        contactNumber,
        address,
        affiliation,
        bcryptPassword,
        profilePhoto,
      ],
    );

    const token = jwt.sign(
      { user_id: newUser.rows[0].user_id },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1h" },
    );

    res.json({ token });
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

// 3. GET USER INFO
// Kept /auth/account to match your frontend request
app.get("/auth/account", async (req, res) => {
  try {
    const token = req.header("token");
    if (!token) return res.status(403).json("Not Authorized");
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret_key");

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

// Alias for /auth/home if needed
app.get("/auth/home", async (req, res) => {
  try {
    const token = req.header("token");
    if (!token) return res.status(403).json("Not Authorized");
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret_key");

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

// 4. UPDATE USER
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
      profilePhoto,
      password,
    } = req.body;

    let updateUser;

    if (password) {
      const saltRound = 10;
      const salt = await bcrypt.genSalt(saltRound);
      const bcryptPassword = await bcrypt.hash(password, salt);

      updateUser = await pool.query(
        "UPDATE users SET first_name = $1, middle_name = $2, last_name = $3, contact_number = $4, affiliation = $5, address = $6, email = $7, profile_photo = $8, password = $9 WHERE user_id = $10 RETURNING *",
        [
          firstName,
          middleName,
          lastName,
          contactNumber,
          affiliation,
          address,
          email,
          profilePhoto,
          bcryptPassword,
          payload.user_id,
        ],
      );
    } else {
      updateUser = await pool.query(
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
    }

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

// --- BOOKING ROUTES (NEW) ---

// 6. CREATE A BOOKING
app.post("/auth/bookings", async (req, res) => {
  try {
    // A. Verify Token & Get UUID
    const token = req.header("token");
    if (!token) return res.status(403).json("Not Authorized");
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    const user_id = payload.user_id;

    // B. Get Data from Frontend
    const { transactionType, date, address, notes, scrapPhotos, lineItems } =
      req.body;

    // C. Start Transaction
    await pool.query("BEGIN");

    // D. Insert into 'bookings' table
    const newBooking = await pool.query(
      `INSERT INTO bookings 
      (user_id, transaction_type, pickup_date, pickup_address, notes, photos, is_pickup) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id`,
      [
        user_id,
        transactionType,
        date,
        address,
        notes,
        scrapPhotos,
        true, // is_pickup default
      ],
    );

    const bookingId = newBooking.rows[0].id;

    // E. Insert Line Items
    for (const item of lineItems) {
      if (item.material && item.material.trim() !== "") {
        await pool.query(
          `INSERT INTO booking_items (booking_id, material_name, estimated_weight)
           VALUES ($1, $2, $3)`,
          [bookingId, item.material, item.estimatedWeight],
        );
      }
    }

    // F. Commit changes
    await pool.query("COMMIT");
    res.json({ message: "Booking created successfully", bookingId });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 7. GET USER'S BOOKINGS (For History)
app.get("/bookings/my-bookings", async (req, res) => {
  try {
    const token = req.header("token");
    if (!token) return res.status(403).json("Not Authorized");
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret_key");

    // Join bookings with items
    const allBookings = await pool.query(
      `SELECT b.*, 
       json_agg(bi.*) as items 
       FROM bookings b
       LEFT JOIN booking_items bi ON b.id = bi.booking_id
       WHERE b.user_id = $1
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [payload.user_id],
    );

    res.json(allBookings.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.listen(5000, () => {
  console.log("server has started on port 5000");
});
