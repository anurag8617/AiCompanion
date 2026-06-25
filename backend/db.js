const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the MySQL database');
    connection.release();
  } catch (err) {
    console.error('Error connecting to the MySQL database:', err.message);
    console.log('Please ensure MySQL is running and credentials in .env are correct.');
  }
};

module.exports = {
  pool,
  testConnection,
};
