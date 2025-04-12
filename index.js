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

app.get('/api/likes/:imageId', async (req, res) => {
  try {
    const votes = await fetch(`https://api.thecatapi.com/v1/votes?image_id=${req.params.imageId}`, { headers });
    const voteList = await votes.json();
    res.json({
      totalVotes: voteList.length,
      userVotes: req.cookies.userId ? voteList.filter(v => v.sub_id === req.cookies.userId).length : 0
    });
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