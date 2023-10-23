import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import express from 'express';
import Connect from 'connect-pg-simple';
import session from 'express-session';
import { Adapter, Resource, Database } from '@adminjs/sql';
import { ComponentLoader } from 'adminjs';
import passwordsFeature from '@adminjs/passwords';
import * as url from 'url';
import bcrypt from 'bcrypt';

import https from 'https';
import fs from 'fs';

import dbQueries from './dbQueries.js';
import visitasRouter from './routes/visitas.js';

const PORT = 8080;
const IPADDR = '3.227.215.149';
const DOMAIN = 'ccdifatizapan.ddns.net';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const certificate = fs.readFileSync(`/etc/letsencrypt/live/${DOMAIN}/fullchain.pem`, 'utf8');
const privateKey = fs.readFileSync(`/etc/letsencrypt/live/${DOMAIN}/privkey.pem`, 'utf8');
const credentials = { key: privateKey, cert: certificate};

const app = express();
const httpsServer = https.createServer(credentials, app);

////////////////////////////////
/////// PÁGINA DEL ADMIN ///////
////////////////////////////////

app.use(express.static(__dirname + '/public/css/'));
app.use(express.static(__dirname + '/pdfs/'));
app.use('/visitas', visitasRouter);
app.use(express.json());

AdminJS.registerAdapter({
  Database,
  Resource,
});

const dbResources = await new Adapter('postgresql', {
    connectionString: 'postgres://comedores_comunitarios:comedores_comunitarios@localhost:5432/comedores_comunitarios',
    database: 'comedores_comunitarios',
  }).init();
  
const componentLoader = new ComponentLoader();

const Components = {
  GraficaShow: componentLoader.add('GraficaShow', './grafica-show'),
  Dashboard: componentLoader.add('Dashboard', './dashboard'),
};
  
const authenticate = async (email, password) => {
  const user = await dbQueries.oneOrNone('SELECT * FROM Administrador WHERE correo = $1 AND contrasena = $2', [email, password]);
  
  if (user) {
    // Usuario y contraseña son válidos
    const currentAdmin = {
      email: user.correo,
    };
    return currentAdmin;
  } else {
    // Usuario o contraseña incorrectos
    return null;
  }
};

