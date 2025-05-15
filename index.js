// define important variables
const express = require('express');
const app = express();
let cachedBreeds = [];
// Initialize the app and set the view engine to express JavaScript
app.set('view engine', 'ejs');
app.use(express.static('public'), express.json(), require('cookie-parser')());
app.use(express.json()); // Middleware to parse JSON bodies
// API Header
const headers = { "Content-Type": "application/json", "x-api-key": process.env.CatApi };
// Load all breeds into cache
const cacheBreeds = async () => {
  try {
    // Fetch all breeds
    const res = await fetch('https://api.thecatapi.com/v1/breeds', { headers });
    cachedBreeds = await res.json();
  } catch (err) { console.error('Error caching breeds:', err); }
};

// Function to fetch a random cat
const getRandomCat = async () => {
  try {
    // Fetch a random cat
    const res = await fetch("https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg&format=json&has_breeds=true&order=RANDOM&limit=1", { headers });
    return await res.json();
  } catch (err) { 
    console.error('API Error:', err);
    return [];
  }
};

// Index page
app.get('/', (req, res) => res.render('index.ejs'));

// API to load all breeds
app.get('/api/breeds', (req, res) => res.json(cachedBreeds.map(b => ({ name: b.name, id: b.id }))));
// API to search or a random cat
app.post('/api/search', async (req, res) => {
  // Format the query
  const query = req.body.query?.trim();
  // Get a random cat if no query
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

// Start the Web server
cacheBreeds();
app.listen(80, () => console.log('Server running on port 80'));