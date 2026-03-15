// Global Variables
let currentUser = null;
let activeSection = 'home';
let activeChat = null;
let allUsers = [];
let onlineUsers = [];
let authToken = null;
let socket = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Setup form listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    
    // Setup message input
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Setup search functionality
    document.getElementById('userSearch').addEventListener('input', handleUserSearch);
    
    // Click outside to close emoji picker
    document.addEventListener('click', function(e) {
        const emojiPicker = document.getElementById('emojiPicker');
        const emojiBtn = document.querySelector('.emoji-btn');
        
        if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
            emojiPicker.style.display = 'none';
        }
    });
    
    // Check for existing session
    checkExistingSession();
}

// Check for existing session
function checkExistingSession() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        document.getElementById('userName').textContent = currentUser.username;
        showPage('chatApp');
        initializeSocket();
        loadRealUsers(); // Load only real registered users
    }
}

// Initialize Socket Connection
function initializeSocket() {
    if (!authToken) return;
    
    socket = io('http://localhost:3000');
    
    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('join', currentUser.id);
    });
    
    socket.on('newMessage', (message) => {
        if (activeChat && (message.sender._id === activeChat.id || message.receiver._id === activeChat.id)) {
            addMessageToChat(message.content, message.sender._id === currentUser.id ? 'sent' : 'received', message.sender.avatar);
        }
    });
    
    socket.on('userStatusUpdate', (data) => {
        updateUserStatus(data.userId, data.status);
    });
    
    socket.on('userTyping', (data) => {
        if (activeChat && data.userId === activeChat.id) {
            showTypingIndicator(data.isTyping);
        }
    });
}

// Load Real Users from Server
async function loadRealUsers() {
    try {
        console.log('Loading real users from server...');
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const users = await response.json();
            console.log('Users loaded:', users);
            
            if (users && users.length > 0) {
                allUsers = users.map(user => ({
                    id: user._id,
                    name: user.username,
                    email: user.email,
                    phone: user.phone || 'Not provided',
                    avatar: user.avatar,
                    status: user.status,
                    joined: new Date(user.joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    location: user.location || 'Not provided'
                }));
                
                onlineUsers = allUsers.filter(user => user.status === 'online');
                renderUsersList();
                updateUserCount();
            } else {
                // No users in database
                allUsers = [];
                onlineUsers = [];
                renderUsersList();
                updateUserCount();
                showNotification('No users registered yet. Be the first to sign up!', 'info');
            }
        } else {
            console.error('Failed to load users, status:', response.status);
            showNotification('Failed to load users. Please check your connection.', 'error');
            // Show empty state - no fallback to sample users
            allUsers = [];
            onlineUsers = [];
            renderUsersList();
            updateUserCount();
        }
    } catch (error) {
        console.error('Failed to load users:', error);
        showNotification('Failed to load users. Please check your connection.', 'error');
        // Show empty state - no fallback to sample users
        allUsers = [];
        onlineUsers = [];
        renderUsersList();
        updateUserCount();
    }
}

// Demo Users Fallback - REMOVED - Only real users allowed
function loadDemoUsers() {
    // NO MORE SAMPLE USERS - Only registered users from MongoDB
    allUsers = [];
    onlineUsers = [];
    renderUsersList();
    updateUserCount();
}

// Render Users List
function renderUsersList(filteredUsers = null) {
    const usersList = document.getElementById('usersList');
    const usersToRender = filteredUsers || allUsers;
    
    if (usersToRender.length === 0) {
        if (allUsers.length === 0) {
            usersList.innerHTML = '<div class="loading-users"><i class="fas fa-users"></i> No other users registered yet. Be the first to invite friends!</div>';
        } else {
            usersList.innerHTML = '<div class="loading-users"><i class="fas fa-search"></i> No users found</div>';
        }
        return;
    }
    
    usersList.innerHTML = usersToRender.map(user => `
        <div class="user-item" onclick="selectUser('${user.id}')">
            <img src="${user.avatar}" alt="${user.name}" class="avatar">
            <div class="user-info">
                <h4>${user.name}</h4>
                <p>Click to start chatting</p>
            </div>
            <div class="user-status ${user.status}"></div>
        </div>
    `).join('');
}

