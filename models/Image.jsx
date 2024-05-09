// models/Image.js

const db = require('../db');

class Image {
  static async uploadImage(filename, filepath, userId) {
    try {
      const query = 'INSERT INTO images (filename, filepath, user_id) VALUES ($1, $2, $3) RETURNING *';
      const values = [filename, filepath, userId];
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      throw new Error(`Error uploading image: ${error.message}`);
    }
  }

  static async getImageById(imageId) {
    try {
      const query = 'SELECT * FROM images WHERE id = $1';
      const { rows } = await db.query(query, [imageId]);
      if (rows.length === 0) {
        throw new Error('Image not found');
      }
      return rows[0];
    } catch (error) {
      throw new Error(`Error retrieving image: ${error.message}`);
    }
  }

  // Add more methods as needed
}

module.exports = Image;
