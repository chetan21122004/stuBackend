const express = require('express')
const app = express()
// app.js
require('dotenv').config();
const router = express.Router();

require('dotenv').config();
const axios = require('axios')
const cors = require("cors");
const bodyParser = require('body-parser') ; // Import bodyParser for parsing request bodies
const pool = require('./db'); // Import the db.js file
const bcrypt = require('bcryptjs');
app.use(express.json());

const port=2000
// const allowedOrigins = [
//   'https://teacger-frontend.vercel.app',
//   'https://stu-backend.vercel.app',
//   'https://stu-backend.vercel.app/events',
//   'https://teacger-frontend.vercel.app/events',
//   'https://teacger-frontend-eg649bk4i-chetans-projects-9b041f40.vercel.app',
//   'https://student-frontend-eu1u.vercel.app',
//   'https://student-frontend-eu1u-ae7wb5bh8-chetans-projects-9b041f40.vercel.app',
//   'http://localhost:5173',
//   'http://localhost:5174'
// ];

const allowedOrigins = [
  'https://teacger-frontend.vercel.app',
  'https://stu-backend.vercel.app',
  'https://teacger-frontend-eg649bk4i-chetans-projects-9b041f40.vercel.app',
  'https://student-frontend-eu1u.vercel.app',
  'https://student-frontend-eu1u-ae7wb5bh8-chetans-projects-9b041f40.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
// // for particular origin
// const allowedOrigins = [
//   'https://teacger-frontend.vercel.app',
//   'https://teacger-frontend.vercel.app/events',
//   'https://teacger-frontend-eg649bk4i-chetans-projects-9b041f40.vercel.app',
//   'https://student-frontend-eu1u.vercel.app',
//   'https://student-frontend-eu1u-ae7wb5bh8-chetans-projects-9b041f40.vercel.app',
//   'http://localhost:5173'
// ];

// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   if (allowedOrigins.includes(origin)) {
//     res.setHeader('Access-Control-Allow-Origin', origin);
//   }
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.setHeader('Access-Control-Allow-Credentials', 'true');

//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200); // Preflight request response
//   }

//   next();
// });



// for all origin


// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   next();
// });



app.post('/student/create', async (req, res) => {
  try {
    

    const { first_name, last_name, date_of_birth, gender, email, phone_number, address, password } = req.body;

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
 

  app.post('/students/get', async (req, res) => {
    const { lec_id } = req.body;
    try {
      // Call the function to get multiple column names where value is 'process'
      const query = 'SELECT * FROM find_columns_with_value($1, $2)';
      const values = [lec_id, 'process'];
      const idquery = await pool.query(query, values);
  console.log(idquery);
      // Extract the column names from the result
      const columnNames = idquery.rows.map(row => row.find_columns_with_value);
  
      if (columnNames.length === 0) {
        // If no columns found, return an empty response
        return res.json([]);
      }
  
      // Assuming you need to fetch student records based on the result
      // Modify this part based on your actual requirement
      const studquery = `SELECT * FROM students WHERE student_id IN (${columnNames.map((_, i) => `$${i + 1}`).join(', ')})`;
  
      // Execute the query to fetch student records
      const list = await pool.query(studquery, columnNames);
  
      // Send the response
      res.json(list.rows);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  


 


  let clients = [];

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE with the client

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

const sendSSEToClients = (data) => {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => client.write(message));
};

// Example endpoint to trigger an SSE message
app.post('/trigger-sse', (req, res) => {
  const data = req.body; // Ensure you send JSON data
  sendSSEToClients(data);
  res.status(200).send('Event sent');
});

  // Route to handle scanning QR code and updating data
  
  app.post('/scanqr', async (req, res) => {
    try {
      const { user } = req.body;
  
      console.log(user);
      const query = `UPDATE attendance_record SET "${user.student_id}" = 'process' WHERE tem_lec_id = $1`;
      const response = await pool.query(query, [user.tem_lec_id]);
  
      if (response.rowCount > 0) {
        // Send SSE event to the SSE server
        // await axios.post('https://stu-backend.vercel.app/trigger-sse', user);
        sendSSEToClients(user);

        // await axios.post('http://localhost:2000/trigger-sse', user);
  
        res.status(200).json({ message: 'Done From your side', user });
      } else {
        res.status(404).json({ error: 'Record not found' });
      }
    } catch (error) {
      console.error('Error updating record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });



app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})




// let clients = [];

  // Middleware to setup SSE connection
  // app.get('/events', (req, res) => {
  //   res.setHeader('Content-Type', 'text/event-stream');
  //   res.setHeader('Cache-Control', 'no-cache');
  //   res.setHeader('Connection', 'keep-alive');
  //   res.flushHeaders(); // flush the headers to establish SSE with the client
  
  //   clients.push(res);
  
  //   req.on('close', () => {
  //     clients = clients.filter(client => client !== res);
  //   });
  // });
  
  // // Function to send data to SSE clients
  // const sendSSEToClients = (data) => {
  //   const message = `data: ${JSON.stringify(data)}\n\n`;
  //   clients.forEach(client => client.write(message));
  // };

  // app.post('/scanqr', async (req, res) => {
  //   try {
  //     const { user} = req.body;
  
  //     console.log(user);
  //     const query = `UPDATE attendance_record SET "${user.student_id}" = 'process' WHERE tem_lec_id = $1`;
  //     const response = await pool.query(query, [user.tem_lec_id]);
  //     if (response.rowCount > 0) {
      
  //       sendSSEToClients(user);
  
  
  //       res.status(200).json({ message: 'Done From your side',user});
  //     } else {
  //       res.status(404).json({ error: 'Record not found' });
  //     }
  //   } catch (error) {
  //     console.error('Error updating record:', error);
  //     res.status(500).json({ error: 'Internal server error' });
  //   }
  // });

