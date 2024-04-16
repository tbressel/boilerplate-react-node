///////////////////////////////////////////////////////
/////////////////     IMPORTATIONS     ////////////////
///////////////////////////////////////////////////////

// Import the setting of the listen port from config file
const { CLIENT_BASE_URL } = require('../config.js');

// Import the notification messages
const { notificationMessages } = require('../notifications.js');

// Import the function to get a JSON response
const { getJsonResponse } = require('../functions.js');


///////////////////////////////////////////////////////
////////////     MODULES IMPORTATIONS     /////////////
///////////////////////////////////////////////////////

// Express
const express = require('express');
const app = express();

// to parse a body from a request 
const bodyParser = require('body-parser');

// Call of mysql library
const mysql = require('mysql');

// CORS middleware
const cors = require('cors');
const corsOptions = {
    origin: CLIENT_BASE_URL,
    optionsSuccessStatus: 200
};

// Dotenv library used for environment variables
const dotenv = require('dotenv');
dotenv.config();



////////////////////////////////////////////////////////////
//////////////     MIDDLEWARES  SETTING     ////////////////
////////////////////////////////////////////////////////////

// Middleware to analyse body requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Middleware to allow CORS
app.use(cors(corsOptions));


const jwt = require('jsonwebtoken');





/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
//////////  TEST  : TOKEN, REFRESH TOKEN AND NEW TOKEN   ////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
app.get('/decodetoken', (req, res) => {

    //  Get the token from the header juste after authorization keyword
    const header = req.headers['authorization'];

    // Split Bearer from the token value and keep just the token
    const token = header && header.split(' ')[1];

    // Test if the token is missing or null of undefined
    if (!token || token === null || token === undefined) {
        getJsonResponse(null, res, 401, false, 'token_missing', notificationMessages, false, results = null);
        return;
    }

    // Verify the token with the secret key
    jwt.verify(token, process.env.JWT_SECRET_KEY, (error, token_result) => {
        // if it's a wrond token then return an error
        if (error) {
            getJsonResponse(null, res, 403, false, 'test_token_failure', notificationMessages, false, results = null);
            return;
        }

        // Get two other token to test them
        const { refreshtoken, newtoken } = req.body;

        // Verify the token with the secret key
        jwt.verify(refreshtoken, process.env.JWT_REFRESH_SECRET_KEY, (error, refresh_result) => {
            // if it's a wrond token then return an error
            if (error) {
                getJsonResponse(null, res, 403, false, 'test_refresh_failure', notificationMessages, false, results = null);
                return;
            }
            // Verify the token with the secret key
            jwt.verify(newtoken, process.env.JWT_SECRET_KEY, (error, new_result) => {
                // if it's a wrond token then return an error
                if (error) {
                    getJsonResponse(null, res, 403, false, 'test_newtoken_failure', notificationMessages, false, results = null);
                    return;
                }

                res.json({
                    token: token_result,
                    refreshtoken: refresh_result,
                    newtoken: new_result
                });
            })
        })
    })
});



module.exports = app;