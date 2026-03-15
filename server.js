const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbox', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Models
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    status: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
    lastSeen: { type: Date, default: Date.now },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    joined: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

const ConversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    avatar: { type: String },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const FriendSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);
const Friend = mongoose.model('Friend', FriendSchema);
const Group = mongoose.model('Group', GroupSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId) => {
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        
        // Update user status to online
        User.findByIdAndUpdate(userId, { 
            status: 'online',
            lastSeen: new Date()
        }).then(() => {
            socket.broadcast.emit('userStatusUpdate', { userId, status: 'online' });
        });
    });

    // Handle private messages
    socket.on('privateMessage', async (data) => {
        try {
            const { senderId, receiverId, content, type = 'text' } = data;
            
            // Save message to database
            const message = new Message({
                sender: senderId,
                receiver: receiverId,
                content,
                type,
                timestamp: new Date()
            });
            
            await message.save();
            
            // Populate sender and receiver info
            await message.populate('sender receiver');
            
            // Send message to receiver if online
            const receiverSocketId = connectedUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('newMessage', message);
            }
            
            // Send confirmation to sender
            socket.emit('messageSent', message);
            
            // Update conversation
            await updateConversation(senderId, receiverId, message._id);
            
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
        const { receiverId, isTyping } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
        
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('userTyping', {
                userId: socket.userId,
                isTyping
            });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            // Update user status to offline
            User.findByIdAndUpdate(socket.userId, { 
                status: 'offline',
                lastSeen: new Date()
            }).then(() => {
                socket.broadcast.emit('userStatusUpdate', { 
                    userId: socket.userId, 
                    status: 'offline',
                    lastSeen: new Date()
                });
            });
            
            connectedUsers.delete(socket.userId);
        }
        console.log('User disconnected:', socket.id);
    });
});

// Helper function to update conversation
async function updateConversation(userId1, userId2, messageId) {
    try {
        let conversation = await Conversation.findOne({
            participants: { $all: [userId1, userId2] }
        });
        
        if (!conversation) {
            conversation = new Conversation({
                participants: [userId1, userId2],
                lastMessage: messageId
            });
        } else {
            conversation.lastMessage = messageId;
            conversation.updatedAt = new Date();
        }
        
        await conversation.save();
    } catch (error) {
        console.error('Error updating conversation:', error);
    }
}

// API Routes

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, phone, location } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User with this email or username already exists' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            phone: phone || '',
            location: location || '',
            avatar: `https://picsum.photos/seed/${email}/40/40`
        });
        
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({ 
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: user.status,
                phone: user.phone,
                location: user.location,
                joined: user.joined
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update user status
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: user.status,
                phone: user.phone,
                location: user.location,
                joined: user.joined
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// User routes
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({ 
            _id: { $ne: req.user.userId } // Exclude current user
        })
        .select('username email avatar status lastSeen phone location joined')
        .sort({ joined: -1 }); // Show newest users first
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Friends routes
app.get('/api/friends', authenticateToken, async (req, res) => {
    try {
        const friends = await Friend.find({ userId: req.user.userId })
            .populate('friendId', 'username email avatar status')
            .sort({ createdAt: -1 });
        
        res.json(friends);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch friends' });
    }
});

app.post('/api/friends', authenticateToken, async (req, res) => {
    try {
        const { friendId } = req.body;
        
        // Check if already friends
        const existingFriend = await Friend.findOne({
            $or: [
                { userId: req.user.userId, friendId },
                { userId: friendId, friendId: req.user.userId }
            ]
        });
        
        if (existingFriend) {
            return res.status(400).json({ error: 'Already friends' });
        }
        
        // Create friendship
        const friend = new Friend({
            userId: req.user.userId,
            friendId
        });
        
        await friend.save();
        res.status(201).json({ message: 'Friend added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add friend' });
    }
});

// Groups routes
app.get('/api/groups', authenticateToken, async (req, res) => {
    try {
        const groups = await Group.find({ 
            members: req.user.userId 
        })
            .populate('creator', 'username email avatar')
            .populate('members', 'username email avatar status')
            .sort({ createdAt: -1 });
        
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

app.post('/api/groups', authenticateToken, async (req, res) => {
    try {
        const { name, members } = req.body;
        
        // Create group
        const group = new Group({
            name,
            creator: req.user.userId,
            members: [req.user.userId, ...members] // Include creator in members
        });
        
        await group.save();
        res.status(201).json({ message: 'Group created successfully', group });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// Conversations routes
app.get('/api/users/:userId/conversations', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const conversations = await Conversation.find({
            participants: { $all: [userId, req.user.userId] }
        })
        .populate('participants', 'username email avatar status')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });
        
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Message routes
app.get('/api/messages/:userId1/:userId2', authenticateToken, async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;
        
        const messages = await Message.find({
            $or: [
                { sender: userId1, receiver: userId2 },
                { sender: userId2, receiver: userId1 }
            ]
        })
        .populate('sender receiver', 'username avatar')
        .sort({ timestamp: 1 });
        
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Get current user info
app.get('/api/user/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('username email avatar status phone location joined');
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
});

// Group routes
app.get('/api/groups', authenticateToken, async (req, res) => {
    try {
        const groups = await Group.find({
            members: req.user.userId
        })
            .populate('admin', 'username avatar')
            .populate('members', 'username avatar status');
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

app.post('/api/groups', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        
        const group = new Group({
            name,
            description,
            admin: req.user.userId,
            members: [req.user.userId],
            avatar: `https://picsum.photos/seed/${name}/60/60`
        });
        
        await group.save();
        await group.populate('admin members');
        
        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Chat application available at http://localhost:${PORT}`);
    console.log(`MongoDB connected for data storage`);
});

module.exports = { app, server, io };
