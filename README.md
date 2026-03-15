# ChatBox - Modern Online Chat Application

A feature-rich online chat application built with HTML, CSS, JavaScript, and Node.js with real-time messaging capabilities.

## Features

### 🎨 Frontend Features
- **Modern UI/UX** with beautiful animations and transitions
- **Responsive Design** that works on all devices
- **Authentication System** with login and signup pages
- **Real-time Chat** with instant messaging
- **Emoji Support** with interactive emoji picker
- **Group Chat** functionality
- **Online Status** indicators
- **Typing Indicators** for better user experience
- **Dark/Light Theme** toggle
- **Search** functionality for conversations
- **File Upload** support (coming soon)
- **Voice/Video Call** buttons (UI ready)

### 🚀 Backend Features
- **Real-time Communication** using Socket.IO
- **RESTful API** for all operations
- **Database Integration** with MongoDB
- **User Authentication** and authorization
- **Message History** storage and retrieval
- **Group Management** system
- **Online Status** tracking
- **Rate Limiting** for security
- **CORS Support** for cross-origin requests

## Technology Stack

### Frontend
- **HTML5** for semantic structure
- **CSS3** with modern features and animations
- **Vanilla JavaScript** for interactions
- **Font Awesome** for icons
- **Animate.css** for beautiful animations
- **Socket.IO Client** for real-time communication

### Backend
- **Node.js** runtime environment
- **Express.js** web framework
- **Socket.IO** for real-time communication
- **MongoDB** with Mongoose ODM
- **JWT** for authentication (ready for production)
- **Helmet** for security headers
- **Rate Limiting** for API protection

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- MongoDB (installed and running)
- npm or yarn package manager

### Setup Instructions

1. **Clone or Download** the project files to your local machine

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy the `.env` file and update the configuration if needed
   - Make sure MongoDB is running on your system

4. **Start the Application**
   ```bash
   # For development
   npm run dev
   
   # For production
   npm start
   ```

5. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000`
   - Register a new account or login with existing credentials

## Project Structure

```
chatbox/
├── index.html          # Main HTML file
├── styles.css          # Complete CSS styling
├── script.js           # Frontend JavaScript
├── server.js           # Backend server
├── package.json        # Node.js dependencies
├── .env               # Environment variables
└── README.md          # Project documentation
```

## Usage Guide

### Getting Started

1. **Create an Account**
   - Click "Sign Up" on the login page
   - Fill in your details and create your account

2. **Login**
   - Use your email and password to login
   - You'll be redirected to the main chat interface

3. **Navigate the App**
   - **Home**: Dashboard with statistics and quick actions
   - **Chat**: Direct messaging with friends
   - **Groups**: Group chat functionality

### Chat Features

- **Send Messages**: Type your message and press Enter or click the send button
- **Add Emojis**: Click the smiley face button to open the emoji picker
- **Check Online Status**: Green dot indicates online users
- **View Typing Indicators**: See when someone is typing a message

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Focus search bar
- `Ctrl/Cmd + Enter`: Send message
- `Escape`: Close emoji picker

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:userId/conversations` - Get user conversations

### Messages
- `GET /api/messages/:userId1/:userId2` - Get chat history between two users

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create new group

## Socket.IO Events

### Client to Server
- `join` - User joins with their ID
- `privateMessage` - Send private message
- `groupMessage` - Send group message
- `typing` - Send typing indicator

### Server to Client
- `newMessage` - Receive new private message
- `newGroupMessage` - Receive new group message
- `userTyping` - Receive typing indicator
- `userStatusUpdate` - User online/offline status change
- `messageSent` - Message sent confirmation

## Configuration

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode
- `JWT_SECRET`: JWT secret key for production

### Customization
- Modify CSS variables in `styles.css` for theme customization
- Add new emojis in the emoji picker section
- Extend the API for additional features

## Security Features

- **Rate Limiting**: Prevents API abuse
- **Helmet.js**: Security headers
- **CORS Configuration**: Cross-origin request handling
- **Input Validation**: Server-side validation
- **Password Hashing**: Ready for bcrypt implementation

## Performance Optimizations

- **Debounced Search**: Optimized search functionality
- **Lazy Loading**: Efficient message loading
- **Caching**: Database query optimization
- **Minified Assets**: Production-ready builds

## Future Enhancements

- [ ] File sharing capabilities
- [ ] Voice and video calling
- [ ] Push notifications
- [ ] Message reactions
- [ ] Advanced group features
- [ ] Mobile app development
- [ ] End-to-end encryption
- [ ] Message search functionality
- [ ] User blocking and reporting

## Contributing

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env` file

2. **Port Already in Use**
   - Change port in `.env` file
   - Kill process using the port

3. **Socket Connection Issues**
   - Check firewall settings
   - Ensure CORS is properly configured

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the project repository.

---

**Happy Chatting! 🎉**
