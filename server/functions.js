// Import the notification messages
const { notificationMessages } = require('./notifications.js');

const jwt = require('jsonwebtoken');

/**
 *
 * Function to configure the type of message sent by the server
 *
 * @param {*} connection : the connection to the database is optionnal, turn this option to 'null' if you don't want to use it
 * @param {*} res 
 * @param {*} number 
 * @param {*} result 
 * @param {*} messagekey 
 * @param {*} notificationObject 
 * @param {*} redirect 
 * @param {*} results : the results from the database is optionnal, turn this option to 'null' if you don't want to use it
 * @returns 
 */
function getJsonResponse (connection, res, number, result, messagekey, notificationObject, redirect, results) {

    // Test if the database pool connection already been released
     if (connection) connection.release();

    return res.status(number).json({
        result: result,
        type: messagekey,
        message: notificationObject[messagekey],
        redirect: redirect,
        body: (results) ? results : null
    });
}

/**
 * 
 * function to verify the token for certain routes
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function authToken(req, res, next) {

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
    jwt.verify(token, process.env.JWT_SECRET_KEY, (error, results) => {
        if (error){
            getJsonResponse(null, res, 403, false, 'token_failure', notificationMessages, false, results = null);
            return;
        }

        // Add the results to the request object
        req.results = results;

        // go to the next middleware 
        next();
    });
}

module.exports = {
    getJsonResponse,
    authToken
}