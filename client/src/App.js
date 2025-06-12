import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Grid, Paper, Box } from '@mui/material';
import SensorChart from './components/SensorChart';
import Gauge from './components/Gauge';
import SensorSlider from './components/SensorSlider';

const sensors = [
  { key: 'temperatura', label: 'Temperature (°C)',    max: 50,    color: '#ff7300' },
  { key: 'luminosidade',label: 'Luminosity (lux)',    max: 10000, color: '#fdd835' },
  { key: 'umidade_ar',  label: 'Humidity (Air %)',    max: 100,   color: '#42a5f5' },
  { key: 'umidade_solo',label: 'Humidity (Soil %)',   max: 1000,  color: '#8d6e63' }
];

function App() {
  const [readings, setReadings] = useState([]);
  const [average, setAverage]   = useState({});
  const [targets, setTargets]   = useState([]);

  // Poll endpoints
  useEffect(() => {
    const fR = () => axios.get('/readings').then(r => setReadings(r.data));
    const intR = setInterval(fR, 2000); fR();
    return () => clearInterval(intR);
  }, []);
  useEffect(() => {
    const fA = () => axios.get('/average').then(r => setAverage(r.data));
    const intA = setInterval(fA, 5000); fA();
    return () => clearInterval(intA);
  }, []);
  useEffect(() => {
    const fT = () => axios.get('/targets').then(r => setTargets(r.data));
    const intT = setInterval(fT, 5000); fT();
    return () => clearInterval(intT);
  }, []);

  const handleSetTarget = vals => axios.post('/targets', vals);

  return (
    <>
      <header>Painel de Controle AgroFlow</header>
      <Container sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {sensors.map(({ key, label, max, color }) => (
            <Grid key={key} item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box mb={2}>
                  <Gauge
                    value={average[`avg_${key}`]}
                    max={max}
                    color={color}
                    label={label}
                  />
                </Box>
                <Box mb={2} sx={{ height: 250 }}>
                  <SensorChart
                    data={readings}
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
      </Container>
    </>
  );
}

export default App;
