// client/src/components/SensorTable.js
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

export default function SensorTable({ readings }) {
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell align="right">Temperatura (°C)</TableCell>
            <TableCell align="right">Luminosidade</TableCell>
            <TableCell align="right">Umidade (Ar %)</TableCell>
            <TableCell align="right">Umidade (Solo %)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {readings.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{new Date(row.momento_registro).toLocaleTimeString()}</TableCell>
              <TableCell align="right">{row.temperatura}</TableCell>
              <TableCell align="right">{row.luminosidade}</TableCell>
              <TableCell align="right">{row.umidade_ar}</TableCell>
              <TableCell align="right">{row.umidade_solo}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
