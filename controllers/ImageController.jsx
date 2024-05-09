// controllers/ImageController.js

const Image = require('../models/Image');

class ImageController {
  static async uploadImage(req, res) {
    try {
      const { filename, path } = req.file;
      const { user_id } = req.body;
      
      // Call the uploadImage method from the Image model
      const uploadedImage = await Image.uploadImage(filename, path, user_id);
      
      res.status(201).json(uploadedImage);
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getImageById(req, res) {
    try {
      const imageId = req.params.id;
      
      // Call the getImageById method from the Image model
      const image = await Image.getImageById(imageId);
      
      res.status(200).json(image);
    } catch (error) {
      console.error('Error retrieving image:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Add other methods as needed
}

module.exports = ImageController;
