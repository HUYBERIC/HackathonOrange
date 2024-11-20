const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS to allow requests from the frontend
app.use(cors());

// Define the endpoint to fetch the token
app.get('/api/token', async (req, res) => {
  try {
    const response = await axios.post(
        'https://api.orange.com/oauth/v3/token',
        new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
        {
            headers: {
                'Authorization': 'Basic QUNvMkFYQW9UUXpNckVlWDViR2I4TUc4b2s4Z0dna0g6V2padXZPSVhxTDRXUWRnYQ==',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        }
    );
    
    console.log(response);

    // Send the token response to the frontend
    res.json(response.data);
    
    // Make the POST request to the Orange API
  } catch (error) {
    console.error('Error fetching token:', error.message);
    res.status(500).json({ error: 'Failed to retrieve token' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
