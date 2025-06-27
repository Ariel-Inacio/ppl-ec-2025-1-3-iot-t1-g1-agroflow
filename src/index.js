// ========================================================================= //
//                           CONFIGURAÇÕES GERAIS                            //
// ========================================================================= //

"use strict";

// Inclusão dos módulos.
const mqtt      = require("mqtt");
const { Pool }  = require("pg");
const express   = require("express");

// Termina programa ao receber o sinal de interrupção.
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  mqttClient.end();
  await pool.end();
  process.exit();
});


/// Recebe as configurações das variáveis de ambiente, ou usa um padrão.

// Broker MQTT.
const MQTT_URL    = process.env.MQTT_URL    || "mqtts://mqtt.verticordia.com";

// Banco de dados PostgreSQL.
const PGHOST      = process.env.PGHOST      || "iotpg.verticordia.com";
const PGUSER      = process.env.PGUSER      || "douglas";
const PGPASSWORD  = process.env.PGPASSWORD  || "senha-padrão-favor-mudar!";
const PGDATABASE  = process.env.PGDATABASE  || "IoT";
const PGPORT      = process.env.PGPORT      || 5432;

// Porta da API REST.
const PORT        = process.env.PORT        || 3000;


// Instancia conexão com o banco de dados.
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


// Instancia conexão com o broker MQTT.
const mqttClient = mqtt.connect(MQTT_URL);

// ========================================================================= //
//                           GERÊNCIA DOS SENSORES                           //
// ========================================================================= //

// Associa cada tópico MQTT às colunas das tabelas de leituras dos sensores.
const topicToColumn = {
  "sensor/temperatura" : "temperatura",
  "sensor/luminosidade": "luminosidade",
  "sensor/umidade/ar"  : "umidade_ar",
  "sensor/umidade/solo": "umidade_solo"
};

let measurementBatch = {};   // Objeto para agregar dados dos sensores.
let batchTimer       = null; // Timer para a agregação.
const BATCH_INTERVAL = 2000; // Janela de agregação de dois segundos.

// Insere um novo agregado de leituras ao banco de dados.
const processBatch = async () => {
  const timestamp = new Date();
  const { temperatura, luminosidade, umidade_ar, umidade_solo } = measurementBatch;

  // Prepara uma query de inserção (o id será gerado sequencialmente).
  const query = `
    INSERT INTO public.sensores
      (momento_registro, temperatura, luminosidade, umidade_ar, umidade_solo)
    VALUES ($1, $2, $3, $4, $5)
  `;

  try {
    await pool.query(query, [
      timestamp,
      // Usamos o operador "nullish" para que valores 0 continuem sendo 0.
      temperatura ?? null,
      luminosidade ?? null,
      umidade_ar ?? null,
      umidade_solo ?? null
    ]);
    console.log(`Inserted sensor snapshot at ${timestamp.toISOString()}`);
  } catch (err) {
    console.error("Error inserting sensor data:", err);
  }

  // Reseta o agregado e o timer.
  measurementBatch = {};
  batchTimer       = null;
};

// Deleta tados antigos dos sensores (aqueles que têm mais de dez minutos).
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

// Agenda a deleção de registros antigos a cada 60 minutos.
deleteOldRecords();                            // Deleta ao iniciar execução...
setInterval(deleteOldRecords, 60 * 60 * 1000); // ...e novamente a cada hora.

// Callback para que, ao conectar ao broker, nos inscrevamos a todos os tópicos
// de todos os sensores.
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe("sensor/#", (err) => {
    if (err) {
      console.error("Subscription error:", err);
    }
  });
});

// Callback para quando uma mensagem for recebida via MQTT.
mqttClient.on("message", (topic, message) => {
  // Converte a mensagem para um valor numérico float.
  const value = parseFloat(message.toString());
  if (isNaN(value)) {
    console.warn(`Received non-numeric value on topic ${topic}: ${message}`);
  }

  // Determina correspondência do tópico à sua coluna na tabela.
  const column = topicToColumn[topic];
  if (!column) {
    console.warn(`No mapping found for topic: ${topic}`);
    return;
  }

  // Atualiza o objeto agregado com a leitura deste sensor.
  measurementBatch[column] = isNaN(value) ? null : value;

  // Se o timer já não estiver inicializado, o iniciamos. No timeout,
  // realizamos a inserção na tabela por meio deste callback.
  if (!batchTimer) {
    batchTimer = setTimeout(processBatch, BATCH_INTERVAL);
  }
});

// ========================================================================= //
//                          GERÊNCIA DOS ATUADORES                           //
// ========================================================================= //

const ACTUATOR_DEBOUNCE_MS    = 10_000; // 10s entre (des)ativações dos atuadores.
const PUMP_COOLDOWN_MS        = 30_000; // 30 s entre ativaçoes da bomba.
const FANS_DISABLE_AFTER_PUMP = 15_000; // 15s após bomba para desativar ventoinhas.
const CONTROL_INTERVAL_MS     = 3_000;  // Controlar atuadores a cada 3s.

