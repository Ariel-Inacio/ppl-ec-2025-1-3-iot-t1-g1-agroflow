import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Grid, Paper } from '@mui/material';
import SensorChart from './components/SensorChart';
import TargetControls from './components/TargetControls';

function App() {
  const [readings, setReadings] = useState([]);
  const [average, setAverage]   = useState({});
  const [targets, setTargets]   = useState([]);

  // Poll sensor readings
  useEffect(() => {
    const fetch = () => axios.get('/readings').then(r => setReadings(r.data.reverse()));
    fetch();
    const id = setInterval(fetch, 2000);
    return () => clearInterval(id);
  }, []);

  // Poll rolling average
  useEffect(() => {
    const fetch = () => axios.get('/average').then(r => setAverage(r.data));
    fetch();
    const id = setInterval(fetch, 5000);
    return () => clearInterval(id);
  }, []);

  // Poll targets
  useEffect(() => {
    const fetch = () => axios.get('/targets').then(r => setTargets(r.data));
    fetch();
    const id = setInterval(fetch, 5000);
    return () => clearInterval(id);
  }, []);

  const setNewTarget = (vals) => axios.post('/targets', vals);

  return (
    <Container maxWidth="lg" sx={{ mt:4 }}>
      <Typography variant="h4" gutterBottom>IoT Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p:2 }}>
            <Typography variant="h6">Live Sensor Readings</Typography>
            <SensorChart data={readings} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p:2 }}>
            <Typography variant="h6">Targets & Averages</Typography>
            <TargetControls
              average={average}
              latestTarget={targets[0]}
              onSetTarget={setNewTarget}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;
