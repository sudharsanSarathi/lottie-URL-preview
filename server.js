const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes with specific options
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'OPTIONS'], // Allow specific methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
}));

// Serve static files from the current directory
app.use(express.static('./'));

// Proxy endpoint to fetch Lottie files
app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; LottieViewer/1.0;)'
            }
        });
        
        // Set CORS headers explicitly
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch animation',
            details: error.message 
        });
    }
});

// Handle OPTIONS requests explicitly
app.options('*', cors());

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 