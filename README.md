# Garments Orders & Production Tracker System Server

## Purpose

Backend server for managing garment orders and production. Provides RESTful APIs to handle orders, products, users, and file uploads efficiently.

## Key Features

- RESTful API endpoints with GET, POST, PUT, DELETE
- Manage orders, products, and production status
- User authentication and role management
- File uploads with Cloudinary
- Payment integration with Stripe
- CORS and cookie handling for secure requests

## NPM Packages Used

- `express` – Web framework for Node.js
- `mongodb` – MongoDB driver for database interactions
- `firebase-admin` – Firebase authentication and services
- `cors` – Cross-origin request handling
- `cookie-parser` – Cookie parsing for requests
- `dotenv` – Environment variable management
- `multer` – Handling file uploads
- `multer-storage-cloudinary` – Uploading files to Cloudinary
- `cloudinary` – Cloud-based media storage
- `stripe` – Payment processing
- `nodemon` – Auto-restart server during development
