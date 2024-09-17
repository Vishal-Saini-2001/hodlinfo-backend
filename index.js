// app.js
const express = require('express');
const mongoose = require('mongoose');
const Ticker = require('./models/Ticker')
const cors = require('cors')
const dotenv = require('dotenv')
const axios = require('axios')

dotenv.config({ path: "./config.env" })

const app = express();
const PORT = 3000;
const URI = process.env.URI

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));



const fetchAndStoreTickers = async () => {
    try {
        const response = await axios.get('https://api.wazirx.com/api/v2/tickers');
        const data = response.data;
        // Extracting top 10 tickers
        const top10Tickers = Object.values(data).slice(0, 10);

        // Save or update tickers in the database
        for (const ticker of top10Tickers) {
            const { name, last, buy, sell, volume, base_unit } = ticker;

            await Ticker.findOneAndUpdate(
                { name },
                { name, last, buy, sell, volume, base_unit },
                { upsert: true }
            );
        }

        console.log('Top 10 tickers fetched and stored successfully.');
    } catch (error) {
        console.error('Error fetching tickers from WazirX API:', error);
    }
};
fetchAndStoreTickers()

// Route to get stored tickers from the database
app.get('/list', async (req, res) => {
    try {
        const tickers = await Ticker.find({});
        res.status(200).json(tickers);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving tickers from the database' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
