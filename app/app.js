// Dependencies
require('dotenv').config(); // Load API key from .env
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookieParser());

// Global Variable for Searched Cities
const searchedCities = []; // Store detailed weather info for searched cities

// Routes

// Home route
app.get('/', (req, res) => {
  const theme = req?.cookies?.theme || 'light';  // Default theme to 'light' if not set
  res.render('index', {
    weather: null,
    error: null,
    cities: searchedCities,
    background: '', 
    theme: theme,  // Pass the current theme to the view
  });
});

// Weather route
app.get('/weather', async (req, res) => {
  const { city, lat, lon } = req.query;

  if (!city && !lat && !lon) {
    return res.render('index', {
      weather: null,
      error: 'Please provide a city or allow location access.',
      cities: searchedCities,
      background: '',
      theme: req.cookies.theme || 'light',  // Use cookies to keep track of theme
    });
  }

  const query = city ? `q=${city}` : `lat=${lat}&lon=${lon}`;
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?${query}&units=metric&appid=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    const weather = {
      city: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      humidity: data.main.humidity,
      visibility: data.visibility / 1000,
      condition: data.weather[0].main, // e.g., Clear, Clouds, Rain
    };

    // Add to searched cities list if not already added
    const exists = searchedCities.some(entry => entry.city === weather.city);
    if (!exists) {
      searchedCities.push(weather);
    }

    let backgroundClass = '';
    switch (weather.condition.toLowerCase()) {
      case 'clear':
        backgroundClass = 'sunny';
        break;
      case 'clouds':
        backgroundClass = 'cloudy';
        break;
      case 'rain':
        backgroundClass = 'rainy';
        break;
      case 'snow':
        backgroundClass = 'snowy';
        break;
      default:
        backgroundClass = 'default';
    }

    const theme = req.cookies.theme || 'light'; // Fetch the current theme from cookies
    res.render('index', {
      weather,
      error: null,
      cities: searchedCities,
      background: backgroundClass,
      theme: theme,
    });
  } catch (error) {
    res.render('index', {
      weather: null,
      error: 'Could not fetch weather data. Check the city name or try again later.',
      cities: searchedCities,
      background: '',
      theme: req.cookies.theme || 'light',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
