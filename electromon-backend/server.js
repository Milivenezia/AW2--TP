const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = 3000;


const API_URL = 'https://69f51469fb098eb7f0b511ea.mockapi.io/Productos';

app.get('/', (req, res) => {
    res.send('Bienvenidos');
});


app.get('/productos', async (req, res) => {
    try {
        const response = await axios.get(API_URL);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});