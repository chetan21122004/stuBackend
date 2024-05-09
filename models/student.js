// models/Student.js

const db = require('./db');

class Student {
  static async getAllStudents() {
    try {
      const query = 'SELECT * FROM students';
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error getting all students: ${error.message}`);
    }
  }

  static async createStudent(firstName, lastName, dateOfBirth, gender, email, phoneNumber, address, student_dp) {
    try {
      const query = `
        INSERT INTO students (first_name, last_name, date_of_birth, gender, email, phone_number, address, student_dp) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`;
      const values = [firstName, lastName, dateOfBirth, gender, email, phoneNumber, address, student_dp];
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      throw new Error(`Error creating student: ${error.message}`);
    }
  }

  // Add other methods as needed
}

module.exports = Student;
