import express from 'express';
const router = express.Router();
import dbQueries from '../dbQueries.js';

router.get('/graficaPrueba', async (req, res) => {
  try {
    const datos = await dbQueries.many('SELECT * FROM comedor;');
    res.json(datos);
    res.status(200);
    res.send();
  } catch (error) {
    // Manejar errores
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

router.get('/grafica', async (req, res) => {
  try {
    const datos = await dbQueries.many(`WITH t_pagada AS ( SELECT TO_CHAR(fechahora, 'DD/MM/YYYY') AS fecha, COUNT(idvisita) AS pagada    FROM visita    WHERE comedor = 1 AND racionpagada = true AND TO_CHAR(fechahora, 'YYYY-MM') = '2023-10'    GROUP BY TO_CHAR(fechahora, 'DD/MM/YYYY')),t_donada AS (    SELECT TO_CHAR(fechahora, 'DD/MM/YYYY') AS fecha, COUNT(idvisita) AS donada    FROM visita    WHERE comedor = 1 AND racionpagada = false AND TO_CHAR(fechahora, 'YYYY-MM') = '2023-10'    GROUP BY TO_CHAR(fechahora, 'DD/MM/YYYY')),t_llevar AS (    SELECT TO_CHAR(fechahora, 'DD/MM/YYYY') AS fecha, COUNT(idvisita) AS llevar    FROM visita    WHERE comedor = 1 AND parallevar = true AND TO_CHAR(fechahora, 'YYYY-MM') = '2023-10'    GROUP BY TO_CHAR(fechahora, 'DD/MM/YYYY'))SELECT COALESCE(t_pagada.fecha, t_donada.fecha, t_llevar.fecha) AS fecha,       COALESCE(t_pagada.pagada, 0) AS pagada,       COALESCE(t_donada.donada, 0) AS donada,       COALESCE(t_llevar.llevar, 0) AS llevar,       COALESCE(t_pagada.pagada, 0) + COALESCE(t_donada.donada, 0) AS total FROM t_pagada LEFT JOIN t_donada ON t_pagada.fecha = t_donada.fecha LEFT JOIN t_llevar ON t_pagada.fecha = t_llevar.fecha UNION SELECT COALESCE(t_donada.fecha, t_pagada.fecha, t_llevar.fecha) AS fecha,       COALESCE(t_pagada.pagada, 0) AS pagada,       COALESCE(t_donada.donada, 0) AS donada,       COALESCE(t_llevar.llevar, 0) AS llevar,       COALESCE(t_pagada.pagada, 0) + COALESCE(t_donada.donada, 0) AS total FROM t_donada LEFT JOIN t_pagada ON t_donada.fecha = t_pagada.fecha LEFT JOIN t_llevar ON t_donada.fecha = t_llevar.fecha;`);
    res.json(datos);
    res.status(200);
    res.send();
  } catch (error) {
    // Manejar errores
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

export default router;
