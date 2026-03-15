# 📊 MongoDB Setup Guide for ChatBox

## 🚀 Quick Setup Instructions

### 1. Install MongoDB
**Option A: Download from MongoDB Website**
1. Visit https://www.mongodb.com/try/download/community
2. Download MongoDB Community Server for Windows
3. Run the installer with default settings
4. Make sure "Install MongoDB as a Service" is checked

**Option B: Using Chocolatey (Recommended)**
```powershell
# Install Chocolatey (if not already installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install MongoDB
choco install mongodb

# Start MongoDB service
net start MongoDB
```

### 2. Create Database Directory
```powershell
# Create data directory
mkdir C:\data\db
```

### 3. Start MongoDB Server
```powershell
# Method 1: As Windows Service (Recommended)
net start MongoDB

# Method 2: Manual Start
mongod --dbpath "C:\data\db"

# Method 3: Using our start script
npm run start-mongodb
```

### 4. Verify MongoDB is Running
Open browser and visit: http://localhost:27017
You should see: `It looks like you are trying to access MongoDB over HTTP on the native driver port.`

### 5. Start ChatBox Application
```powershell
# Install dependencies
npm install

# Start the application
npm start
```

## 🔧 Configuration

### Environment Variables
Create or update `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/chatbox
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### MongoDB Connection String
- **Default**: `mongodb://localhost:27017/chatbox`
- **Custom**: `mongodb://username:password@localhost:27017/chatbox`

## 📱 Features with MongoDB

### ✅ What Works Now
- **User Registration/Login** - Stored in MongoDB
- **Real User List** - Only shows registered users
- **Chat History** - Messages saved permanently
- **Contact Details** - User profiles stored
- **Online Status** - Real-time status updates
- **Session Persistence** - Users stay logged in

### 🔐 Security Features
- **Password Hashing** - bcryptjs encryption
- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - Prevents API abuse
- **CORS Protection** - Secure cross-origin requests

## 🗄️ Database Schema

### Users Collection
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  avatar: String,
  status: String (online/offline/away),
  lastSeen: Date,
  phone: String,
  location: String,
  joined: Date,
  createdAt: Date
}
```

### Messages Collection
```javascript
{
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  content: String,
  type: String (text/image/file),
  timestamp: Date,
  read: Boolean
}
```

### Conversations Collection
```javascript
{
  participants: [ObjectId] (ref: User),
  lastMessage: ObjectId (ref: Message),
  createdAt: Date,
  updatedAt: Date
}
```

## 🛠️ Troubleshooting

### MongoDB Not Starting
```powershell
# Check if MongoDB service exists
Get-Service -Name "MongoDB"

# Install as service (if missing)
mongod --install --dbpath "C:\data\db" --logpath "C:\data\log\mongo.log"

# Start service
net start MongoDB
```

### Connection Issues
1. **Check MongoDB is running**: `net start MongoDB`
2. **Verify port**: MongoDB runs on 27017 by default
3. **Check firewall**: Ensure port 27017 is open
4. **Database permissions**: Ensure C:\data\db has write permissions

### Common Errors
- **"MongoDB not connected"**: Start MongoDB service first
- **"Authentication failed"**: Clear browser cache and re-login
- **"Port already in use"**: Kill process using port 3000

## 🔄 Development vs Production

### Development (Default)
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chatbox
```

### Production
```env
NODE_ENV=production
MONGODB_URI=mongodb://username:password@host:port/database
JWT_SECRET=your-production-secret-key
```

## 📊 Monitoring

### Check Database Status
```powershell
# Connect to MongoDB shell
mongo

# Show databases
show dbs

# Show collections in chatbox database
use chatbox
show collections

# Count users
db.users.count()

# Count messages
db.messages.count()
```

### View Logs
```powershell
# MongoDB logs
Get-Content "C:\data\log\mongo.log" -Tail 10

# Application logs
npm start
```

## 🚀 Deployment Ready

### For Production Deployment
1. **Set up MongoDB Atlas** (cloud database)
2. **Update environment variables**
3. **Configure SSL/HTTPS**
4. **Set up reverse proxy (nginx)**
5. **Enable backup strategy**

### MongoDB Atlas Setup
1. Visit https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbox
```

## 🎯 Next Steps

Once MongoDB is running:
1. ✅ Start the application: `npm start`
2. ✅ Register new users
3. ✅ Test real-time messaging
4. ✅ Verify data persistence

Your ChatBox application will now store all data in MongoDB and only show users who have actually registered! 🎉
