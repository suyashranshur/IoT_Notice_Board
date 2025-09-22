import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// index.js

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Ensure this explicit SSL configuration is present for cloud PostgreSQL
  ssl: {
    rejectUnauthorized: false,
  },
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userResult = await pool.query(
      'SELECT * FROM "Credential" WHERE username = $1',
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.json({ success: false, message: "Username not found" });
    }

    const passResult = await pool.query(
      'SELECT * FROM "Credential" WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (passResult.rows.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Incorrect password" });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default app;
