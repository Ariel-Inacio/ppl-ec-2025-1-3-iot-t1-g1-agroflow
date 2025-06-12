import React, { useState, useEffect } from 'react';
import { Box, Slider, Button, Typography } from '@mui/material';

export default function SensorSlider({
  keyName, max, color,
  latestTarget = {},
  onSetTarget,
}) {
  const [value, setValue]     = useState(latestTarget[keyName] || 0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) {
      setValue(latestTarget[keyName] || 0);
    }
  }, [latestTarget, editing, keyName]);

  const onChange = (_, v) => {
    setEditing(true);
    setValue(v);
  };

  // Merge latestTarget with the current slider value so that all fields are included.
  const save = () => {
    onSetTarget({
      ...latestTarget,    // Include values from the latest target
      [keyName]: value    // Overwrite the current sensor with new value
    });
    setEditing(false);
  };

  const cancel = () => {
    setValue(latestTarget[keyName] || 0);
    setEditing(false);
  };

  return (
    <Box>
      <Typography gutterBottom>
        Target: {value}
      </Typography>
      <Slider
        value={value}
        min={0}
        max={max}
        onChange={onChange}
        sx={{ color, mb: 1 }}
      />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          disabled={!editing}
          onClick={save}
        >
          Save
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={cancel}
          sx={{ visibility: editing ? 'visible' : 'hidden' }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
