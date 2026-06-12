# E-Blood Bank Monitor

Full-stack E-Blood Bank Monitor using Node.js, Express.js, MongoDB Atlas, and Mongoose. The existing frontend UI is preserved; `app.js` now reads and writes data through REST APIs instead of browser-only static state.

## Backend Structure

- `backend/server.js` - Express app entry point and static frontend hosting
- `backend/config/db.js` - MongoDB Atlas connection
- `backend/models` - Mongoose models for users, donors, hospitals, blood stock, and requests
- `backend/controllers` - REST API controller logic
- `backend/routes` - API route definitions
- `backend/middleware` - authentication, validation, and error handling
- `backend/utils/seedData.js` - initial demo data for a fresh database

## REST APIs

- `POST /api/auth/register` - create an admin or hospital user
- `POST /api/auth/login` - log in and receive a JWT
- `GET /api/auth/me` - get the current authenticated user
- `GET|POST /api/donors` - list and create donors
- `PUT|DELETE /api/donors/:id` - update and delete donors
- `GET|POST /api/hospitals` - list and create hospitals
- `PUT|DELETE /api/hospitals/:id` - update and delete hospitals
- `GET|POST /api/blood-stock` - list and upsert blood stock by group
- `PUT|DELETE /api/blood-stock/:id` - update and delete stock records
- `GET|POST /api/requests` - list and create blood requests
- `PUT|DELETE /api/requests/:id` - update and delete requests

All donor, hospital, stock, and request endpoints require a bearer token.

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create a MongoDB Atlas cluster and copy the connection string.

3. Update `.env`:


```

4. Start the server:

```bash
npm start
```

5. Open the app:

```text
http://localhost:5000
```

For development with auto-restart:

```bash
npm run dev
```

## Demo Login

On first startup, the server seeds a demo admin user if no users exist:

- Email: `admin@eblood.local`
- Password: `password123`

The frontend now shows Login and Register buttons in the header. Use the demo account above, or create a new MongoDB-backed user from the Register modal.

## Notes

- `index.html`, `styles.css`, and `app.js` include the visible Login/Register modal flow.
- Form/button actions in `app.js` now call APIs and persist data in MongoDB Atlas.
- Validation is handled in controllers and Mongoose schemas.
- API errors are returned as JSON and surfaced in the UI as toast messages.