const start = async () => {

  const admin = new AdminJS({
    branding: {
      companyName: 'Sistema de comedores comunitarios, DIF Atizapán',
      softwareBrothers: false,
      favicon: '/favicon.ico',
    },
    assets: {
      styles: ["/login.css"]
    },
    componentLoader,
    dashboard: {
			component: Components.Dashboard
		},
    resources: [
      {
        resource: dbResources.table('comedor'),
        options: {
          properties: {
            idcomedor: {
              isVisible: false,
            },
            folio: {
              type: 'number',
            },
            municipio: {
              type: 'reference',
              reference: 'municipio',
              isVisible: false, // oculta el campo en el formulario
            },
            encargado: {
              isVisible: {
                edit: true,
                show: true,
                list: false,
                filter: false,
              },
            },
            usuario: {
              isVisible: {
                edit: true,
                show: true,
                list: false,
                filter: false,
              },
            },
            contrasena: {
              type: 'password', // Tipo del campo
              isVisible: {
                edit: true,
                show: false,
                list: false,
                filter: false,
              },
            },
            costoracion: {
              type: 'number', // Tipo del campo
              isVisible: {
                edit: true,
                show: true,
                list: false,
                filter: false,
              },
            },
            limitedonaciones: {
              type: 'number', // Tipo del campo
              isVisible: {
                edit: true,
                show: true,
                list: false,
                filter: false,
              },
              components: {
                show: Components.GraficaShow,
              }
            },
            horarioapertura: {
              type: 'text', // Tipo del campo
              isVisible: false,
            },
            horariocierre: {
              type: 'text', // Tipo del campo
              isVisible: false,
            },
          },
          navigation: null,
        },
        actions: {
          new: {
            before: async (request) => {
              // Establece el id del municipio como 1 antes de guardar el nuevo comedor
              request.payload.municipio = 1;
              
              return request;
            },
          },
        },
      },
      {
        resource: dbResources.table('condicion'),
        options: {
          properties: {
            idcondicion: {
              isVisible: false,
            },
          },
          navigation: null,
        },
      },
      {
        resource: dbResources.table('reporte'),
        options: {
          properties: {
            idreporte: {
              isVisible: false,
            },
            comedor: {
              type: 'reference',
              reference: 'comedor',
              isVisible: false, // oculta el campo en el formulario
            },
          },
          navigation: null,
        },
      },
      {
        resource: dbResources.table('administrador'),
        options: {
          properties: {
            idadministrador: {
              isVisible: false,
            },
            usuario: {
              isVisible: {
                edit: true,
                show: false,
                list: false,
                filter: false,
              },
            },
            contrasena: {
              type: 'password',
              isVisible: {
                edit: true,
                show: false,
                list: false,
                filter: false,
              },
            },
            municipio: {
              type: 'reference',
              reference: 'municipio',
              isVisible: false, // oculta el campo en el formulario
            },
            rol: {
              isVisible: {
                edit: true,
                show: true,
                list: false,
                filter: true,
              },
            },
            password: { isVisible: false },
          },
          navigation: null,
        },
        actions: {
          new: {
            before: async (request) => {
              // Establece el id del municipio como 1 antes de guardar el nuevo comedor
              request.payload.municipio = 1;
              
              return request;
            },
          },
        },
      },
      {
        resource: dbResources.table('municipio'),
        options: {
          navigation: false,
        },
      },
      {
        resource: dbResources.table('estado'),
        options: {
          navigation: false, // Oculta el recurso en la interfaz de AdminJS
        },
      },
    ],
    locale: { 
      language: 'es', 
      availableLanguages: ['es'],
      translations: {
        es: {
          labels: {
            comedor: 'Comedores',
            administrador: 'Administradores',
            condicion: 'Condiciones',
            reporte: 'Reportes de incidentes',
            pages: 'Páginas',
            filters: 'Filtros',
          },
          resources: {
            comedor: {
              properties: {
                direccion: 'Dirección',
                contrasena: 'Contraseña',
                costoracion: 'Costo de la ración (en pesos)',
                limitedonaciones: 'Número máximo de donaciones por voluntario',
                horarioapertura: 'Hora de apertura (formato HH:MM:SS en sistema de 24 horas)',
                horariocierre: 'Hora de cierre (formato HH:MM:SS en sistema de 24 horas)', // Nombre personalizado que se mostrará en el formulario
              },
              actions: {
                list: 'Listado de comedores',
                new: 'Añadir nuevo comedor',
                show: 'Información del comedor'
              },
            },
            administrador: {
              properties: {
                telefono: 'Teléfono',
                contrasena: 'Contraseña'
              },
              actions: {
                list: 'Listado de administradores',
                new: 'Añadir nuevo(a) administrador(a)',
                show: 'Información del administrador(a)'
              }
            },
            condicion: {
              properties: {
                descripcion: 'Descripción'
              },
              actions: {
                list: 'Listado de condiciones',
                new: 'Añadir nueva condición',
                show: 'Información de la condición'
              }
            },
            reporte: {
              properties: {
                descripcion: 'Descripción',
                fechahora: 'Fecha y hora'
              },
              actions: {
                list: 'Listado de incidencias',
                new: 'Añadir nueva incidencia',
                show: 'Información de la incidencia'
              }
            },
          },
          actions: {
            delete: 'Eliminar',
            show: 'Información'
          },
          buttons: {
            save: 'Guardar',
            resetFilter: 'Borrar filtros',
            login: 'Iniciar sesión',
          },
          components: {
            DropZone: {
              acceptedType: 'Tipos de archivos compatibles: {{mimeTypes}}.',
              unsupportedSize: 'El archivo {{fileName}} es demasiado grande.',
              unsupportedType: 'El archivo {{fileName}} tiene un tipo no compatible: {{fileType}}.'
            },
            Login: {
              loginButton: 'Iniciar sesión'
            }
          },
          messages: {
            successfullyBulkDeleted: 'Se eliminó con éxito {{count}} registro.',
            successfullyBulkDeleted_plural: 'Se eliminaron con éxito {{count}} registros.',
            successfullyDeleted: 'Registro eliminado con éxito.',
            successfullyUpdated: 'Registro actualizado con éxito.',
            thereWereValidationErrors: 'Hay errores de validación. Compruébelos a continuación.',
            forbiddenError: 'No puede realizar la acción {{actionName}} en {{resourceId}}.',
            anyForbiddenError: 'No puede realizar la acción.',
            successfullyCreated: 'Se creó con éxito un nuevo registro.',
            bulkDeleteError: 'Se produjo un error al eliminar los registros. Consulte la consola para ver más información.',
            errorFetchingRecords: 'Se produjo un error al obtener los registros. Consulte la consola para ver más información.',
            errorFetchingRecord: 'Se produjo un error al obtener el registro. Consulta la consola para ver más información.',
            noRecordsSelected: 'No ha seleccionado ningún registro.',
            theseRecordsWillBeRemoved: 'Se eliminará el siguiente registro:',
            theseRecordsWillBeRemoved_plural: 'Se eliminarán los siguientes registros:',
            pickSomeFirstToRemove: 'Para eliminar registros, primero debe seleccionarlos.',
            error404Resource: 'El recurso con ID: {{resourceId}} no pudo ser encontrado',
            error404Action: 'El recurso con ID: {{resourceId}} no tiene una acción con nombre: {{actionName}} o usted no está autorizado a usarlo.',
            error404Record: 'El recurso con ID: {{resourceId}} no tiene registro con id: {{recordId}} o usted no está autorizado a usarlo.',
            seeConsoleForMore: 'Consulte la consola de desarrollo para obtener más detalles...',
            noActionComponent: 'Tienes que implementar el componente de acción para tu Acción.',
            noRecordsInResource: 'No hay registros en este recurso.',
            noRecords: 'No hay registros.',
            confirmDelete: '¿Está seguro(a) de que desea eliminar este elemento?',
            invalidCredentials: 'Email y/o contraseña incorrectos.',
            keyInUse: 'Las claves de objeto deben ser únicas.',
            keyValuePropertyDefaultDescription: 'Todos los valores se almacenan como texto.',
            pageNotFound_title: 'Página no encontrada.',
            pageNotFound_subtitle: 'La página <strong>\"{{pageName}}\"</strong> no existe.',
            componentNotFound_title: 'Ningún componente especificado.',
            componentNotFound_subtitle: 'Tienes que especificar el componente que representará este elemento.'
          }
        },
      },
    },
  });

  const ConnectSession = Connect(session);
  const sessionStore = new ConnectSession({
    conObject: {
      connectionString: 'postgres://comedores_comunitarios:comedores_comunitarios@localhost:5432/comedores_comunitarios',
      ssl: process.env.NODE_ENV === 'production',
    },
    tableName: 'session',
    createTableIfMissing: true,
  });

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: 'adminjs',
      cookiePassword: 'sessionsecret',
    },
    null,
    {
      store: sessionStore,
      resave: true,
      saveUninitialized: true,
      secret: 'sessionsecret',
      cookie: {
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
      },
      name: 'adminjs',
    }
  );
  app.use(admin.options.rootPath, adminRouter);
  
  httpsServer.listen(PORT, () => {
    console.log(`AdminJS started on https://${DOMAIN}:${PORT}${admin.options.rootPath}`);
  });
  
};

