# 9.6 Secrets Project

A web application that allows users to share and view secrets anonymously after authentication. Users can register, log in locally or via Google OAuth, submit their own secrets, and view secrets shared by others.

## Features

- User registration and login with local authentication
- Google OAuth integration for easy login
- Secure password hashing using bcrypt
- Session management with express-session
- PostgreSQL database for storing user data and secrets
- EJS templating for dynamic web pages
- Responsive design with CSS

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: Passport.js (Local and Google OAuth2 strategies)
- **Templating**: EJS
- **Security**: bcrypt for password hashing
- **Session Management**: express-session

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Google OAuth credentials (for Google login)

## Installation

1. Clone or download the project files.

2. Navigate to the project directory:
   ```
   cd 9.6+Secrets+Project
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Set up your PostgreSQL database and create a `users` table:
   ```sql
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255),
     secret TEXT
   );
   ```

5. Create a `.env` file in the root directory with the following variables:
   ```
   SESSION_SECRET=your_session_secret_here
   PG_USER=your_postgres_username
   PG_HOST=localhost
   PG_DATABASE=your_database_name
   PG_PASSWORD=your_postgres_password
   PG_PORT=5432
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

## Usage

1. Start the server:
   ```
   node index.js
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Register a new account or log in with existing credentials

4. Submit your secret or view secrets from other users

## Routes

- `GET /` - Home page
- `GET /login` - Login page
- `GET /register` - Registration page
- `GET /secrets` - View secrets (authenticated users only)
- `GET /submit` - Submit a secret page (authenticated users only)
- `POST /login` - Process login
- `POST /register` - Process registration
- `POST /submit` - Submit a secret
- `GET /logout` - Logout
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/secrets` - Google OAuth callback

## Database Schema

The application uses a single `users` table:

- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR(255) UNIQUE NOT NULL)
- `password` (VARCHAR(255)) - Hashed password or "google" for OAuth users
- `secret` (TEXT) - User's submitted secret

## Security Features

- Passwords are hashed using bcrypt before storage
- Session-based authentication
- Protection against unauthorized access to secret pages
- Secure handling of user credentials

## Contributing

This is a learning project. Feel free to fork and modify for your own purposes.

## License

ISC