// Update User Count
function updateUserCount() {
    const onlineCount = onlineUsers.length;
    const totalCount = allUsers.length;
    document.getElementById('userCount').textContent = `${onlineCount} online • ${totalCount} total`;
}

// Handle User Search
function handleUserSearch(e) {
    const query = e.target.value.toLowerCase();
    const filteredUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
    renderUsersList(filteredUsers);
}

// Select User for Chat
function selectUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    activeChat = user;
    
    // Update chat header
    document.getElementById('chatAvatar').src = user.avatar;
    document.getElementById('chatUserName').textContent = user.name;
    document.getElementById('chatStatus').textContent = user.status;
    document.getElementById('chatStatus').className = `status ${user.status}`;
    
    // Show active chat, hide empty state
    document.getElementById('noChatSelected').style.display = 'none';
    document.getElementById('activeChat').style.display = 'flex';
    
    // Load chat history
    loadChatHistory(userId);
    
    // Focus message input
    document.getElementById('messageInput').focus();
}

// Load Chat History
async function loadChatHistory(userId) {
    try {
        const response = await fetch(`/api/messages/${currentUser.id}/${userId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const messages = await response.json();
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';
            
            if (messages.length === 0) {
                // No previous messages - show welcome
                addMessageToChat(`Hi ${activeChat.name}! 👋 This is the beginning of your conversation.`, 'received', activeChat.avatar);
            } else {
                // Load real chat history from MongoDB
                messages.forEach(message => {
                    const isSent = message.sender._id === currentUser.id;
                    addMessageToChat(message.content, isSent ? 'sent' : 'received', message.sender.avatar);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load chat history:', error);
        // Show welcome message if no connection
        addMessageToChat(`Hi ${activeChat.name}! 👋 Start chatting now!`, 'received', activeChat.avatar);
    }
}

// View Contact Details
function viewContactDetails() {
    if (!activeChat) return;
    
    // Update modal with user details
    document.getElementById('modalAvatar').src = activeChat.avatar;
    document.getElementById('modalUserName').textContent = activeChat.name;
    document.getElementById('modalStatus').textContent = activeChat.status;
    document.getElementById('modalStatus').className = `status ${activeChat.status}`;
    document.getElementById('modalEmail').textContent = activeChat.email;
    document.getElementById('modalPhone').textContent = activeChat.phone;
    document.getElementById('modalJoined').textContent = `Joined ${activeChat.joined}`;
    document.getElementById('modalLocation').textContent = activeChat.location;
    
    // Show modal
    document.getElementById('contactModal').style.display = 'flex';
}

// Close Contact Modal
function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
}

// Start Chat from Modal
function startChat() {
    closeContactModal();
    showSection('chat');
}

// Add to Contacts
function addToContacts() {
    if (!activeChat) return;
    
    showNotification(`${activeChat.name} added to your contacts!`, 'success');
    closeContactModal();
}

// Start Voice Call
function startVoiceCall() {
    if (!activeChat) return;
    showNotification(`Voice call to ${activeChat.name} starting...`, 'info');
}

// Start Video Call
function startVideoCall() {
    if (!activeChat) return;
    showNotification(`Video call to ${activeChat.name} starting...`, 'info');
}

// Update User Status
function updateUserStatus(userId, status) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        user.status = status;
        renderUsersList();
        updateUserCount();
        
        // Update active chat if it's the same user
        if (activeChat && activeChat.id === userId) {
            document.getElementById('chatStatus').textContent = status;
            document.getElementById('chatStatus').className = `status ${status}`;
        }
    }
}

// Show Typing Indicator
function showTypingIndicator(isTyping) {
    // Implementation for typing indicator
    console.log('User is typing:', isTyping);
}

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Add animation
    const activePage = document.getElementById(pageId);
    activePage.querySelector('.auth-container, .chat-container').classList.add('animate__animated', 'animate__fadeIn');
}

// Section Navigation
function showSection(sectionName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    event.target.closest('.nav-item').classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionName + 'Section').classList.add('active');
    activeSection = sectionName;
    
    // Add animation
    const activeSection = document.getElementById(sectionName + 'Section');
    activeSection.classList.add('animate__animated', 'animate__fadeIn');
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            
            // Save to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            document.getElementById('userName').textContent = currentUser.username;
            
            // Show chat app
            showPage('chatApp');
            
            // Initialize socket and load REAL users only
            initializeSocket();
            await loadRealUsers(); // Only load real registered users
            
            showNotification('Login successful! Welcome back.', 'success');
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username: name, 
                email, 
                password,
                phone: '',
                location: ''
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            
            // Save to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            document.getElementById('userName').textContent = currentUser.username;
            
            // Show chat app
            showPage('chatApp');
            
            // Initialize socket and load REAL users only
            initializeSocket();
            await loadRealUsers(); // Only load real registered users
            
            showNotification('Account created successfully! Welcome to ChatBox.', 'success');
        } else {
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    }
}

function logout() {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Disconnect socket
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    
    // Reset variables
    currentUser = null;
    authToken = null;
    activeChat = null;
    allUsers = [];
    onlineUsers = [];
    
    showPage('loginPage');
    showNotification('Logged out successfully.', 'info');
}

// Chat Functions
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message && activeChat && socket) {
        // Send via socket
        socket.emit('privateMessage', {
            senderId: currentUser.id,
            receiverId: activeChat.id,
            content: message,
            type: 'text'
        });
        
        // Add to UI immediately
        addMessageToChat(message, 'sent');
        messageInput.value = '';
    } else if (!socket) {
        showNotification('Connection lost. Please refresh.', 'error');
    }
}

function addMessageToChat(message, type, avatar = null) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type} animate__animated animate__fadeInUp`;
    
    if (type === 'received') {
        messageDiv.innerHTML = `
            <img src="${avatar || activeChat.avatar}" alt="User" class="message-avatar">
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">${getCurrentTime()}</span>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">${getCurrentTime()}</span>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

// Emoji Functions
function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
}

function insertEmoji(emoji) {
    const messageInput = document.getElementById('messageInput');
    messageInput.value += emoji;
    messageInput.focus();
    
    // Close emoji picker
    document.getElementById('emojiPicker').style.display = 'none';
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} animate__animated animate__slideDown`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('animate__slideOutUp');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Group Functions
function createGroup() {
    const groupName = prompt('Enter group name:');
    if (groupName) {
        showNotification(`Group "${groupName}" created successfully!`, 'success');
    }
}

function joinGroup(groupId) {
    showNotification('Joined group successfully!', 'success');
    showSection('chat');
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('userSearch').focus();
    }
    
    // Escape to close emoji picker or modal
    if (e.key === 'Escape') {
        document.getElementById('emojiPicker').style.display = 'none';
        closeContactModal();
    }
    
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const messageInput = document.getElementById('messageInput');
        if (document.activeElement === messageInput) {
            sendMessage();
        }
    }
});

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// Initialize theme on load
loadTheme();

// Performance Optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Mobile-specific optimizations
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful');
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Mobile touch optimizations
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}

