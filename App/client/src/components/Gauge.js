import React from 'react';
import { Typography, Box } from '@mui/material';
import {
  ResponsiveContainer, RadialBarChart,
  RadialBar, PolarAngleAxis
} from 'recharts';

export default function Gauge({ value = 0, max = 100, color, label }) {
  // Convert value to a number in case it is a string
  const numericValue = parseFloat(value) || 0;
  const percent = Math.min((numericValue / max) * 100, 100);
  const data = [{ name: label, value: percent, fill: color }];

  return (
    <Box textAlign="center">
      <Typography variant="subtitle1">
        <h3>{label}</h3>Média: {numericValue.toFixed(2)}
      </Typography>
      <ResponsiveContainer width="100%" height={100}>
        <RadialBarChart
          cx="50%" cy="100%"
          innerRadius="80%" outerRadius="100%"
          data={data}
          startAngle={180} endAngle={0}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            minAngle={15}
            background={{ fill: '#eee' }}
            clockWise
            dataKey="value"
            cornerRadius={30}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </Box>
  );
}
