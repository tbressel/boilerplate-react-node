///////////////////////////////////////////////////////
/////////////////     IMPORTATIONS     ////////////////
///////////////////////////////////////////////////////

// Import the setting of the listen port from config file
const { CLIENT_BASE_URL } = require('../config.js');

// Express (to use routes and)
const express = require('express');
const app = express();

const cors = require('cors');
const corsOptions = {
    origin: CLIENT_BASE_URL,
    optionsSuccessStatus: 200,
    credentials : true
}

app.use(cors(corsOptions));


app.get('/test', (req, res) => {
    res.send('Test OK');
});


module.exports = app;