const express = require('express');
const app = express();
let cachedBreeds = [];

app.set('view engine', 'ejs');
app.use(express.static('public'), express.json(), require('cookie-parser')());

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

app.get('/', async (req, res) => {
  try {
    const [cat] = await getRandomCat();
    res.render('index.ejs', { cat, userId: req.cookies.userId });
  } catch (err) { res.status(500).send('Error fetching data'); }
});

app.get('/login', (req, res) => res.render('login.ejs', { userId: req.cookies.userId || 'username' }));
app.get('/search', (req, res) => res.render('search.ejs'));

app.post('/api/like', async (req, res) => {
  const { cat: imageId } = req.body;
  const subId = req.cookies.userId;
  if (!imageId || !subId) return res.status(400).json({ error: 'Missing data' });

  try {
    const vote = await fetch('https://api.thecatapi.com/v1/votes', {
      method: 'POST',
      headers,
      body: JSON.stringify({ image_id: imageId, value: 1, sub_id: subId })
    });
    const data = await vote.json();
    res.json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});




const cache = {}; // cache[breed][userId] = voteCount
const cacheTimestamp = { lastSync: null };

// GET /api/likes/:breed
app.get('/api/likes/:breed', (req, res) => {
  const breed = req.params.breed;
  const userId = req.cookies.userId;

  if (!cache[breed]) {
    return res.status(404).json({ status: 'error', message: 'Breed not found in cache. Please sync first.' });
  }

  const breedVotes = cache[breed];
  const totalVotes = Object.values(breedVotes).reduce((sum, votes) => sum + votes, 0);
  const userVotes = userId ? (breedVotes[userId] || 0) : 0;

  res.json({ totalVotes, userVotes });
});

// POST /api/likes/sync
app.post('/api/likes/sync', async (req, res) => {
  try {
    const response = await fetch('https://api.thecatapi.com/v1/votes', { headers });
    const votes = await response.json();

    const newCache = {};

    for (const vote of votes) {
      const breedId = vote.breed_id; // Check if breed_id exists
      const subId = vote.sub_id || 'anonymous';

      if (!breedId) continue; // skip votes without breed info

      if (!newCache[breedId]) {
        newCache[breedId] = {};
      }

      newCache[breedId][subId] = (newCache[breedId][subId] || 0) + 1;
    }

    // Update cache and timestamp
    Object.assign(cache, newCache);
    cacheTimestamp.lastSync = Date.now();

    console.log('Cache synced successfully:', cache);

    res.json({ status: 'success', message: 'Cache synced successfully.', lastSync: cacheTimestamp.lastSync });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});






app.post('/api/dislike', async (req, res) => {
  try {
    const vote = await fetch('https://api.thecatapi.com/v1/votes', {
      method: 'POST',
      headers,
      body: JSON.stringify({ image_id: req.body.cat, value: 0, sub_id: req.cookies.userId })
    });
    res.json({ status: 'success', data: await vote.json() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/login', (req, res) => {
  res.cookie('userId', req.body.message, { path: '/', httpOnly: true })
     .json({ status: 'success' });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('userId', { path: '/' }).json({ status: 'success' });
});

app.get('/api/breeds', (req, res) => {
  res.json(cachedBreeds.map(b => ({ name: b.name, id: b.id })));
});

app.post('/api/search', async (req, res) => {
  const breed = cachedBreeds.find(b => b.name.toLowerCase() === req.body.query.toLowerCase());
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