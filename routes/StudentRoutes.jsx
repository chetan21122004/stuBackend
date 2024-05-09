// routes/studentRoutes.js

const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/StudentController');

// Route to get all students
router.get('/', StudentController.getAllStudents);

// Route to create a new student
router.post('/', StudentController.createStudent);

// Add more routes as needed for updating, deleting, or retrieving individual students

module.exports = router;