// Objeto para notar os tempos de última ativação ou desativação, e o estado
// atual de cada atuador.
const controlState = {
  lamp: { lastToggle    : 0, state: null                     },
  fans: { lastToggle    : 0, state: null  , disableUntil : 0 },
  pump: { lastActivation: 0                                  }
};

// Query com CROSS JOIN LATERAL para associar dinamicamente a visão das médias
// móveis ao último registro na tabela de alvos.
const actuatorQuery = `
  SELECT
    v.avg_temperatura   AS avg_temp,
    v.avg_luminosidade  AS avg_lux,
    v.avg_umidade_ar    AS avg_air_humidity,
    v.avg_umidade_solo  AS avg_soil_humidity,
    t.temperatura       AS target_temp,
    t.luminosidade      AS target_lux,
    t.umidade_ar        AS target_air_humidity,
    t.umidade_solo      AS target_soil_humidity
  FROM public.vw_avg_last_30_seconds v
  CROSS JOIN LATERAL (
    SELECT temperatura, luminosidade, umidade_ar, umidade_solo
    FROM public.target
    ORDER BY id DESC
    LIMIT 1
  ) t;
`;

// Agenda o controle dos atuadores.
setInterval(controlActuators, CONTROL_INTERVAL_MS);

// Executa o controle dos atuadores.
async function controlActuators() {
  try {
    const { rows } = await pool.query(actuatorQuery); // Executa a query.
    const d = rows[0]; // Obtém o primeiro registro.
    if (!d) {
      console.warn("No target row found, skipping actuator cycle");
      return;
    }

    const now = Date.now();

    // Ativa a lâmpada se a luminosidade média for menor que o alvo.
    const wantedLamp = d.avg_lux < d.target_lux ? "1" : "0";
    if (
      controlState.lamp.state !== wantedLamp &&
      now - controlState.lamp.lastToggle >= ACTUATOR_DEBOUNCE_MS
    ) {
      mqttClient.publish("atuador/lampada", wantedLamp);
      controlState.lamp = { state: wantedLamp, lastToggle: now };
      console.log(`💡 Lamp set to ${wantedLamp} @ ${new Date(now).toISOString()}`);
    }

    // Ativa as ventoinhas se a temperatura média ou a umidade do ar média
    // estiverem acima das suas médias respectivas, mas não dentro da janela de
    // timeout.
    const fansAllowed = now >= controlState.fans.disableUntil;
    const needFans =
      fansAllowed &&
      (d.avg_temp > d.target_temp || d.avg_air_humidity > d.target_air_humidity);
    const wantedFans = needFans ? "1" : "0";

    if (
      controlState.fans.state !== wantedFans &&
      now - controlState.fans.lastToggle >= ACTUATOR_DEBOUNCE_MS
    ) {
      mqttClient.publish("atuador/ventoinhas", wantedFans);
      controlState.fans = {
        ...controlState.fans,
        state: wantedFans,
        lastToggle: now
      };
      console.log(`🌬️ Fans set to ${wantedFans} @ ${new Date(now).toISOString()}`);
    }

    // Dispara a bomba uma vez se a umidade do solo está abaixo do alvo.
    if (
      d.avg_soil_humidity < d.target_soil_humidity &&
      now - controlState.pump.lastActivation >= PUMP_COOLDOWN_MS
    ) {
      // Desativa as ventoinhas à força, ignorando o debounce, já que não
      // queremos que a ventoinha expulse a água que está irrigando o solo.
      if (controlState.fans.state === "1") {
        mqttClient.publish("atuador/ventoinhas", "0");
        controlState.fans = {
          ...controlState.fans,
          state: "0",
          lastToggle: now
        };
        console.log(`🌬️ Fans forced OFF for pump @ ${new Date(now).toISOString()}`);
      }

      // Dispara a bomba.
      mqttClient.publish("atuador/bomba", "1");
      controlState.pump.lastActivation = now;
      console.log(`💧 Pump ACTIVATED @ ${new Date(now).toISOString()}`);

      // Seta a janela para manter as ventoinhas desabilitadas.
      controlState.fans.disableUntil = now + FANS_DISABLE_AFTER_PUMP;
    }
  } catch (err) {
    console.error("Error in actuator control:", err);
  }
}


// ========================================================================= //
//                                 API REST                                  //
// ========================================================================= //

// Cria um app Express para o front-end e para a API REST.
const app = express();
app.use(express.json());
app.listen(PORT, () => {
  console.log(`HTTP API listening on port ${PORT}`);
});

// Endpoint simples para listar as últimas 50 leituras dos sensores.
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

// Endpoint para  leitura da visão das médias móveis dos últimos 30 segundos.
app.get("/average", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM public.vw_avg_last_30_seconds"
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

// Endpoint para ler os 50 alvos mais recentes.
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

// Endpoint POST para criar um novo alvo.
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

// Cria o endpoint no caminho raiz para servir o cliente.
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/build')));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});
