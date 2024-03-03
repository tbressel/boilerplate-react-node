///////////////////////////////////////////////////////
/////////////////     IMPORTATIONS     ////////////////
///////////////////////////////////////////////////////

// Import the setting of the listen port from config file
const { CLIENT_BASE_URL } = require('../config.js');

// Import the notification messages
const { notificationMessages } = require('../notifications.js');

// Import the function to get a JSON response
const { getJsonResponse, authToken } = require('../functions.js');



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

// Validator library used for data validation
const validator = require('validator');


// Bcrypt library used for password encryption
const bcrypt = require('bcrypt');

// Used to generate a token
const jwt = require('jsonwebtoken');


////////////////////////////////////////////////////////////
/////////////////     DATABASE SETTING     /////////////////
////////////////////////////////////////////////////////////

// Create a pool of connections to the database
const dbconnect = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATA,
    port: process.env.DB_PORT
});

////////////////////////////////////////////////////////////
//////////////     MIDDLEWARES  SETTING     ////////////////
////////////////////////////////////////////////////////////

// Middleware to analyse body requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Middleware to allow CORS
app.use(cors(corsOptions));



/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
////////////////////////    READ ALL USERS    ///////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

app.get('/list', authToken, (req, res) => {

    const action = req.query.action;

    // Check if the action is valid
    if  (!action || action !== 'list') {
        getJsonResponse(null, res, 400, false, 'invalid_action', notificationMessages, false, results=null);
        return;
    }

    //  Get a database connection from the pool
    dbconnect.getConnection((error, connection) => {

        // Testing if max connection is reached
        if (dbconnect._allConnections.length >= dbconnect.config.connectionLimit) {
            getJsonResponse(connection, res, 503, false, 'max_connection_reached', notificationMessages, false, results=null);
            return;
        } 

        // Testing if there is a database connection error
        if (error) {
            getJsonResponse(connection, res, 500, false, 'dbconnect_error', notificationMessages, false, results=null);
            return;
        } else {
            //  If not then prepare and execute the SQL query
            const sql = 'SELECT user_firstname, user_lastname, user_pseudo, user_email FROM user';
            connection.query(sql, (error, results) => {

                if (error) {
                    getJsonResponse(connection, res, 500, false, 'request_error', notificationMessages, false, results=null);
                    return;
                } else {
                    getJsonResponse(connection, res, 200, true, 'request_success', notificationMessages, false, results);
                }
            });
        }
    });
});
    
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
//////////////////////////    ADD USERS    //////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
app.post('/adduser', authToken, (req, res) => {

    // read the data from the POST request
    let { lastname, firstname, nickname, email, password, role } = req.body;
    let action = req.query.action;

    // Check if the action is valid
    if (!action || action !== 'add') {
        getJsonResponse(null, res, 400, false, 'invalid_action', notificationMessages, false, results = null);
        return;
    }
    // CHeck if the data is missing
    if (!firstname || !lastname || !nickname || !email || !password || !role) {
        getJsonResponse(null, res, 400, false, 'data_missing', notificationMessages, false, results = null);
        return;
    }

    // Cleaning the data to prevent XSS attacks
    firstname = validator.escape(firstname);
    lastname = validator.escape(lastname);
    nickname = validator.escape(nickname);
    email = validator.escape(email);
    password = validator.escape(password);
    role = validator.escape(role);

    let role_name = '';
    let statement = 0;

    switch (role) {
        case '1': role_name = 'administrateur';
            break;
        case '2': role_name = 'membre';
            break;
        default: role_name = 'membre';

    }
    

    // check if the email is valid with the validator method
    if (!validator.isEmail(email)) {
        getJsonResponse(null, res, 401, true, 'email_bad_format', notificationMessages, false, results = null);
        return;
    }


    // repeat salt process during 10 rounds
    const saltRounds = 10;

    // password = null;
    // hash the password with salt
    bcrypt.hash(password, saltRounds, function (error, hash) {
        if (error) {
            // If there is a problem with the password verification (undefined ? null? problem with bcrypt library ?)
            getJsonResponse(null, res, 401, false, 'password_verification_failed', notificationMessages, false, results = null);
            return;
        } else {
            password = hash;

            // assuring the the avatar is lowercased
            const avatar = (firstname + lastname + nickname).toLowerCase();

            //  Get a database connection from the pool
            dbconnect.getConnection((error, connection) => {

                // Testing if max connection is reached
                // if (dbconnect.config.connectionLimit) {
                if (dbconnect._allConnections.length >= dbconnect.config.connectionLimit) {
                    getJsonResponse(connection, res, 503, false, 'max_connection_reached', notificationMessages, false, results = null);
                    return;
                }

                // Testing if there is a database connection error
                // if (!error) {
                if (error) {
                    getJsonResponse(connection, res, 500, false, 'dbconnect_error', notificationMessages, false, results = null);
                    return;
                }


                // If not then prepare and execute the SQL query to check if this user already exists
                const checkSql = 'SELECT * FROM user WHERE user_pseudo = ? OR user_email = ?';

                // execute the query
                dbconnect.query(checkSql, [nickname, email], (error, results) => {

                    // if there is a database request error
                    if (error) {
                        getJsonResponse(connection, res, 500, false, 'request_error', notificationMessages, false, results = null);
                        return;
                        
                    } else if (results.length > 0) {
                        // if the user already exists
                        getJsonResponse(connection, res, 401, false, 'exist_data', notificationMessages, false, results = null);
                        return;
                    }
                    
                    
                    //  If not then prepare and execute the SQL query
                    const sql = `INSERT INTO user (user_firstname, user_lastname,  user_pseudo, user_role, user_email, user_password, user_avatar, user_role_name, statement) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    
                    // execute the query
                    dbconnect.query(sql, [firstname, lastname, nickname, role, email, password, avatar, role_name, statement], (error) => {

                        // If there is a database request error
                        if (error) {
                            getJsonResponse(connection, res, 500, false, 'request_error', notificationMessages, false, results = null);
                            return;
                        } else {                        
                            // if NOT then send the response to the client
                            getJsonResponse(connection, res, 200, true, 'adduser_success', notificationMessages, false, results = null);                            
                        }
                    });
                });
            });
        }
    });
});




    module.exports = app;