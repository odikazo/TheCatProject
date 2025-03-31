// API requests
const headers = new Headers({
  "Content-Type": "application/json",
  "x-api-key": process.env.CatApi
});

var requestOptions = {
  method: 'GET',
  headers: headers,
  redirect: 'follow'
};

async function ApiRequest() {
  try {
    const response = await fetch("https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg&format=json&has_breeds=true&order=RANDOM&page=0&limit=1", requestOptions);
    const result = await response.json(); // Parse JSON response
    return result; // Return the actual data
  } catch (error) {
    console.error('Error fetching API:', error);
    return []; // Return empty array on failure
  }
}

// Webserver
const express = require('express');
const app = express();

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Use JSON
app.use(express.json());

// Index page - Fetch data inside the route
app.get('/', async function(req, res) {
  try {
    const result = await ApiRequest(); // Fetch API data
    const cat = result[0]; // Extract first cat object
    // console.log(cat);
    res.render('index.ejs', { cat }); // Pass cat object to EJS
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});

// About page
app.get('/about', function(req, res) {
  res.render('test.ejs');
});

// Like / Dislike API
app.post('/api', async(req, res) => {
    const receivedMessage = req.body;
    console.log(receivedMessage);

    // Send back a response
    res.json({ received: receivedMessage, status: 'success' });
});

app.listen(80, () => {
  console.log('Server is listening on port 80');
});
