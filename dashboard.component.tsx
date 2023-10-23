import React from "react";
import styled from "styled-components";

const Title = styled.div`
  text-align: center;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  font-family: 'Arial',sans-serif;
  height: 100%;
  font-size: 20px;
  background: linear-gradient(to top left, rgba(181, 193, 52, 0.8), rgba(61, 111, 167, 0.8), rgba(184, 73, 101, 0.8), rgba(97, 69, 143, 0.8));
  display: grid;
  place-items: center;
  font-weight: 600;
`;

const Text = styled.p`
  color: #0f1b27;
`;

const DashboardComponent = () => {
  return (
    <Title>
      <Text>Bienvenido(a) al panel de administración del Sistema de Comedores Comunitarios del DIF Atizapán</Text>
    </Title>
  );
};

export default DashboardComponent;