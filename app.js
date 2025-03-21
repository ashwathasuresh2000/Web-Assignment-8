const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());

// Serve static images from the images folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://ashwathaes:ashu890@webassingnment.miwvw.mongodb.net/assignmentdb?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Define the User schema and model
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  imagePath: { type: String }
});
const User = mongoose.model('User', userSchema);

// Validation helper functions
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isValidFullName(fullName) {
  const re = /^[A-Za-z\s]+$/;
  return re.test(fullName);
}

function isStrongPassword(password) {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return re.test(password);
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});

const fileFilter = function (req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);
  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPEG, PNG, and GIF are allowed.'));
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Swagger configuration
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "User API",
      description: "API for managing users and image uploads",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:3000" }],
  },
  apis: ["app.js"], // Scan this file for annotations
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - password
 *       properties:
 *         fullName:
 *           type: string
 *           description: The user's full name.
 *         email:
 *           type: string
 *           description: The user's email address.
 *         password:
 *           type: string
 *           description: The user's password.
 *         imagePath:
 *           type: string
 *           description: The path to the user's uploaded image.
 *       example:
 *         fullName: "Alice Smith"
 *         email: "alice.smith@example.com"
 *         password: "StrongP@ssw0rd!"
 */

/**
 * @swagger
 * /user/create:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user with full name, email, and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User created successfully."
 *       400:
 *         description: Validation failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed. Missing fields."
 */
app.post('/user/create', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Validation failed. Missing fields." });
    }

    // Validate input
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Validation failed. Invalid email format." });
    }
    if (!isValidFullName(fullName)) {
      return res.status(400).json({ error: "Validation failed. Full name must contain only alphabetic characters." });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: "Validation failed. Password must be minimum 8 characters, including at least one uppercase letter, one lowercase letter, one digit, and one special character." });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashedPassword });
    await user.save();

    return res.status(201).json({ message: "User created successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /user/edit:
 *   put:
 *     summary: Update user details
 *     description: Updates the user's full name and/or password. Email is used to identify the user and cannot be updated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "alice.smith@example.com"
 *               fullName:
 *                 type: string
 *                 example: "Alice S."
 *               password:
 *                 type: string
 *                 example: "NewStr0ngP@ss!"
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User updated successfully."
 *       400:
 *         description: Validation failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed."
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found."
 */
app.put('/user/edit', async (req, res) => {
  try {
    const { email, fullName, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required to update user." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update fullName if provided and valid
    if (fullName) {
      if (!isValidFullName(fullName)) {
        return res.status(400).json({ error: "Validation failed. Full name must contain only alphabetic characters." });
      }
      user.fullName = fullName;
    }

    // Update password if provided and valid
    if (password) {
      if (!isStrongPassword(password)) {
        return res.status(400).json({ error: "Validation failed. Password must be minimum 8 characters, including at least one uppercase letter, one lowercase letter, one digit, and one special character." });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    // Email is not updatable; ignore any changes to it.
    await user.save();
    return res.status(200).json({ message: "User updated successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /user/delete:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes a user from the database using their email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "alice.smith@example.com"
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully."
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found."
 */
app.delete('/user/delete', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required to delete user." });
    }

    const user = await User.findOneAndDelete({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /user/getAll:
 *   get:
 *     summary: Retrieve all users
 *     description: Retrieves a list of all users with full name, email, and hashed password.
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
app.get('/user/getAll', async (req, res) => {
  try {
    // Select only the desired fields
    const users = await User.find({}, 'fullName email password');
    return res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /user/uploadImage:
 *   post:
 *     summary: Upload an image
 *     description: Allows a user to upload an image file for their account, identified by email.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - image
 *             properties:
 *               email:
 *                 type: string
 *                 example: "alice.smith@example.com"
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Image uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Image uploaded successfully."
 *                 filePath:
 *                   type: string
 *                   example: "/images/image-1234567890.jpg"
 *       400:
 *         description: Validation error or invalid file format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid file format. Only JPEG, PNG, and GIF are allowed."
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found."
 */
app.post('/user/uploadImage', upload.single('image'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.imagePath) {
      return res.status(400).json({ error: "Image already exists for this user." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    // Save image file path in the user's document
    user.imagePath = '/images/' + req.file.filename;
    await user.save();

    return res.status(201).json({ message: "Image uploaded successfully.", filePath: user.imagePath });
  } catch (err) {
    console.error(err);
    // Handle multer-specific errors
    if (err instanceof multer.MulterError || err.message.startsWith('Invalid file format')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user using email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "alice.smith@example.com"
 *               password:
 *                 type: string
 *                 example: "StrongP@ssw0rd!"
 *     responses:
 *       200:
 *         description: User authenticated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User authenticated successfully."
 *       400:
 *         description: Invalid credentials or missing fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid credentials."
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found."
 */
app.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    return res.status(200).json({ message: "User authenticated successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
