import React from 'react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend
} from 'recharts';

export default function SensorChart({ data }) {
  const chartData = data.map(d => ({
    time: new Date(d.momento_registro).toLocaleTimeString(),
    temperatura: d.temperatura,
    luminosidade: d.luminosidade,
    umidade_ar: d.umidade_ar,
    umidade_solo: d.umidade_solo
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend verticalAlign="top" />
        <Line type="monotone" dataKey="temperatura" stroke="#ff7300" dot={false}/>
        <Line type="monotone" dataKey="luminosidade" stroke="#387908" dot={false}/>
        <Line type="monotone" dataKey="umidade_ar" stroke="#8884d8" dot={false}/>
        <Line type="monotone" dataKey="umidade_solo" stroke="#82ca9d" dot={false}/>
      </LineChart>
    </ResponsiveContainer>
  );
}
