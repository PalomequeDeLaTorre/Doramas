const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const vistosFilePath = path.join(__dirname, 'data', 'vistos.json');
const pendientesFilePath = path.join(__dirname, 'data', 'pendientes.json');

let doramasVistos = readDataFromFile(vistosFilePath);
let doramasPendientes = readDataFromFile(pendientesFilePath);
let nextId = calculateNextId();

function readDataFromFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function saveDataToFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function calculateNextId() {
  const allDoramas = doramasVistos.concat(doramasPendientes);
  if (allDoramas.length === 0) {
    return 1;
  }
  return Math.max(...allDoramas.map((dorama) => dorama.id)) + 1;
}

app.get('/', (req, res) => {
  res.render('index', { doramasVistos, doramasPendientes });
});

app.get('/vistos', (req, res) => {
  res.render('vistos', { doramasVistos });
});

app.get('/pendientes', (req, res) => {
  res.render('pendientes', { doramasPendientes });
});

app.post('/agregar', (req, res) => {
  const { name, status } = req.body;
  const dorama = { id: nextId++, name, status };

  if (status === 'visto') {
    doramasVistos.push(dorama);
    saveDataToFile(vistosFilePath, doramasVistos);
  } else if (status === 'pendiente') {
    doramasPendientes.push(dorama);
    saveDataToFile(pendientesFilePath, doramasPendientes);
  }

  res.redirect('/');
});

app.post('/editar', (req, res) => {
  const { id } = req.body;
  const dorama = doramasVistos.find((item) => item.id === parseInt(id)) || doramasPendientes.find((item) => item.id === parseInt(id));
  if (dorama) {
    res.render('edit', { dorama });
  } else {
    res.redirect('/');
  }
});

app.post('/guardar', (req, res) => {
  const { id, name, status } = req.body;
  const doramaList = status === 'visto' ? doramasVistos : doramasPendientes;
  const dorama = doramaList.find((item) => item.id === parseInt(id));
  if (dorama) {
    dorama.name = name;
    dorama.status = status;
    if (status === 'visto') {
      saveDataToFile(vistosFilePath, doramasVistos);
    } else if (status === 'pendiente') {
      saveDataToFile(pendientesFilePath, doramasPendientes);
    }
  }
  res.redirect('/');
});

app.post('/borrar', (req, res) => {
  const { id } = req.body;
  doramasVistos = doramasVistos.filter((item) => item.id !== parseInt(id));
  doramasPendientes = doramasPendientes.filter((item) => item.id !== parseInt(id));
  saveDataToFile(vistosFilePath, doramasVistos);
  saveDataToFile(pendientesFilePath, doramasPendientes);
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

