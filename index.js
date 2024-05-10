const express = require('express')
const app = express()
// app.js
require('dotenv').config();
const router = express.Router();

const cors = require("cors");
// const fs = require('fs');
// const path = require('path'); // Import the 'path' module here
// const multer = require('multer');
const bodyParser = require('body-parser'); // Import bodyParser for parsing request bodies
const pool = require('./db'); // Import the db.js file
// const uploadsDir = './uploads';
const bcrypt = require('bcryptjs');
app.use("/images",express.static('uploads'));
app.use(express.json());
app.use(cors())
const port = process.env.PORT || 2000;
app.get('/', (req, res) => {
  res.send('Hello World!')
})
// POST route to create a new user


// Multer configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadsDir); // Save uploaded files to the 'uploads' folder
//   },
//   filename: function (req, file, cb) {
//     // Generate a unique filename by appending a timestamp
//     const uniqueFilename = Date.now() + '-' + file.originalname;
//     cb(null, uniqueFilename);
//   },
// });

// const upload = multer({ storage: storage });


app.post('/student/create', async (req, res) => {
  try {
    // Check if a file was uploaded
    // if (!req.file) {
    //   return res.status(400).json({ error: 'No file uploaded' });
    // }

    const { first_name, last_name, date_of_birth, gender, email, phone_number, address, password } = req.body;
    // const filepath1 = req.file.path; // Get the file path where the image is stored
    // const parts = filepath1.split('\\');
    // const filepath = `${req.protocol}://${req.get('host')}/images/${parts[1]}`; 
    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10); // Synchronous hashing

    // Using parameterized query to avoid SQL injection
    const query = `
      INSERT INTO students (first_name, last_name, date_of_birth, gender, email, phone_number, address, password) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;`; // Use RETURNING * to get the newly inserted user data

    const result = await pool.query(query, [first_name, last_name, date_of_birth, gender, email, phone_number, address,  hashedPassword]);
    const user = result.rows[0];
    delete user.password;

    // Send the newly inserted user data as response
    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});







// Assuming you're using Express.js

// GET route to fetch attendance records by student ID
app.get('/attendance/get/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params.studentId;
    const query = `SELECT * FROM attendance_records WHERE student_id = ${req.par}`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Internal server error' });

  }
});


app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    ``
    // Query the database to check if the student exists
    const query = `
      SELECT * 
      FROM students 
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);

    if (result.rows.length === 1) {
      // Student with provided email exists, proceed with login
      const user = result.rows[0];
      // Compare the provided password with the hashed password from the database
      const passwordMatch = bcrypt.compareSync(password, user.password); // Synchronous comparison
      if (passwordMatch) {
        // Passwords match, send user data without the password
        delete user.password;
        res.status(200).json(user);
      } else {
        // Passwords don't match, send error response
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      // Student does not exist, send error response
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// GET route to fetch all users
app.get('/students/get', async (req, res) => {
  try {
    // Corrected query to fetch all users from the users table
    const query = 'SELECT * FROM students ORDER BY student_id DESC';
    const result = await pool.query(query);

    // Send the results as JSON
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error',error: 'Internal server error' });
  }
});



app.use('/', router);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})