-- WARNING: YOU MUST RUN EACH LINE USING PSQL

-- This SQL file shall be used to initiate a sample database for easysocial
-- Features
-- + Create a `easysocial` database
-- + Install the pgcrypto extension

-- Create the databse
CREATE DATABASE easysocial;

-- Connect to the easysocial database
\c easysocial

-- Install the extension
CREATE EXTENSION pgcrypto;