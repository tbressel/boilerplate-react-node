-- delete database to re create it
DROP DATABASE boilerplate;

-- create database
CREATE DATABASE IF NOT EXISTS boilerplate;

CREATE TABLE user_(
   id_user_ INT AUTO_INCREMENT,
   user_name VARCHAR(50),
   user_firstname VARCHAR(50),
   user_nickname VARCHAR(50),
   user_email VARCHAR(50),
   user_password VARCHAR(128),
   user_role TINYINT,
   user_role_name VARCHAR(50),
   user_avatar VARCHAR(50),
   user_isActivated BOOLEAN,
   PRIMARY KEY(id_user_),
   UNIQUE(user_email),
   UNIQUE(user_password)
);

