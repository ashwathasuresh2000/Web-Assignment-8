User API with Express, MongoDB & Swagger Documentation

Description

This project is a RESTful API built with Node.js, Express, and MongoDB (using Mongoose) for managing user data and image uploads. It includes endpoints for:

Creating users: With validations for full name, email, and password strength.
Updating user details: Allows changing full name and password (email remains unchanged).
Deleting users: Removes a user by email.
Retrieving all users: Returns a list of users (with hashed passwords).
Uploading images: Users can upload one image each (JPEG, PNG, or GIF).
User authentication: Login endpoint verifies user credentials.
Passwords are securely stored using bcrypt, and interactive API documentation is provided via Swagger.

Features

User Creation (POST /user/create)
Validates email format, full name (alphabetical characters only), and a strong password (minimum 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character).
User Update (PUT /user/edit)
Updates full name and/or password. Email is used to identify the user and is not updatable.
User Deletion (DELETE /user/delete)
Deletes a user by their email.
Retrieve All Users (GET /user/getAll)
Retrieves a list of users with full name, email, and hashed password.
Upload Image (POST /user/uploadImage)
Allows users to upload one image file. Acceptable formats are JPEG, PNG, and GIF.
User Login (POST /user/login)
Authenticates users with their email and password.
Swagger Documentation
Accessible at /api-docs for detailed, interactive API documentation.
Technologies

Node.js
Express
MongoDB (Atlas)
Mongoose
bcrypt
multer
swagger-jsdoc
swagger-ui-express
Installation

Clone the Repository:
git clone <repository-url>
cd <repository-folder>
Install Dependencies:
npm install
Setup MongoDB Atlas:
Update the MongoDB connection string in app.js with your MongoDB Atlas credentials. For example:

mongoose.connect('mongodb+srv://<username>:<password>@webassingnment.miwvw.mongodb.net/assignmentdb?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
Create the Images Directory:
Create an images folder in the project root to store uploaded images:

mkdir images
Running the Application

Start the server with:

node app.js
For development with auto-reloading (if you have nodemon installed):

nodemon app.js
The server will run on http://localhost:3000.

API Endpoints

User Creation:
Method: POST
URL: /user/create
Request Body Example:
{
  "fullName": "Alice Smith",
  "email": "alice.smith@example.com",
  "password": "StrongP@ssw0rd!"
}
User Update:
Method: PUT
URL: /user/edit
Request Body Example:
{
  "email": "alice.smith@example.com",
  "fullName": "Alice S.",
  "password": "NewStr0ngP@ss!"
}
User Deletion:
Method: DELETE
URL: /user/delete
Request Body Example:
{
  "email": "alice.smith@example.com"
}
Retrieve All Users:
Method: GET
URL: /user/getAll
Upload Image:
Method: POST
URL: /user/uploadImage
Request Body: Use multipart/form-data with fields:
email: The user's email (e.g., "bob.johnson@example.com")
image: Attach the image file (JPEG, PNG, or GIF)
User Login:
Method: POST
URL: /user/login
Request Body Example:
{
  "email": "alice.smith@example.com",
  "password": "StrongP@ssw0rd!"
}
Swagger Documentation

View the interactive API documentation by navigating to:

http://localhost:3000/api-docs

This documentation includes all endpoint details, request/response examples, and validation rules.

Testing with Postman

For JSON endpoints, set the request body type to raw and JSON.
For image uploads, set the body to form-data and attach the file directly.
Ensure that local file references are managed appropriately if sharing requests with teammates.
