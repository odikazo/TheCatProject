const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
let cachedBreeds = [];

app.set('view engine', 'ejs'); // Set the view engine to ejs
app.use(express.static('public')); // Set the views directory
app.use(express.json()); // Use JSON
app.use(cookieParser()); // Use Cookie Parser

async function cacheBreeds() {
  const headers = new Headers({
    "Content-Type": "application/json",
    "x-api-key": process.env.CatApi
  });
  try {
    const response = await fetch('https://api.thecatapi.com/v1/breeds', {
      method: 'GET',
      headers: headers
    });
    cachedBreeds = await response.json();
    console.log(`Cached ${cachedBreeds.length} breeds.`);
  } catch (err) {
    console.error('Error caching breeds:', err);
  }
}












// API requests
const headers = new Headers({
  "Content-Type": "application/json",
  "x-api-key": process.env.CatApi
});

async function ApiRequest() {
  const requestOptions = {
    method: 'GET',
    headers: headers,
    redirect: 'follow'
  };
  
  try {
    const response = await fetch("https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg&format=json&has_breeds=true&order=RANDOM&page=0&limit=1", requestOptions);
    const result = await response.json(); // Parse JSON response
    return result; // Return the actual data
  } catch (error) {
    console.error('Error fetching API:', error);
    return []; // Return empty array on failure
  }
}

// Index page - Fetch data inside the route
app.get('/', async function(req, res) {
  let userId = req.cookies.userId;
  try {
    const result = await ApiRequest(); // Fetch API data
    const cat = result[0]; // Extract first cat object
    // console.log(cat); // DEBUG
    res.render('index.ejs', { cat, userId }); // Pass cat object to EJS
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});

// Login page
app.get('/login', function(req, res) {
  let userId = req.cookies.userId;
  if (!userId) {
    userId = 'username';
  };
  res.render('login.ejs', { userId });
});
// search
app.get('/search', function(req, res) {
  res.render('search.ejs');
});


app.post('/api/like', async (req, res) => {
  const imageId = req.body.cat;
  const subId = req.cookies.userId;

  if (!imageId || !subId) {
    return res.status(400).json({ error: 'Missing image ID or user ID' });
  }

  try {
    const sendOptions = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        image_id: imageId,
        value: 1,
        sub_id: subId
      })
    };

    const voteResponse = await fetch('https://api.thecatapi.com/v1/votes', sendOptions);
    const voteData = await voteResponse.json();

    if (!voteResponse.ok) throw new Error(voteData.message || 'Failed to vote');

    res.json({ status: 'success', message: 'Like submitted', voteData });
  } catch (err) {
    console.error('Error submitting like:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong while liking' });
  }
});
    
app.get('/api/likes/:imageId', async (req, res) => {
  const imageId = req.params.imageId;
  const subId = req.cookies.userId;

  if (!imageId) {
    return res.status(400).json({ error: 'Image ID is required' });
  }

  try {
    const requestOptions = {
      method: 'GET',
      headers: headers,
      redirect: 'follow'
    };

    const voteRes = await fetch(`https://api.thecatapi.com/v1/votes?image_id=${imageId}`, requestOptions);
    const voteList = await voteRes.json();

    if (!Array.isArray(voteList)) throw new Error('Invalid response from vote API');

    const totalVotes = voteList.length;
    const userVotes = subId ? voteList.filter(v => v.sub_id === subId).length : 0;

    res.json({
      status: 'success',
      imageId,
      totalVotes,
      userVotes,
    });
  } catch (err) {
    console.error('Error fetching like data:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch like stats' });
  }
});

// Dislike API
// Dislike API
app.post('/api/dislike', async(req, res) => {
  const sendOptions = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      "image_id": req.body.cat,
      "value": 0,  // Dislike is a value of 0
      "sub_id": req.cookies.userId
    })
  };

  try {
    const vote = await fetch('https://api.thecatapi.com/v1/votes', sendOptions);
    const voteData = await vote.json();

    console.log('Dislike sent:', voteData);  // Debugging the response

    // Now fetch updated vote statistics
    const getvotes = await fetch('https://api.thecatapi.com/v1/votes', {
      method: 'GET',
      headers: headers,
      redirect: 'follow'
    });

    const data = await getvotes.json();
    const filteredByImageId = data.filter(item => item.image_id === req.body.cat);
    const totalWithImageId = filteredByImageId.length;

    const withUsernameSubId = filteredByImageId.filter(item => item.sub_id === req.cookies.userId);
    const totalWithUsername = withUsernameSubId.length;

    console.log("Total votes for image_id:", totalWithImageId);
    console.log("User's votes for image_id:", totalWithUsername);

    res.json({
      status: 'success',
      message: 'Dislike submitted',
      voteData: {
        imageId: req.body.cat,
        totalVotes: totalWithImageId,
        userVotes: totalWithUsername
      }
    });
  } catch (error) {
    console.error('Error sending dislike:', error);
    res.status(500).json({ status: 'error', message: 'Error sending dislike' });
  }
});


// Login API
app.post('/api/login', async(req, res) => {
  const receivedMessage = req.body;
  res.cookie('userId', receivedMessage.message, { 
    path: '/',
    httpOnly: true
  });
  res.json({ received: receivedMessage.message, message: 'Login Cookie set', status: 'success' });
});

// Logout API
app.post('/api/logout', async(req, res) => {
  res.clearCookie('userId', { path: '/'});
  res.json({ status: 'success' });
});

// get login information
app.post('/api/get/login', async(req, res) => {
  const userId = req.cookies.userId;
  res.json({ user: userId });
});

// Search API - Autocomplete for breeds
app.get('/api/breeds', (req, res) => {
  const names = cachedBreeds.map(b => ({ name: b.name, id: b.id }));
  res.json(names);
});

// Search API - returns 1 image by breed name
app.post('/api/search', async (req, res) => {
  const query = req.body.query.toLowerCase();
  const breed = cachedBreeds.find(b => b.name.toLowerCase() === query);
  if (!breed) return res.status(404).json({ error: 'Breed not found' });
  const requestOptions = {
    method: 'GET',
    headers: headers,
    redirect: 'follow'
  };
  try {
    const response = await fetch(`https://api.thecatapi.com/v1/images/search?breed_ids=${breed.id}&limit=1`, requestOptions);
    const data = await response.json();
    const image = data[0];
    res.json({ breed, image });
  } catch (error) {
    console.error('Search API Error:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});






// Run on server start
cacheBreeds(); 
// Webserver listener
app.listen(80, () => {
  console.log('Server is listening on port 80');
});