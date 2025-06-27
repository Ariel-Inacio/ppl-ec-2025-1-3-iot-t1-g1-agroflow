import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Grid, Paper, Box, Typography } from '@mui/material';
import SensorChart from './components/SensorChart';
import Gauge from './components/Gauge';
import SensorSlider from './components/SensorSlider';
import SensorTable from './components/SensorTable';

const sensors = [
  { key: 'temperatura', label: 'Temperatura (°C)', max: 80,   color: '#ff7300' },
  { key: 'luminosidade',label: 'Luminosidade',     max: 4096, color: '#fdd835' },
  { key: 'umidade_ar',  label: 'Umidade (Ar %)',   max: 100,  color: '#42a5f5' },
  { key: 'umidade_solo',label: 'Umidade (Solo)',   max: 4096, color: '#8d6e63' }
];

function App() {
  const [readings, setReadings] = useState([]);
  const [average, setAverage]   = useState({});
  const [targets, setTargets]   = useState([]);

  // Poll endpoints
  useEffect(() => {
    const fR = () => axios.get('/readings').then(r => setReadings(r.data));
    const intR = setInterval(fR, 500); fR();
    return () => clearInterval(intR);
  }, []);
  useEffect(() => {
    const fA = () => axios.get('/average').then(r => setAverage(r.data));
    const intA = setInterval(fA, 500); fA();
    return () => clearInterval(intA);
  }, []);
  useEffect(() => {
    const fT = () => axios.get('/targets').then(r => setTargets(r.data));
    const intT = setInterval(fT, 500); fT();
    return () => clearInterval(intT);
  }, []);

  const handleSetTarget = vals => axios.post('/targets', vals);

  // Calculate the timestamp for ten minutes ago
  const tenMinutesAgo = new Date().getTime() - 10 * 60 * 1000;

  return (
    <>
      <header>Painel de Controle AgroFlow</header>
      <Container sx={{ py: 4 }}>
        <Grid container spacing={4} justifyContent="center">
          {sensors.map(({ key, label, max, color }) => (
            <Grid key={key} item xs={12} md={6} sx={{ minWidth: 400 }}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box mb={2}>
                  <Gauge
                    value={average[`avg_${key}`]}
                    max={max}
                    color={color}
                    label={label}
                  />
                </Box>
                <Box mb={2} sx={{ height: 300 }}>
                  <SensorChart
                    data={readings.filter(r => new Date(r.momento_registro).getTime() >= tenMinutesAgo)}
                    dataKey={key}
                    color={color}
                  />
                </Box>
                <SensorSlider
                  keyName={key}
                  label={label}
                  max={max}
                  color={color}
                  latestTarget={targets[0] || {}}
                  onSetTarget={handleSetTarget}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box mt={4}>
          <Typography variant="h6" gutterBottom>Dados dos Sensores</Typography>
          <SensorTable readings={readings} />
        </Box>
      </Container>
    </>
  );
}

export default App;