// Mobile viewport handling
function handleMobileViewport() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        document.body.classList.add('mobile-view');
        
        // Adjust chat layout for mobile
        adjustMobileChatLayout();
    } else {
        document.body.classList.remove('mobile-view');
    }
}

// Adjust mobile chat layout
function adjustMobileChatLayout() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar && mainContent) {
        // Mobile layout: sidebar on top, chat below
        if (window.innerWidth <= 768) {
            sidebar.style.height = '60vh';
            mainContent.style.height = '40vh';
        }
    }
}

// Handle device orientation changes
window.addEventListener('orientationchange', function() {
    setTimeout(handleMobileViewport, 100);
});

// Handle resize events
window.addEventListener('resize', handleMobileViewport);

// Initialize mobile optimizations
handleMobileViewport();

// Mobile-specific chat optimizations
function optimizeChatForMobile() {
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    
    if (messageInput) {
        // Prevent zoom on iOS
        messageInput.style.fontSize = '16px';
        
        // Handle keyboard show/hide
        messageInput.addEventListener('focus', function() {
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 300);
        });
    }
}

// Initialize mobile chat optimizations
optimizeChatForMobile();

// Mobile gesture support
let touchStartX = 0;
let touchEndX = 0;

function handleSwipeGesture() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (touchEndX < touchStartX - 50) {
        // Swipe left - show chat
        if (sidebar && mainContent) {
            sidebar.style.transform = 'translateX(-100%)';
            mainContent.style.transform = 'translateX(0)';
        }
    }
    
    if (touchEndX > touchStartX + 50) {
        // Swipe right - show users
        if (sidebar && mainContent) {
            sidebar.style.transform = 'translateX(0)';
            mainContent.style.transform = 'translateX(100%)';
        }
    }
}

