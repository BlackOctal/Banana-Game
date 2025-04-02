# 🍌 Banana Game

A 3D endless runner game where players control a character collecting bananas while avoiding obstacles.

![Banana Game](https://your-screenshot-url-here.png)

## 🎮 Game Overview

Banana Game is an interactive 3D web-based game built with React, Three.js, and MongoDB. Players control a character running on an infinite road while avoiding obstacles. If the character hits an obstacle, players must solve a banana math challenge to continue their run. The game features user authentication, character animations, and unlockable character colors based on your score.

## ✨ Features

- **3D Endless Runner Gameplay**: Control a character running on an infinite road
- **Obstacle Avoidance**: Dodge obstacles to continue your run
- **Banana Math Challenges**: Answer math questions correctly to continue after hitting an obstacle
- **Unlockable Character Colors**: Unlock green (50 points), blue (100 points), and red (150 points) characters
- **User Authentication**: Create accounts to save your progress and scores
- **Expressive Character Animation**: Character reacts to game events

## 🛠️ Tech Stack

### Frontend
- React.js
- Three.js (3D rendering)
- React Three Fiber (React renderer for Three.js)
- CSS/SCSS for styling

### Backend
- Node.js
- Express.js
- MongoDB (Database)
- JWT for authentication

## 🚀 Getting Started

### Prerequisites
- Node.js (v14.0.0 or later)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. Clone the repository
```bash
git clone https://github.com/BlackOctal/Banana-Game.git
cd Banana-Game
```

2. Install frontend dependencies
```bash
npm install
```

3. Navigate to backend directory and install dependencies
```bash
cd backend
npm install
```

4. Create a `.env` file in the backend directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

5. Start the backend server
```bash
npm start
```

6. In a new terminal, navigate back to the project root and start the frontend
```bash
cd ..
npm run dev
```

7. Open your browser and navigate to `http://localhost:3000`

## 📁 Project Structure

```
├───backend
│   ├───config
│   │   └───db.js                  // MongoDB connection configuration
│   ├───controllers
│   │   ├───authController.js      // User authentication logic
│   │   └───scoreController.js     // Score management logic
│   ├───middleware
│   │   └───auth.js                // Authentication middleware
│   ├───models
│   │   ├───User.js                // User model for MongoDB
│   │   └───Score.js               // Score model for MongoDB
│   ├───routes
│   │   ├───auth.js                // Authentication routes
│   │   └───scores.js              // Score routes
│   ├───server.js                  // Main server file
│   └───package.json               // Backend dependencies
├───public
│   └───models
│       └───gltf
│           └───RobotExpressive    // 3D model for the character
└───src
    ├───assets                     // Game assets and resources
    ├───components
    │   ├───Auth                   // Authentication components
    │   ├───BananaGame             // Banana Math game components
    │   ├───CharacterController    // Character movement logic
    │   ├───HomePage               // Landing page components
    │   ├───InfinityRoad           // Infinite road generation
    │   └───Obstacles              // Obstacle generation and logic
    ├───services                   // API services
    └───utils                      // Utility functions
```

## 🎮 How to Play

1. Create an account or log in to save your scores
2. Use the arrow keys or WASD to control your character:
   - Left Arrow: Move left
   - Right Arrow: Move right
3. Avoid obstacles that come towards your character
4. If you hit an obstacle, you'll enter the Banana Math Challenge
5. Answer the math question correctly to continue your run
6. Reach score milestones to unlock new character colors:
   - 50 points: Green character
   - 100 points: Blue character
   - 150 points: Red character
7. Try to achieve the highest score possible!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgements

- [Three.js](https://threejs.org/) for 3D rendering
- [MongoDB](https://www.mongodb.com/) for database
- All contributors who have helped shape the project

---

Made by [BlackOctal](https://github.com/BlackOctal)
