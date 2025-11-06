const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - ये लाइन जरूरी है
app.use(express.json());
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/generate', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    
    const { prompt, model = 'models/text-bison-001' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    console.log('API Key present:', !!apiKey);
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta2/${model}:generateText?key=${apiKey}`;
    console.log('Calling URL:', url);

    const requestBody = {
      prompt: {
        text: prompt
      },
      temperature: 0.7,
      maxOutputTokens: 256,
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('Google API response received');
    res.json(response.data);

  } catch (error) {
    console.error('Full Error:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Google API Error',
        details: error.response.data
      });
    } else if (error.request) {
      res.status(500).json({
        error: 'Network Error',
        details: 'Could not reach Google API'
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        details: error.message
      });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});
