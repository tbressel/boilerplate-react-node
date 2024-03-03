// Express (to use routes and)
const express = require('express');
const app = express();


app.get('/', (req, res) => {
    res.send('Route 4');
});



module.exports = app;