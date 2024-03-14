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
    optionsSuccessStatus: 200,
    credentials : true
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

// Import nodemailer module
const nodemailer = require('nodemailer');

// Configurer le transporteur SMTP
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE,
    auth: {
        user: process.env.MAIL_AUTH_USER,
        pass: process.env.MAIL_AUTH_PWD,
    }
});

/**
 * 
 * Function for activation email sending
 * 
 * @param {*} email 
 * @param {*} activationLink 
 * @returns 
 */
const sendActivationEmail = (email, activationLink) => {

    // Return a promise to manage the success or failure of the email sending
    return new Promise((resolve, reject) => {

        // Content of the email Options
        const mailOptions = {
            from: 'contact@thomas-bressel.com',
            to: email,
            subject: 'Activation de compte',
            html: `Cliquez sur le lien suivant pour activer votre compte : <a href="${activationLink}">${activationLink}</a>`
        };

        // Send the email with transporter
        transporter.sendMail(mailOptions, (error, info) => {

            // If mail sending error the promise will return a reject
            if (error) {
                reject(error);
            }
            // If mail sending success the promise will return a resolve
            else {
                resolve(info);
            }
        });
    });
};

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
////////////////////////        LOGIN         ///////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

app.post('/login/', (req, res) => {
    let { username, password } = req.body;
    let action = req.query.action;

    // Check if the action is valid
    if (!action || action !== 'login') {
        getJsonResponse(null, res, 400, false, 'invalid_action', notificationMessages, false, results = null);
        return;
    }

    // Check if username and password exist
    if (!username || !password) {
        getJsonResponse(null, res, 400, false, 'login_missing', notificationMessages, false, results = null);
        return;
    }

    username = validator.blacklist(username, '\\<\\>\\{\\}\\[\\]\\`\\#');
    username = validator.escape(username);
    password = validator.escape(password);


    //  Get a database connection from the pool
    dbconnect.getConnection((error, connection) => {

        // Testing if max connection is reached
        //    if (dbconnect.config.connectionLimit) {
        if (dbconnect._allConnections.length >= dbconnect.config.connectionLimit) {
            getJsonResponse(connection, res, 503, false, 'max_connection_reached', notificationMessages, false, results = null);
            return;
        }

        // Testing if there is a database connection error
        if (error) {
            getJsonResponse(connection, res, 500, false, 'dbconnect_error', notificationMessages, false, results = null);
            return;
        } else {

            //  If not then prepare and execute the SQL query
            const sql = 'SELECT * FROM user WHERE user_pseudo = ?';
            connection.query(sql, [username], (error, results) => {

                // If there is a database request error
                if (error) {
                    getJsonResponse(connection, res, 500, false, 'request_error', notificationMessages, false, results = null);
                    return;
                } else {

                    // If the username IS NOT in the database
                    if (results.length === 0) {
                        getJsonResponse(connection, res, 401, false, 'login_failure', notificationMessages, false, results = null);
                        return;
                    } else {

                        // If the username IS in the database
                        // Check password from form  with password from database 
                        const storedPassword = results[0].user_password;
                        bcrypt.compare(password, storedPassword, (error, isMatch) => {

                            if (error) {

                                // If there is a problem with the password verification (undefined ? null? problem with bcrypt library ?)
                                getJsonResponse(connection, res, 401, false, 'password_verification_failed', notificationMessages, false, results = null);
                                return;
                            } else {
                                if (!isMatch) {
                                    // If the password is NOT correct
                                    getJsonResponse(connection, res, 401, false, 'password_failure', notificationMessages, false, results = null);
                                    return;

                                } else {
                                    // If the password is correct  checking id the account is active or not
                                    if (results[0].statement === 0) {
                                        getJsonResponse(connection, res, 401, false, 'account_not_active', notificationMessages, false, results = null);
                                        return;
                                    }

                                    // Then get the Secret key for the token
                                    const secretKey = process.env.JWT_SECRET_KEY;

                                    // Generate a token with user information and the secret key
                                    const sessionToken = jwt.sign(
                                        {
                                            id: results[0].id,
                                            firstname: results[0].user_firstname,
                                            lastname: results[0].user_lastname,
                                            pseudo: results[0].user_pseudo,
                                            email: results[0].user_email,
                                            // status: results[0].user_role,
                                            status_name: results[0].user_role_name,
                                            avatar: results[0].user_avatar,
                                        },
                                        secretKey,
                                        { expiresIn: '1h' });

                                    // Add the token to the user information
                                    let userSession = [{}];
                                    userSession[0].firstname = results[0].user_firstname;
                                    userSession[0].lastname = results[0].user_lastname;
                                    userSession[0].pseudo = results[0].user_pseudo;
                                    userSession[0].email = results[0].user_email;
                                    // userSession[0].status = results[0].user_role;
                                    userSession[0].avatar = results[0].user_avatar;
                                    userSession[0].sessionToken = sessionToken;

                                    // Send the response to the client with the token inside results
                                    getJsonResponse(connection, res, 200, true, 'login_success', notificationMessages, false, userSession);
                                }
                            }
                        });
                    }
                }
            });
        }
    });
});