start();

app.get('/hola/:nombre', (req, res) => {
  let n = req.params.nombre;
  res.type('text/plain');
  res.status(200);
  res.send(`hola, ${n}.`);
});



///////////////////////////////
///////////// APP /////////////
///////////////////////////////

app.post('/userPassword1', async (req, res) => {
  try {
    const usuario = req.body.usuario;
    const contrasena = req.body.contrasena;
    
    const user = await dbQueries.oneOrNone('SELECT idcomedor FROM Comedor Where usuario = $1 and contrasena = $2;', [usuario, contrasena]);
    // Enviar la respuesta al cliente
    res.json(user);
    res.status(200);
    res.send();
  } catch (error) {
    // Manejar errores
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

app.post('/userPassword', async (req, res) => {
  try {
    const usuario = req.body.usuario;
    const contrasena = req.body.contrasena;
    
    const user = await dbQueries.oneOrNone('SELECT idcomedor FROM Comedor Where usuario = $1 and contrasena = $2;', [usuario, contrasena]);

    if (user) {
      // Usuario encontrado, enviar una respuesta exitosa con el usuario
      res.json(user);
      res.status(200);
      res.send();
    } else {
      // Usuario no encontrado, enviar un código de respuesta HTTP 404
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    // Manejar otros errores
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});


app.post('/agregarUsuario', async (req, res) => {
  try {
    console.log("ADIOS");
    const nombre = req.body.nombre;
    const apellido = req.body.apellido;
    const curp = req.body.curp;
    const sexo = req.body.sexo;
    const f = req.body.fecha;
    //const codigo = req.body.codigo;
    
    console.log(nombre + ", " + apellido + ", " +curp + ", "  +sexo+ ", " + f);
    
    const fecha = f[0] + f[1] + "-" + f[2] + f[3] + "-" + f[4] + f[5] + f[6] + f[7];
    console.log('Fecha' + fecha);
    
    
    
    const user = await dbQueries.one("INSERT into usuario(curp, nombre, apellidos, fechaNacimiento, sexo) VALUES ($1, $2, $3, TO_DATE($4, 'DD-MM-YYYY') , $5) RETURNING codigo;", 
    [curp, nombre, apellido, fecha, sexo]);
    
    console.log("HOLA");
       
    const idusuario = user.codigo;
    console.log("idusuario " + idusuario);
      
    res.status(200).json({ idusuario });
    res.send();
  } catch (error) {
    // Manejar errores
    res.status(500).json({ error: 'Error al insertar usuario' });
  }
});

app.post('/agregarComidaCodigo', async (req, res) => {
  try {
    const codigo = req.body.codigo;
    const comedor = req.body.comedor;

    // Comprueba si el código es "None"
    if (codigo === "None") {
      // Si el código es "None", devuelve un error
      return res.status(400).json({ error: 'El código no puede ser "None"' });
    }

    // Si el código no es "None", continúa con la consulta
    const user1 = await dbQueries.one('SELECT curp FROM usuario WHERE codigo = $1;', [codigo]);

    if (!user1) {
      // Si no se encontró un usuario con el código proporcionado, devuelve un error
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const curp = user1.curp;
    const cp = 'CURP';
    const user = await dbQueries.one("INSERT INTO visita(usuario, comedor, fechaHora, racionPagada, donadoPor, paraLlevar) VALUES($1, $2, NOW() AT TIME ZONE 'America/Mexico_City', True, NULL, False) RETURNING idVisita;", [curp, comedor]);
    const idVisita = user.idvisita;
    
    console.log(idVisita);
    
    res.status(200).json({ idVisita });
  } catch (error) {
    // Manejar otros errores
    res.status(500).json({ error: 'Error al insertar comida' });
  }
});

app.post('/agregarComidaCURP', async (req, res) => {
  try {
    const curp = req.body.curp;
    const comedor = req.body.comedor;

    const cp = 'CURP';
    const user = await dbQueries.one("INSERT INTO visita(usuario, comedor, fechaHora, racionPagada, donadoPor, paraLlevar) VALUES($1, $2, NOW() AT TIME ZONE 'America/Mexico_City', True, NULL, False) RETURNING idVisita;", [curp, comedor]);
    const idVisita = user.idvisita;
    
    res.status(200).json({ idVisita });
  } catch (error) {
    // Manejar otros errores
    res.status(500).json({ error: 'Error al insertar comida' });
  }
});

app.post('/listaVoluntarios', async (req, res) => {
  try {
    const comedor = req.body.idcomedor;
    const user = await dbQueries.any("SELECT DISTINCT nombre FROM asistencia, voluntario WHERE asistencia.voluntario = voluntario.curp and asistencia.comedor = $1 and DATE(asistencia.fechahora) = DATE(NOW() AT TIME ZONE 'America/Mexico_City');", [comedor]);
    //const idVisita = user.idvisita;
    
    console.log(user);  
    
    const transformedData = {"user": user.map(item => item.nombre)};
    //console.log("ADIOS");
    //console.log(transformedData)
    
    res.status(200).json(transformedData);
    
  } catch (error) {
    // Manejar otros errores
    res.status(500).json({ error: 'Error al insertar comida' });
  }
});

app.put('/modificarVisita', async (req, res) => {
  try {
    const nombre = req.body.nombre;
    const racionpagada = req.body.racionpagada; //SI O NO ES DONADA
    const idvisita = req.body.idvisita;
    const parallevar = req.body.parallevar; //SI O NO ES PARA LLEVAR
    
    console.log(racionpagada);
    console.log(nombre);
    
    if(!racionpagada){
      const user = await dbQueries.none("UPDATE visita SET racionpagada = $1, donadopor = (SELECT curp FROM voluntario WHERE nombre = $2) WHERE idvisita = $3;", [racionpagada, nombre, idvisita]);
      console.log("Donacion");
    }
    
    if(parallevar){
      const user2 = await dbQueries.none("UPDATE visita SET parallevar = $1", [parallevar]);
      console.log("Para llevar");
    }
    
    res.status(200).json({message : 'Listo'});
    res.send();
    
  } catch (error) {
    // Manejar otros errores
    res.status(500).json({ error: 'Error al insertar comida' });
  }
});

app.get('/listaCondiciones', async (req, res) => {
  try {
    const user = await dbQueries.any("Select DISTINCT descripcion FROM condicion;");
    //const idVisita = user.idvisita;
    
    console.log(user);  
    
    const transformedData = {"user": user.map(item => item.descripcion)};
    //console.log("ADIOS");
    console.log(transformedData);
    
    res.status(200).json(transformedData);
    
  } catch (error) {
    // Manejar otros errores
    res.status(500).json({ error: 'Error al insertar comida' });
  }
});

app.post('/insertarVulnerabilidades', async (req, res) => {
  try {
    const codigo = req.body.codigo;
    const condicion = req.body.condicion;
  
    const user = await dbQueries.one("INSERT INTO usuariocondicion(usuario, condicion) VALUES((Select curp FROM usuario WHERE codigo = $1), (Select idcondicion FROM condicion WHERE condicion.descripcion = $2)) RETURNING idusuariocondicion; ", [codigo, condicion]);
    const idCondicion = user.idusuariocondicion;
    
    res.status(200).json({ idCondicion });
  } catch (error) {
    // Manejar otros errores
    res.status(500).json({ error: 'Error al insertar comida' });
  }
});

app.post('/verificarCURP', async (req, res) => {
  try {
    const curp = req.body.curp;
    console.log(curp);
  
    const user = await dbQueries.oneOrNone("Select codigo FROM usuario WHERE curp = $1", [curp]);
    const codigo = user.codigo;
    
    console.log(codigo);
    res.status(200).json({codigo});
    res.send();
    
  } catch (error) {
    // Manejar otros errores
    res.status(500).json({ error: 'No te has registrado' });
  }
});

app.post('/verificarCodigo', async (req, res) => {
  try {
    const cod = req.body.codigo;
    console.log(cod);
  
    const user = await dbQueries.oneOrNone("Select codigo FROM usuario WHERE codigo = $1", [cod]);
    const codigo = user.codigo;
    
    console.log(codigo);
    res.status(200).json({codigo});
    res.send();
    
  } catch (error) {
    // Manejar otros errores
    res.status(500).json({ error: 'No te has registrado' });
  }
});

app.post('/agregarCalificacion', async (req, res) => {
  try {
    const codigo = req.body.codigo;
    const califcomida = req.body.califcomida;
    const califservicio = req.body.califservicio;
    const califhigiene = req.body.califhigiene;
    const comentario =req.body.comentario;
  
    const user = await dbQueries.oneOrNone("INSERT INTO calificacion(usuario, comedor, fechahora, califcomida, califservicio, califhigiene, comentario) VALUES((Select curp FROM usuario WHERE codigo = $1), (Select comedor from visita WHERE idvisita = (SELECT MAX(idvisita) FROM visita WHERE usuario = (SELECT curp FROM usuario WHERE codigo = $2))), NOW() AT TIME ZONE 'America/Mexico_City', $3, $4, $5, $6) RETURNING idcalificacion;", [codigo, codigo, califcomida, califservicio, califhigiene, comentario]);
    const idcalificacion = user.idcalificacion;
    
    console.log(idcalificacion);
    res.status(200).json({idcalificacion});
    res.send();
    
  } catch (error) {
    // Manejar otros errores
    res.status(500).json({ error: 'No te has registrado' });
  }
});

app.post('/insertarReporte', async (req, res) => {
  try {
    const comedor = req.body.comedor;
    const descripcion = req.body.descripcion;
  
    const user = await dbQueries.oneOrNone("INSERT INTO reporte(comedor, fechaHora, descripcion) VALUES($1, NOW() AT TIME ZONE 'America/Mexico_City', $2) RETURNING idreporte;", [comedor, descripcion]);
    const idReporte = user.idreporte;
    
    console.log(idReporte);
    res.status(200).json({idReporte});
    res.send();
    
  } catch (error) {
    // Manejar otros errores
    res.status(500).json({ error: 'No te has registrado' });
  }
});


app.post('/agregarVoluntario', async (req, res) => {
  try {
    const nombre = req.body.nombre;
    const apellido = req.body.apellido;
    const curp = req.body.curp;
    const telefono = req.body.telefono;
    
    console.log(telefono);
    
    const user = await dbQueries.one('INSERT into voluntario(curp, nombre, apellidos, telefono) VALUES ($1, $2, $3, $4) RETURNING curp;', 
    [curp, nombre, apellido, telefono]);
       
    const idvoluntario = user.curp;
    console.log("VOLUNTARIO REGISTRADO");
    res.status(200).json({ idvoluntario });
    res.send();
  } catch (error) {
    // Manejar errores
    res.status(500).json({ error: 'Error al insertar usuario' });
  }
});

app.post('/agregarAsistencia', async (req, res) => {
  try {
    const comedor = req.body.comedor;
    const curp = req.body.curp;
    const user = await dbQueries.one("INSERT INTO asistencia(comedor, voluntario, fechaHora) VALUES($1, $2, NOW() AT TIME ZONE 'America/Mexico_City') RETURNING idasistencia;", 
    [comedor, curp]);
    const idasistencia = user.idasistencia;
    res.status(200).json({ idasistencia });
    res.send();
  } catch (error) {
    // Manejar errores
    res.status(500).json({ error: 'Error al insertar usuario' });
  }
});

/*
app.put('/modificarVisita', async (req, res) => {
  try {
    const nombre = req.body.nombre;
    const racionpagada = req.body.racionpagada; //SI O NO ES DONADA
    const idvisita = req.body.idvisita;
    const parallevar = req.body.parallevar; //SI O NO ES PARA LLEVAR
    
    console.log()
    
    if(!racionpagada){
      const user1 = await dbQueries.one("SELECT curp FROM voluntario WHERE nombre = $1", [nombre])
      const donadopor = user1.curp
      const user = await dbQueries.none("UPDATE visita SET racionpagada = $1, donadopor = $2 WHERE idvisita = $3;", [racionpagada, donadopor, idvisita]);
      console.log("Donacion");
    }
    
    if(parallevar){
      const user2 = await dbQueries.none("UPDATE visita SET parallevar = $1", [parallevar]);
      console.log("Para llevar");
    }
    
    res.status(200).json({message : 'Listo'});
    res.send()
    
  } catch (error) {
    // Manejar otros errores
    res.status(500).json({ error: 'Error al insertar comida' });
  }
});*/



app.post('/datosHoy', async (req, res) => {
  
  try{
    
    const comedorId = req.body.idComedor;
    
    console.log(comedorId);
    
    const comidasPagadasHoy = await dbQueries.one("SELECT COUNT(*) FROM Visita WHERE comedor = $1 AND DATE(fechaHora) = DATE(CURRENT_DATE AT TIME ZONE 'America/Mexico_City') AND racionPagada = true", [comedorId]);

    const comidasDonadas = await dbQueries.one("SELECT COUNT(*) FROM Visita WHERE comedor = $1 AND DATE(fechaHora) = DATE(CURRENT_DATE AT TIME ZONE 'America/Mexico_City') AND racionPagada = false", [comedorId]);

    const comidasTotalesHoy = await dbQueries.one("SELECT COUNT(*) FROM Visita WHERE comedor = $1 AND DATE(fechaHora) = DATE(CURRENT_DATE AT TIME ZONE 'America/Mexico_City')", [comedorId]);

    const response = {
      comidasPagadasHoy: comidasPagadasHoy.count,
      comidasDonadas: comidasDonadas.count,
      comidasTotalesHoy: comidasTotalesHoy.count
    };

    res.status(200).json(response);
    
  }
  catch (error){
    res.status(500).json({ error: 'Error al procesar la solicitud para datos de hoy'});
  }
  
});

app.post('/cantidadVoluntariosHoy', async (req, res) => {
  try {
    const comedorId = req.body.idComedor;

    const countVoluntariosHoy = await dbQueries.one("SELECT COUNT(*) FROM Asistencia WHERE comedor = $1 AND DATE(fechaHora) = DATE(CURRENT_DATE AT TIME ZONE 'America/Mexico_City')", [comedorId]);

    const response = {
      cantidadVoluntariosHoy: countVoluntariosHoy.count,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud para la cantidad de voluntarios hoy' });
  }
});

// app.post('/agregarUsuario', async (req, res) => {
//   try {
    
//     const nombre = req.body.nombre;
//     const apellido = req.body.apellido;
//     const curp = req.body.curp;
//     const sexo = req.body.sexo;
//     const f = req.body.fecha;
//     //const codigo = req.body.codigo;
    
//     const fecha = f[0] + f[1] + "-" + f[2] + f[3] + "-" + f[4] + f[5] + f[6] + f[7]
    
//     const user = await dbQueries.one('INSERT into usuario(curp, nombre, apellidos, fechaNacimiento, sexo) VALUES ($1, $2, $3, $4, $5) RETURNING codigo;', 
//     [curp, nombre, apellido, fecha, sexo]);
       
//     const idusuario = user.codigo
      
//     res.status(200).json({ idusuario });
//     res.send();
//   } catch (error) {
//     // Manejar errores
//     res.status(500).json({ error: 'Error al insertar usuario' });
//   }
// });



// app.get('/max-value', async (req, res) => {
//   try {
     
//     const query = 'SELECT MAX(codigo) AS max_value FROM usuario;';
//     const result = await dbQueries.one(query);
//     const maxValue = result.max_value;
//     res.status(200).json({ maxValue });
     
//   }catch (error) {
//       console.error('Error al obtener el valor máximo:', error);
//       res.status(500).json({ error: 'Error al obtener el valor máximo' });
    
//   }
// });







