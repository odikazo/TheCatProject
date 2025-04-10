const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config(); // falls du ENV nutzt

const app = express();
const PORT = 3000;

const API_KEY = 'YOUR_API_KEY'; // sicher hier aufbewahren

app.use(cors());

app.get('/api/breeds', async (req, res) => {
  try {
    const response = await fetch('https://api.thecatapi.com/v1/breeds', {
      headers: { 'x-api-key': API_KEY }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Laden der Rassen' });
  }
});

app.get('/api/cats', async (req, res) => {
  const breedId = req.query.breed;
  const url = breedId
    ? `https://api.thecatapi.com/v1/images/search?breed_ids=${breedId}&limit=10`
    : `https://api.thecatapi.com/v1/images/search?has_breeds=1&limit=20`;

  try {
    const response = await fetch(url, {
      headers: { 'x-api-key': API_KEY }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Laden der Bilder' });
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
