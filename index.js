const express = require('express')
const app = express()
// app.js
require('dotenv').config();


const cors = require("cors");

const bodyParser = require('body-parser') ; // Import bodyParser for parsing request bodies
const pool = require('./db'); // Import the db.js file
const bcrypt = require('bcryptjs');
app.use(express.json());
app.use(cors())
const port = 2000 ;
app.get('/', (req, res) => {
  res.send('Hello World!')
})


let clients = [];

// Middleware to setup SSE connection
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

// Function to send data to SSE clients
const sendSSEToClients = (data) => {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => client.write(message));
};

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/student/create', async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, email, phone_number, address, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const query = `
      INSERT INTO students (first_name, last_name, date_of_birth, gender, email, phone_number, address, password) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;`;
    const result = await pool.query(query, [first_name, last_name, date_of_birth, gender, email, phone_number, address, hashedPassword]);
    const user = result.rows[0];
    delete user.password;
    const addColQuery = `ALTER TABLE attendance_record ADD COLUMN "${user.student_id}" varchar(20);`;
    await pool.query(addColQuery);
    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/genrateqr', async (req, res) => {
  try {
    const { lec_id, tem_lec_id } = req.body;
    const query = `UPDATE attendance_record SET tem_lec_id = $1 WHERE lec_id = $2 RETURNING tem_lec_id`;
    const response = await pool.query(query, [tem_lec_id, lec_id]);
    const updatedTemLecId = response.rows[0].tem_lec_id;
    res.status(200).json(updatedTemLecId);
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
    const query = `SELECT * FROM students WHERE email = $1`;
    const result = await pool.query(query, [email]);
    if (result.rows.length === 1) {
      const user = result.rows[0];
      const passwordMatch = bcrypt.compareSync(password, user.password);
      if (passwordMatch) {
        delete user.password;
        res.status(200).json(user);
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Route to handle scanning QR code and updating data
app.post('/scanqr', async (req, res) => {
  try {
    const { user} = req.body;

    console.log(user);
    const query = `UPDATE attendance_record SET "${user.student_id}" = 'process' WHERE tem_lec_id = $1`;
    const response = await pool.query(query, [user.tem_lec_id]);
    if (response.rowCount > 0) {
    
      sendSSEToClients(user);


      res.status(200).json({ message: 'Data updated successfully',user});
    } else {
      res.status(404).json({ error: 'Record not found' });
    }
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
