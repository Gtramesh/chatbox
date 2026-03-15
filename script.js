// Global Variables
let currentUser = null;
let activeSection = 'home';
let activeChat = null;
let allUsers = [];
let onlineUsers = [];

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
    
    // Load sample users
    loadSampleUsers();
}

// Load Sample Users
function loadSampleUsers() {
    const sampleUsers = [
        {
            id: 1,
            name: 'Alice Johnson',
            email: 'alice@example.com',
            phone: '+1234567890',
            avatar: 'https://picsum.photos/seed/alice/40/40',
            status: 'online',
            joined: 'January 2024',
            location: 'New York, NY'
        },
        {
            id: 2,
            name: 'Bob Smith',
            email: 'bob@example.com',
            phone: '+0987654321',
            avatar: 'https://picsum.photos/seed/bob/40/40',
            status: 'online',
            joined: 'February 2024',
            location: 'Los Angeles, CA'
        },
        {
            id: 3,
            name: 'Carol Williams',
            email: 'carol@example.com',
            phone: '+1122334455',
            avatar: 'https://picsum.photos/seed/carol/40/40',
            status: 'offline',
            joined: 'March 2024',
            location: 'Chicago, IL'
        },
        {
            id: 4,
            name: 'David Brown',
            email: 'david@example.com',
            phone: '+5544332211',
            avatar: 'https://picsum.photos/seed/david/40/40',
            status: 'online',
            joined: 'January 2024',
            location: 'Houston, TX'
        },
        {
            id: 5,
            name: 'Emma Davis',
            email: 'emma@example.com',
            phone: '+9988776655',
            avatar: 'https://picsum.photos/seed/emma/40/40',
            status: 'offline',
            joined: 'April 2024',
            location: 'Phoenix, AZ'
        }
    ];
    
    allUsers = sampleUsers;
    onlineUsers = sampleUsers.filter(user => user.status === 'online');
    renderUsersList();
    updateUserCount();
}

// Render Users List
function renderUsersList(filteredUsers = null) {
    const usersList = document.getElementById('usersList');
    const usersToRender = filteredUsers || allUsers;
    
    if (usersToRender.length === 0) {
        usersList.innerHTML = '<div class="loading-users"><i class="fas fa-search"></i> No users found</div>';
        return;
    }
    
    usersList.innerHTML = usersToRender.map(user => `
        <div class="user-item" onclick="selectUser(${user.id})">
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
    document.getElementById('userCount').textContent = `${onlineCount} online`;
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
    
    // Clear previous messages
    document.getElementById('chatMessages').innerHTML = '';
    
    // Add welcome message
    addMessageToChat(`Hi ${user.name}! 👋 This is the beginning of your conversation.`, 'received', user.avatar);
    
    // Focus message input
    document.getElementById('messageInput').focus();
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
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simulate authentication
    if (email && password) {
        currentUser = {
            name: email.split('@')[0],
            email: email,
            avatar: `https://picsum.photos/seed/${email}/40/40`
        };
        
        // Update UI
        document.getElementById('userName').textContent = currentUser.name;
        
        // Show chat app
        showPage('chatApp');
        
        // Show success message
        showNotification('Login successful! Welcome back.', 'success');
    }
}

function handleSignup(e) {
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
    
    // Simulate registration
    if (name && email && password) {
        currentUser = {
            name: name,
            email: email,
            avatar: `https://picsum.photos/seed/${email}/40/40`
        };
        
        // Update UI
        document.getElementById('userName').textContent = currentUser.name;
        
        // Show chat app
        showPage('chatApp');
        
        // Show success message
        showNotification('Account created successfully! Welcome to ChatBox.', 'success');
    }
}

function logout() {
    currentUser = null;
    showPage('loginPage');
    showNotification('Logged out successfully.', 'info');
}

// Chat Functions
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message && activeChat) {
        addMessageToChat(message, 'sent');
        messageInput.value = '';
        
        // Simulate response
        setTimeout(() => {
            const responses = [
                "That's great! 👍",
                "I totally agree with you!",
                "Interesting! Tell me more.",
                "Sounds good! 😊",
                "Absolutely! 🎉",
                "Thanks for sharing!",
                "How exciting! 🌟",
                "I love that idea! 💡"
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addMessageToChat(randomResponse, 'received');
        }, 1000 + Math.random() * 2000);
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

// Search with debounce
const debouncedSearch = debounce(handleUserSearch, 300);
