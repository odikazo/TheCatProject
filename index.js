const express = require('express');
const app = express();
let cachedBreeds = [];

app.set('view engine', 'ejs');
app.use(express.static('public'), express.json(), require('cookie-parser')());
app.use(express.json());

const headers = { "Content-Type": "application/json", "x-api-key": process.env.CatApi };

const cacheBreeds = async () => {
  try {
    const res = await fetch('https://api.thecatapi.com/v1/breeds', { headers });
    cachedBreeds = await res.json();
  } catch (err) { console.error('Error caching breeds:', err); }
};

const getRandomCat = async () => {
  try {
    const res = await fetch("https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg&format=json&has_breeds=true&order=RANDOM&limit=1", { headers });
    return await res.json();
  } catch (err) { 
    console.error('API Error:', err);
    return [];
  }
};

app.get('/', (req, res) => res.render('index.ejs'));

app.get('/api/breeds', (req, res) => res.json(cachedBreeds.map(b => ({ name: b.name, id: b.id }))));

app.post('/api/search', async (req, res) => {
  const query = req.body.query?.trim();
  // If no query is provided, return a random cat image with any breed info if available
  console.log(req);
  if (!query) {
    try {
      const [cat] = await getRandomCat();
      const breed = cat.breeds && cat.breeds.length > 0 ? cat.breeds[0] : null;
      return res.json({ breed, image: cat });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch random image' });
    }
  }
  // Search for the breed
  const breed = cachedBreeds.find(b => b.name.toLowerCase() === query.toLowerCase());
  if (!breed) return res.status(404).json({ error: 'Breed not found' });
  try {
    const [image] = await (await fetch(`https://api.thecatapi.com/v1/images/search?breed_ids=${breed.id}&limit=1`, { headers })).json();
    res.json({ breed, image });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

cacheBreeds();
app.listen(80, () => console.log('Server running on port 80'));