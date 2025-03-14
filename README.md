# Banana Runner Game

A 3D running game built with React, Three.js, and Express.

## Features

- 3D character running through obstacles
- User authentication (register/login)
- Score tracking and high scores
- Responsive design for various screen sizes

## Project Structure

```
banana-game/
├── client/                 # React frontend
│   ├── public/
│   │   ├── models/         # 3D model files
│   │   └── ...
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── App.js          # Main app component
│   │   └── ...
│   └── package.json
├── server/                 # Express backend
│   ├── server.js           # Server entry point
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

The server will start at http://localhost:5000.

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```
   npm start
   ```

The app will open in your browser at http://localhost:3000.

## Game Controls

- Click "Start Game" to begin
- The character runs automatically
- Avoid obstacles to increase your score
- Game ends when the character hits an obstacle

## Deployment

### Backend Deployment

Deploy the server directory to a Node.js hosting service like Heroku, Vercel, or AWS.

### Frontend Deployment

1. Build the production bundle:
   ```
   cd client
   npm run build
   ```

2. Deploy the `build` directory to a static hosting service like Netlify, Vercel, or GitHub Pages.

## License

MIT

## Acknowledgments

- Three.js for 3D rendering
- React for the UI
- Express for the backend