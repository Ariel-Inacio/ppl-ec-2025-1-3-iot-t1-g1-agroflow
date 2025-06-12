// client/src/components/TargetControls.js
import React, { useState, useEffect } from 'react';
import { Box, Slider, Typography, Button } from '@mui/material';

export default function TargetControls({ average, latestTarget, onSetTarget }) {
  // pendingTarget holds unsaved slider values
  const [pendingTarget, setPendingTarget] = useState(null);
  // isEditing indicates that the user is modifying the sliders
  const [isEditing, setIsEditing] = useState(false);

  // When a new latestTarget comes in from polling and we are not editing, sync up.
  useEffect(() => {
    if (!isEditing && latestTarget) {
      setPendingTarget({
        temperatura: latestTarget.temperatura,
        luminosidade: latestTarget.luminosidade,
        umidade_ar: latestTarget.umidade_ar,
        umidade_solo: latestTarget.umidade_solo,
      });
    }
  }, [latestTarget, isEditing]);

  // When the slider is moved, mark editing and update the pendingTarget.
  const handleSliderChange = (key, newValue) => {
    setIsEditing(true);
    setPendingTarget(prev => ({ ...prev, [key]: newValue }));
  };

  // When the user clicks Save, send the pendingTarget to the server and clear editing.
  const handleSave = () => {
    onSetTarget(pendingTarget);
    setIsEditing(false);
  };

  // When the user clicks Cancel, revert to the latestTarget values and clear editing.
  const handleCancel = () => {
    setIsEditing(false);
    if (latestTarget) {
      setPendingTarget({
        temperatura: latestTarget.temperatura,
        luminosidade: latestTarget.luminosidade,
        umidade_ar: latestTarget.umidade_ar,
        umidade_solo: latestTarget.umidade_solo,
      });
    }
  };

  // Helper to render a slider. The slider color changes if editing.
  const makeSlider = (key, max) => (
    <Box key={key} sx={{ mb: 2 }}>
      <Typography sx={{ color: isEditing ? 'primary.main' : 'inherit' }}>
        {key.replace('_',' ')}: {pendingTarget ? pendingTarget[key] : 0}
      </Typography>
      <Slider
        value={pendingTarget ? pendingTarget[key] : 0}
        min={0}
        max={max}
        onChange={(e, v) => handleSliderChange(key, v)}
        valueLabelDisplay="auto"
        sx={{ color: isEditing ? 'primary.main' : undefined }}
      />
    </Box>
  );

  return (
    <Box>
      {makeSlider('temperatura', 50)}
      {makeSlider('luminosidade', 10000)}
      {makeSlider('umidade_ar', 100)}
      {makeSlider('umidade_solo', 1000)}
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button variant="contained" onClick={handleSave} disabled={!isEditing}>
          Save Targets
        </Button>
        {isEditing && (
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </Box>
    </Box>
  );
}
