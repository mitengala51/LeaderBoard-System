# 🏆 Leaderboard System

A modern, real-time leaderboard application built with React.js and Node.js that allows users to claim points and compete on a live-updating leaderboard. Perfect for gamification, competitions, and tracking user achievements.

## ✨ Features

- **🎯 User Management**: Add new users with name and email validation
- **⚡ Random Points System**: Claim 1-10 random points for selected users
- **📊 Live Leaderboard**: Real-time updates every 3 seconds with automatic polling
- **📈 Statistics Dashboard**: Track total users, points, and claims with beautiful cards
- **🎨 Modern UI**: Clean, responsive design with gradient backgrounds and animations
- **🔄 Real-time Updates**: Automatic data synchronization without page refresh
- **💾 Persistent Storage**: All data stored in MongoDB with proper schema validation
- **🚀 Production Ready**: Optimized code structure with proper error handling

## 🛠️ Tech Stack

### Frontend
- **React.js 18+** - Modern React with hooks and functional components
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client for API communication
- **Vite** - Fast build tool and development server

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data persistence
- **Mongoose** - MongoDB object modeling library
- **CORS** - Cross-origin resource sharing middleware

## 📁 Project Structure

```
leaderboard-system/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx          # Main dashboard orchestrator
│   │   │   ├── Leaderboard.jsx        # Live leaderboard component
│   │   │   ├── UserSelector.jsx       # User selection & addition
│   │   │   └── ClaimButton.jsx        # Points claiming functionality
│   │   ├── api.js                     # Centralized API configuration
│   │   ├── App.jsx                    # Root application component
│   │   ├── main.jsx                   # Application entry point
│   │   └── index.css                  # Global styles
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── models/
│   │   ├── User.js                    # User schema and model
│   │   └── Claim.js                   # Claim history schema
│   ├── routes/
│   │   ├── users.js                   # User management routes
│   │   ├── leaderboard.js             # Leaderboard API routes
│   │   └── claims.js                  # Points claiming routes
│   ├── middleware/
│   │   └── validation.js              # Input validation middleware
│   ├── config/
│   │   └── database.js                # MongoDB connection setup
│   ├── server.js                      # Express server entry point
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/mitengala51/LeaderBoard-System.git
cd leaderboard-system
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with your MongoDB connection string
echo "MONGODB_URI=mongodb://localhost:27017/leaderboard" > .env
echo "PORT=5000" >> .env

# Start the backend server
npm start
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 4. Environment Configuration

**Important**: The code is production-ready, but for local development, you need to update the API base URL:

In `frontend/src/api.js`, change:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

For production deployment, update this to your deployed backend URL.

### 5. Access the Application
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

## 🌐 Deployment

### Frontend (Vercel)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Update `API_BASE_URL` in `api.js` to your backend URL

### Backend (Render/Railway/Heroku)
1. Set environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `PORT`: Server port (usually set automatically)
2. Deploy the backend directory
3. Update frontend API URL to match your backend deployment

### Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Add your connection string to the backend environment variables
3. Whitelist your deployment IP addresses

## 📊 API Endpoints

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Add a new user
- `GET /api/users/stats/summary` - Get user statistics

### Leaderboard
- `GET /api/leaderboard?limit=10` - Get leaderboard with optional limit

### Claims
- `POST /api/claims` - Claim points for a user

## 🎮 How to Use

1. **Add Users**: Use the "Add New User" form to create new participants
2. **Select User**: Choose a user from the dropdown to claim points for
3. **Claim Points**: Click "Claim Random Points" to award 1-10 random points
4. **View Leaderboard**: Watch the live leaderboard update automatically
5. **Track Stats**: Monitor total users, points, and claims in the dashboard

## 🔧 Development Features

- **Real-time Polling**: Automatic updates every 3 seconds
- **Error Handling**: Comprehensive error handling with user notifications
- **Loading States**: Beautiful loading animations for better UX
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Clean Code**: Well-structured, commented code following best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern React.js and Node.js
- Styled with Tailwind CSS
- Icons by Lucide React
- Deployed on modern cloud platforms

⭐ **Star this repository if you found it helpful!**

For questions or support, please open an issue or reach out to the maintainers.
