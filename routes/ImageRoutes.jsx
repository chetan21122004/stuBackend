// routes/imageRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Adjust destination folder as per your requirement
const ImageController = require('../controllers/ImageController');

// Route to upload an image
router.post('/upload', upload.single('image'), ImageController.uploadImage);

// Route to retrieve an image by ID
router.get('/:id', ImageController.getImageById);

// Add more routes as needed for updating, deleting, or retrieving images

module.exports = router;
