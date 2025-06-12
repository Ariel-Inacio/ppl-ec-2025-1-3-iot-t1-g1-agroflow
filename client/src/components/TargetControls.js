import React, { useState, useEffect } from 'react';
import { Box, Slider, Typography, Button } from '@mui/material';

export default function TargetControls({ average, latestTarget, onSetTarget }) {
  const [vals, setVals] = useState({
    temperatura: average.avg_temperatura || 0,
    luminosidade: average.avg_luminosidade || 0,
    umidade_ar: average.avg_umidade_ar || 0,
    umidade_solo: average.avg_umidade_solo || 0
  });

  // sync with latestTarget
  useEffect(() => {
    if (latestTarget) {
      setVals({
        temperatura: latestTarget.temperatura,
        luminosidade: latestTarget.luminosidade,
        umidade_ar: latestTarget.umidade_ar,
        umidade_solo: latestTarget.umidade_solo
      });
    }
  }, [latestTarget]);

  const makeSlider = (key, max) => (
    <Box key={key} sx={{ mb:2 }}>
      <Typography>{key.replace('_',' ')}: {vals[key]}</Typography>
      <Slider
        value={vals[key]}
        min={0} max={max}
        onChange={(e,v)=>setVals(vs=>({...vs,[key]:v}))}
        valueLabelDisplay="auto"
      />
    </Box>
  );

  return (
    <Box>
      {makeSlider('temperatura', 50)}
      {makeSlider('luminosidade', 10000)}
      {makeSlider('umidade_ar', 100)}
      {makeSlider('umidade_solo', 1000)}
      <Button variant="contained" onClick={()=>onSetTarget(vals)}>
        Save Targets
      </Button>
    </Box>
  );
}
