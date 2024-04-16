// Import the notification messages
const { notificationMessages } = require('./notifications.js');

// Import roles
const { roles } = require ('./roles.js');

// Call of mysql library
const mysql = require('mysql');

// Dotenv library used for environment variables
const dotenv = require('dotenv');
dotenv.config();

const jwt = require('jsonwebtoken');

// const redis = require('redis');

// // Créer une instance du client Redis
// const redisClient = redis.createClient({
//     // Spécifiez les informations de connexion à Redis si nécessaire
//     // host: 'localhost',
//      port: 6380,
// });

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
function getJsonResponse(connection, res, number, result, messagekey, notificationObject, redirect, results) {

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
        // if it's a wrond token then return an error
        if (error) {

    // Old redis fonction code
            // // then chek  if it's an expired token 
            // if (error.name === 'TokenExpiredError') {

            //     // add the expired token to Redis database
            //     redisClient.set(token, 'expired', 'EX', 3600, (error) => {

            //         // is there an error during the add of this tocken ?
            //         if (error) {
            //             console.error('Erreur lors de l\'ajout du token expiré à Redis :', error);
            //         } else {
            //             console.log('Token expiré ajouté à Redis :', token);
            //         }
            //     });
            // }

            getJsonResponse(null, res, 403, false, 'token_failure', notificationMessages, false, results = null);
            return;
        }


        // Add the results to the request object
        req.results = results;

        // go to the next middleware 
        next();
    });
}



/**
 * 
 * Fonction pour vérifier si cet utilisateur a le rôle d'administrateur
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function isAdmin(req, res, next) {
    // console.log("on est en isadmin")
    //  Get the token from the header juste after authorization keyword
    const header = req.headers['authorization'];

    // Split Bearer from the token value and keep just the token
    const token = header && header.split(' ')[1];

    
    // Test if the token is missing or null of undefined
    if (!token || token === null || token === undefined) {
        getJsonResponse(null, res, 401, false, 'token_missing', notificationMessages, false, results = null);
        return;
    }

    // Verify and decode the JWT token
    jwt.verify(token, process.env.JWT_SECRET_KEY, (error, decoded) => {
        if (error) {
            getJsonResponse(null, res, 403, false, 'token_failure', notificationMessages, false, results = null);
            return;
        }

        // Extract the user ID from the decoded token
        const userId = decoded.id;

        //  get a database connection from the pool
        dbconnect.getConnection((error, connection) => {

            // test if max connection is reached
            if (dbconnect._allConnections.length >= dbconnect.config.connectionLimit) {
                getJsonResponse(connection, res, 503, false, 'max_connection_reached', notificationMessages, false, results = null);
                return;
            }
            // Test if there is a database connection error
            if (error) {
                getJsonResponse(connection, res, 500, false, 'dbconnect_error', notificationMessages, false, results = null);
                return;
            } else {

                // if not the prepare and execute the query to get the user_role
                const sql = 'SELECT user_role FROM user_ WHERE id = ?';
                connection.query(sql, [userId], (error, results) => {
                    
                    if (error) {
                        getJsonResponse(connection, res, 500, false, 'request_error', notificationMessages, false, results = null);
                        return;
                    } else {

                        // check role admin for this user
                        if (results.length > 0 && results[0].user_role === roles.administrator) {
                            // if it's ok then next
                            next();
                        } else {
                            // if not then unauthorize
                            getJsonResponse(connection, res, 403, false, 'not_admin', notificationMessages, false, results = null);
                        }
                    }
                })
            }
        })
    })
};



function decodeToken(token, secretKey) {
    try {
        // Vérifier et décoder le token en utilisant la clé secrète
        const decoded = jwt.verify(token, secretKey);
        // Retourner les informations de l'utilisateur décryptées depuis le token
        return decoded;
    } catch (error) {
        // En cas d'erreur lors du décodage du token (ex: token invalide ou expiré), retourner null ou gérer l'erreur selon les besoins
        console.error('Erreur lors du décodage du token :', error.message);
        return null;
    }
}






module.exports = {
    getJsonResponse,
    authToken,
    isAdmin
}