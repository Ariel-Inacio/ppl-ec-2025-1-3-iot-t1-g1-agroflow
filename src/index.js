"use strict";

const mqtt      = require("mqtt");
const { Pool }  = require("pg");
const express   = require("express");

// Read configuration from environment variables
const MQTT_URL    = process.env.MQTT_URL    || "mqtts://mqtt.verticordia.com";
const PGHOST      = process.env.PGHOST      || "iotpg.verticordia.com";
const PGUSER      = process.env.PGUSER      || "douglas";
const PGPASSWORD  = process.env.PGPASSWORD  || "changeme";
const PGDATABASE  = process.env.PGDATABASE  || "IoT";
const PGPORT      = process.env.PGPORT      || 5432;
const PORT        = process.env.PORT        || 3000;  // for HTTP API if needed

// Map MQTT topics to PostgreSQL column names.
const topicToColumn = {
  "sensor/temperatura" : "temperatura",
  "sensor/luminosidade": "luminosidade",
  "sensor/umidade/ar"  : "umidade_ar",
  "sensor/umidade/solo": "umidade_solo"
};

// Set up PostgreSQL connection pool.
const pool = new Pool({
  host: PGHOST,
  user: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE,
  port: PGPORT,
  ssl: {
    rejectUnauthorized: true
  }
});

// (Optional) Create an Express server to serve your front-end or REST API.
const app = express();
app.use(express.json());

// Sample endpoint to list the latest sensor readings
app.get("/readings", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM public.sensores ORDER BY momento_registro DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

app.listen(PORT, () => {
  console.log(`HTTP API listening on port ${PORT}`);
});

// Aggregation object for sensor data
let measurementBatch = {};
let batchTimer       = null;
const BATCH_INTERVAL = 2000; // 2 seconds aggregation window

// Function to insert a batch into the database.
const processBatch = async () => {
  const timestamp = new Date();
  const { temperatura, luminosidade, umidade_ar, umidade_solo } = measurementBatch;

  // Prepare an INSERT query; note that we assume the id is auto-generated.
  const query = `
    INSERT INTO public.sensores
      (momento_registro, temperatura, luminosidade, umidade_ar, umidade_solo)
    VALUES ($1, $2, $3, $4, $5)
  `;

  try {
    await pool.query(query, [
      timestamp,
      temperatura   || null,
      luminosidade  || null,
      umidade_ar    || null,
      umidade_solo  || null
    ]);
    console.log(`Inserted sensor snapshot at ${timestamp.toISOString()}`);
  } catch (err) {
    console.error("Error inserting sensor data:", err);
  }
  // Reset the batch.
  measurementBatch = {};
  batchTimer     = null;
};

// Function to delete old sensor data (older than 10 minutes)
const deleteOldRecords = async () => {
  const deleteQuery = `
    DELETE FROM public.sensores
    WHERE momento_registro < (NOW() - INTERVAL '10 minutes')
  `;
  try {
    const result = await pool.query(deleteQuery);
    console.log(`Deleted ${result.rowCount} old record(s)`);
  } catch (err) {
    console.error("Error deleting old records:", err);
  }
};

// Schedule deletion of old records every 60 minutes (3600000 ms)
deleteOldRecords();
setInterval(deleteOldRecords, 60 * 60 * 1000);

// Connect to the MQTT broker and subscribe to topics.
const mqttClient = mqtt.connect(MQTT_URL);

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  // Subscribe to all sensor topics
  mqttClient.subscribe("sensor/#", (err) => {
    if (err) {
      console.error("Subscription error:", err);
    }
  });
});

// When a message is received via MQTT...
mqttClient.on("message", (topic, message) => {
  // Convert message to a numeric value (assuming plain text numeric)
  const value = parseFloat(message.toString());
  if (isNaN(value)) {
    console.warn(`Received non-numeric value on topic ${topic}: ${message}`);
  }

  // Map the topic to the corresponding database column
  const column = topicToColumn[topic];
  if (!column) {
    console.warn(`No mapping found for topic: ${topic}`);
    return;
  }

  // Update our batch.
  measurementBatch[column] = isNaN(value) ? null : value;

  // Start a timer if not already active; on expiry, the batch will be inserted.
  if (!batchTimer) {
    batchTimer = setTimeout(processBatch, BATCH_INTERVAL);
  }
});

// 1. GET /targets  – list recent targets
app.get("/targets", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM public.target ORDER BY id DESC LIMIT 50"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching targets:", err);
    res.status(500).json({ error: "DB error" });
  }
});

// 2. POST /targets – create a new target
app.post("/targets", async (req, res) => {
  const { temperatura, luminosidade, umidade_ar, umidade_solo } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO public.target
         (temperatura, luminosidade, umidade_ar, umidade_solo)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [temperatura, luminosidade, umidade_ar, umidade_solo]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error inserting target:", err);
    res.status(500).json({ error: "DB error" });
  }
});

// 3. DELETE /targets/:id – delete a target
/* app.delete("/targets/:id", async (req, res) => {
  try {
    const { rows, rowCount } = await pool.query(
      "DELETE FROM public.target WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error deleting target:", err);
    res.status(500).json({ error: "DB error" });
  }
}); */

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  mqttClient.end();
  await pool.end();
  process.exit();
});

const path = require('path');
app.use(express.static(path.join(__dirname, '../client/build')));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});
