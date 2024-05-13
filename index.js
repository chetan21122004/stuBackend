const express = require('express')
const app = express()
// app.js
require('dotenv').config();
const router = express.Router();

const cors = require("cors");
// const fs = require('fs');
// const path = require('path'); // Import the 'path' module here
// const multer = require('multer');
const bodyParser = require('body-parser') ; // Import bodyParser for parsing request bodies
const pool = require('./db'); // Import the db.js file
// const uploadsDir = './uploads';
const bcrypt = require('bcryptjs');
// app.use("/images",express.static('uploads'));
app.use(express.json());
app.use(cors())
const port = process.env.PORT || 2000;
app.get('/', (req, res) => {
  res.send('Hello World!')
})
// POST route to create a new user

app.use((req, res, next) => {
  const allowedOrigins = ['https://teacger-frontend.vercel.app', 'https://teacger-frontend-eg649bk4i-chetans-projects-9b041f40.vercel.app'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


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
      RETURNING *;`;
    // Use RETURNING * to get the newly inserted user data

    const result = await pool.query(query, [first_name, last_name, date_of_birth, gender, email, phone_number, address,  hashedPassword]);
    const user = result.rows[0];
    delete user.password;
console.log(user.student_id);

    
const addColQuery = `ALTER TABLE attendance_record ADD COLUMN "${user.student_id}" varchar(20);`;
await pool.query(addColQuery);

    // Send the newly inserted user data as response
    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.post('/genrateqr', async (req, res) => {
  try {
    const { lec_id, tem_lec_id } = req.body;

    // Construct the SQL query to update the attendance_record table
    const sel = `select `
    const query = `UPDATE attendance_record 
               SET tem_lec_id = $1 
               WHERE lec_id = $2 
               RETURNING tem_lec_id`;

const response = await pool.query(query, [tem_lec_id, lec_id]);
const updatedTemLecId = response.rows[0].tem_lec_id;
    // Handle the response if needed
    if (response) {
      // Handle success
      res.status(200).json(updatedTemLecId);
    } else {
      // Handle failure
      res.status(500).json({ error: 'Failed to update temp id' });
    }
  } catch (err) {
    console.error('Error generating code:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.post('/scanqr', async (req, res) => {
  try {
    const { student_id, tem_lec_id } = req.body;

    // Query the attendance_record table based on tem_lec_id received from the request
    const id = await pool.query(`SELECT * FROM attendance_record WHERE tem_lec_id = $1`, [tem_lec_id]);

    if (id.rows.length ==1) {
      // Construct the update query dynamically based on the student_id
      const updateQuery = `
        UPDATE attendance_record
        SET "${student_id}" = 'present'
        WHERE tem_lec_id = $1;
      `;

      // Execute the update query
      const response = await pool.query(updateQuery, [tem_lec_id]);

      // Handle the response if needed
      if (response) {
        // Handle success
        res.status(200).json({ message: 'Record updated successfully' });
      } else {
        // Handle failure
        res.status(500).json({ error: 'Failed to update record' });
      }
    } else {
      // No record found with the given tem_lec_id
      res.status(404).json({ error: 'Record not found' });
    }
  } catch (err) {
    console.error('Error updating record:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



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