// Add touch event listeners
document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
});

// Mobile notification permissions
function requestNotificationPermission() {
    if ('Notification' in navigator && 'serviceWorker' in navigator) {
        Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

// Request notification permission on mobile
requestNotificationPermission();

// Mobile-specific error handling
window.addEventListener('error', function(e) {
    if (window.innerWidth <= 768) {
        console.log('Mobile error:', e.error);
        // Show user-friendly error message for mobile
        showNotification('Something went wrong. Please refresh the page.', 'error');
    }
});

// Mobile performance monitoring
function monitorMobilePerformance() {
    if ('performance' in window) {
        window.addEventListener('load', function() {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log('Mobile load time:', loadTime + 'ms');
            
            if (loadTime > 3000) {
                console.warn('Slow mobile load detected');
            }
        });
    }
}

// Monitor mobile performance
monitorMobilePerformance();

// Mobile battery optimization
if ('getBattery' in navigator) {
    navigator.getBattery().then(function(battery) {
        function updateBatteryStatus() {
            if (battery.level < 0.2) {
                console.log('Low battery detected, optimizing performance');
                // Reduce animations and background tasks
                document.body.classList.add('battery-saver');
            }
        }
        
        updateBatteryStatus();
        battery.addEventListener('levelchange', updateBatteryStatus);
    });
}

// Mobile network status detection
function updateNetworkStatus() {
    const isOnline = navigator.onLine;
    const statusElement = document.querySelector('.connection-status');
    
    if (statusElement) {
        statusElement.textContent = isOnline ? 'Online' : 'Offline';
        statusElement.className = isOnline ? 'status online' : 'status offline';
    }
    
    if (!isOnline) {
        showNotification('You are offline. Some features may not work.', 'warning');
    }
}

// Monitor network status
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// Initialize network status
updateNetworkStatus();

// Mobile-specific user agent detection
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Apply mobile-specific features
if (isMobileDevice()) {
    document.body.classList.add('mobile-device');
    
    // Add mobile-specific meta tags
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    // Add mobile-specific CSS
    const mobileCSS = document.createElement('style');
    mobileCSS.textContent = `
        .mobile-device .chat-messages {
            -webkit-overflow-scrolling: touch;
        }
        
        .mobile-device .btn-primary,
        .mobile-device .btn-secondary,
        .mobile-device .btn-icon {
            min-height: 44px;
        }
        
        .mobile-device .user-item,
        .mobile-device .conversation-item {
            min-height: 44px;
        }
        
        .mobile-device .battery-saver * {
            animation-duration: 0.1s !important;
        }
        
        .connection-status {
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8rem;
            z-index: 1000;
        }
        
        .connection-status.online {
            background: #48bb78;
            color: white;
        }
        
        .connection-status.offline {
            background: #f56565;
            color: white;
        }
    `;
    document.head.appendChild(mobileCSS);
}

// Mobile app install prompt (PWA)
let deferredPrompt;

window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button for mobile
    if (isMobileDevice()) {
        showInstallPrompt();
    }
});

function showInstallPrompt() {
    const installButton = document.createElement('button');
    installButton.textContent = 'Install ChatBox App';
    installButton.className = 'btn-install';
    installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        z-index: 1000;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    `;
    
    installButton.addEventListener('click', function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function(choiceResult) {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
            });
        }
        installButton.remove();
    });
    
    document.body.appendChild(installButton);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (installButton.parentNode) {
            installButton.remove();
        }
    }, 10000);
}

// Add connection status element
const connectionStatus = document.createElement('div');
connectionStatus.className = 'connection-status';
connectionStatus.textContent = 'Online';
document.body.appendChild(connectionStatus);
