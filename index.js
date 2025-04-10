const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const cors = require('cors');

app.set('view engine', 'ejs'); // Set the view engine to ejs
app.use(express.static('public')); // Set the views directory
app.use(express.json()); // Use JSON
app.use(cookieParser()); // Use Cookie Parser
app.use(cors());


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


// Like API
app.post('/api/like', async(req, res) => {
  const sendOptions = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      "image_id": req.body.cat,
      "value": 1,
      "sub_id": req.cookies.userId
    })};
  const vote = await fetch('https://api.thecatapi.com/v1/votes', sendOptions)
  //console.log(vote);
  const requestOptions = {
    method: 'GET',
    headers: headers,
    redirect: 'follow'
  }
  const getvotes = await fetch(`https://api.thecatapi.com/v1/votes`, requestOptions)
  const data = await getvotes.json();
  console.log(data);
 
  const filteredByImageId = data.filter(item => item.image_id === req.body.cat);
  const totalWithImageId = filteredByImageId.length;

  const withUsernameSubId = filteredByImageId.filter(item => item.sub_id === req.cookies.userId);
  const totalWithUsername = withUsernameSubId.length;

  console.log("Total with image_id JFPROfGtQ:", totalWithImageId);
  console.log("Of those, total with sub_id username:", totalWithUsername);









  /*
  const receivedMessage = req.body;
  console.log('Received message:', receivedMessage);
  */
  res.json({ status: 'success' });
});
// Dislike API
app.post('/api/dislike', async(req, res) => {
  const receivedMessage = req.body;  console.log('disliked')
  //console.log('Received message:', receivedMessage);
  res.json({ received: receivedMessage.cat, status: 'success' });
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

// get all avalible breeds
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

// search fo a cat
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


// Webserver listener
app.listen(80, () => {
  console.log('Server is listening on port 80');
});

