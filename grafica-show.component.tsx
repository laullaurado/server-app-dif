import React, { Component } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import styled from "styled-components";

class GraficaComponent extends React.Component {
  state = { 
    datos: [
    {
        "fecha": "12/10/2023",
        "pagada": "0",
        "donada": "1",
        "llevar": "1",
        "total": "1"
    },
    {
        "fecha": "15/10/2023",
        "pagada": "5",
        "donada": "2",
        "llevar": "7",
        "total": "7"
    },
    {
        "fecha": "16/10/2023",
        "pagada": "29",
        "donada": "11",
        "llevar": "40",
        "total": "40"
    },
    {
        "fecha": "17/10/2023",
        "pagada": "9",
        "donada": "1",
        "llevar": "10",
        "total": "10"
    },
    {
        "fecha": "31/10/2023",
        "pagada": "2",
        "donada": "0",
        "llevar": "2",
        "total": "2"
    }
]
    
  };

  render() {
    const datos = this.state.datos;
    
    const Contenedor = styled.div`
      display: grid;
    place-items: center;
    `;

    const renderLineChart = (
      <Contenedor>
      <LineChart width={600} height={300} data={datos} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <Line type="monotone" dataKey="pagada" stroke="#8884d8" strokeWidth={3} />
        <Line type="monotone" dataKey="donada" stroke="#FF5733" strokeWidth={3} />
        <Line type="monotone" dataKey="llevar" stroke="#4AC629" strokeWidth={3} />
        <Line type="monotone" dataKey="total" stroke="#AF28B3" strokeWidth={3} />
        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
        <XAxis dataKey="fecha" />
        <YAxis type="number" domain={[0, 50]} />
        <Tooltip />
      </LineChart>
      </Contenedor>
    );
    
    return renderLineChart;
  }
}

export default GraficaComponent;
