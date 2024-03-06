/**
 * The main server file for the React_Node application.
 * @module index
 */


// Config the listent port from config file
const { API_LISTEN_PORT } = require('./config.js');


// Express JS
const express = require('express');
const app = express();


// Config the listent port from config file
const port = process.env.PORT || API_LISTEN_PORT;
app.listen(port, () => {
    console.log('Serveur est écouté sur le port', port);
});


// Configuring the routes
const Route1 = require('./register/register.js'); 
app.use('/register', Route1); 

const Route2 = require('./user/user.js'); 
app.use('/user', Route2); 

const Route3 = require('./route3/route3.js'); 
app.use('/route3', Route3); 

const Route_Test = require('./test/test.js'); 
app.use('/test', Route_Test); 

