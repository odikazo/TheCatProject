const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static('public'));
// Use JSON
app.use(express.json());
// Use Cookie Parser
app.use(cookieParser());


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
  console.log(vote);
  const requestOptions = {
    method: 'GET',
    headers: headers,
    redirect: 'follow'
  }
  const getvotes = await fetch(`https://api.thecatapi.com/v1/votes`, requestOptions)
  console.log(await getvotes.json());









  /*
  const receivedMessage = req.body;
  console.log('Received message:', receivedMessage);
  */
  res.json({ status: 'success' });
});
// Dislike API
app.post('/api/dislike', async(req, res) => {
  const receivedMessage = req.body;
  console.log('Received message:', receivedMessage);
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


// Webserver listener
app.listen(80, () => {
  console.log('Server is listening on port 80');
});