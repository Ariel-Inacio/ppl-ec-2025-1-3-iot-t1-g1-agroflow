import React from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis, Tooltip
} from 'recharts';

export default function SensorChart({ data, dataKey, color }) {
  const chartData = data.map(d => ({
    time: new Date(d.momento_registro).toLocaleTimeString(),
    [dataKey]: d[dataKey]
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
