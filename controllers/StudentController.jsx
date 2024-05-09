// controllers/StudentController.js

const Student = require('../models/student');

class StudentController {
  static async getAllStudents(req, res) {
    try {
      const students = await Student.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createStudent(req, res) {
    try {
      const { first_name, last_name, date_of_birth, gender, email, phone_number, address, student_dp } = req.body;
      
      // Call the createStudent method from the Student model
      const newStudent = await Student.createStudent(first_name, last_name, date_of_birth, gender, email, phone_number, address, student_dp);
      
      res.status(201).json(newStudent);
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Add other methods as needed
}

module.exports = StudentController;
