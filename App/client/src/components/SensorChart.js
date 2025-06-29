// SensorChart.js
import React from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis, Tooltip
} from 'recharts';

export default function SensorChart({ data, dataKey, color }) {
  const chartData = data.map(d => ({
    timestamp: new Date(d.momento_registro).getTime(),  // Use timestamp
    [dataKey]: d[dataKey]
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()}
          tick={{ fontSize: 12 }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip labelFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()} />
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