/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
////////////////////////        LOGOUT        ///////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

app.post('/logout', authToken, (req, res) => {
    getJsonResponse(null, res, 200, true, 'logout_success', notificationMessages, false, results = null);
});


/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
//////////////////////////     SIGNIN      //////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
app.post('/signin', (req, res) => {

    // read the data from the POST request
    let { lastname, firstname, nickname, email, password, role } = req.body;
    let action = req.query.action;

    // Check if the action is valid
    if (!action || action !== 'signin') {
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


                    // Then get the Secret key for the token
                    const secretKey = process.env.JWT_SECRET_KEY;

                    // Generate a token with user information and the secret key
                    const sessionToken = jwt.sign({
                        firstname: firstname,
                        lastname: lastname,
                        nickname: nickname,
                        email: email,
                    },
                        secretKey,
                        { expiresIn: '1h' });

                    const activationEmail = email;
                    const activationLink = 'http://localhost:4000/register/activation?action=activate&token=' + sessionToken;


                    sendActivationEmail(activationEmail, activationLink)
                        .then(() => {

                            //  If not then prepare and execute the SQL query
                            const sql = `INSERT INTO user (user_firstname, user_lastname,  user_pseudo, user_role, user_email, user_password, user_avatar, user_role_name, statement) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)`;

                            // execute the query
                            dbconnect.query(sql, [firstname, lastname, nickname, role, email, password, avatar, role_name, statement], (error) => {

                                // If there is a database request error
                                if (error) {
                                    getJsonResponse(connection, res, 500, false, 'request_error', notificationMessages, false, results = null);
                                    return;
                                }
                            });
                        })

                        .then(() => {
                            getJsonResponse(connection, res, 200, true, 'signin_success', notificationMessages, false, results = null);
                        })

                        .catch((error) => {
                            getJsonResponse(connection, res, 500, false, 'email_failure', notificationMessages, false, results = null);
                            return;
                        });
                });
            });
        }
    });
});


/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
////////////////////////     ACTIVATE      //////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
app.patch('/activation', (req, res) => {

    const { action, token } = req.query;

    // Check if the action is valid
    if (!action || action !== 'activate') {
        getJsonResponse(null, res, 400, false, 'invalid_action', notificationMessages, false, results = null);
        return;
    }

    // Test if the token is missing or null of undefined
    if (!token || token === null || token === undefined) {
        getJsonResponse(null, res, 401, false, 'token_missing', notificationMessages, false, results = null);
        return;
    }

    // Verify the token with the secret key
    jwt.verify(token, process.env.JWT_SECRET_KEY, (error, results) => {
        if (error) {
            getJsonResponse(null, res, 403, false, 'token_failure', notificationMessages, false, results = null);
            return;
        }

        // Add the results to the request object with the jwt decoded 
        req.results = results;
    });

    // create variables to store the nickname and the email
    nickname = req.results.nickname;
    email = req.results.email;


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
        const sql = 'UPDATE user SET statement = 1 WHERE user_pseudo = ? AND user_email = ?';


        // execute the query
        dbconnect.query(sql, [nickname, email], (error, results) => {

            // if there is a database request error
            if (error) {
                getJsonResponse(connection, res, 500, false, 'request_error', notificationMessages, false, results = null);
                return;
            }
            // If the account is well activated
            getJsonResponse(connection, res, 200, true, 'account_activated', notificationMessages, false, results = null);
        });
    });
});


/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
//////////////////////////     SIGNOUT      //////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
app.delete('/signout', authToken, (req, res) => {

    // read the data from the POST request
    let { nickname, email } = req.body;
    let action = req.query.action;

    // Check if the action is valid
    if (!action || action !== 'signout') {
        getJsonResponse(null, res, 400, false, 'invalid_action', notificationMessages, false, results = null);
        return;
    }
    // CHeck if the data is missing
    if (!nickname || !email) {
        getJsonResponse(null, res, 400, false, 'data_missing', notificationMessages, false, results = null);
        return;
    }

    // Cleaning the data to prevent XSS attacks
    nickname = validator.escape(nickname);
    email = validator.escape(email);

    // check if the email is valid with the validator method
    if (!validator.isEmail(email)) {
        getJsonResponse(null, res, 401, true, 'email_bad_format', notificationMessages, false, results = null);
        return;
    }

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
        const sql = 'DELETE FROM user WHERE user_pseudo = ? AND user_email = ?';
        
        // execute the query
        dbconnect.query(sql, [nickname, email], (error, results) => {
            
            // if there is a database request error
            if (error) {
                getJsonResponse(connection, res, 500, false, 'request_error', notificationMessages, false, results = null);
                return;
                
            } else if (results.length > 0) {
                // if the user dosn't exists
                getJsonResponse(connection, res, 401, false, 'signout_failure', notificationMessages, false, results = null);
                return;
            }
            getJsonResponse(connection, res, 200, true, 'signout_success', notificationMessages, false, results = null);
        });
    });
});



module.exports = app;