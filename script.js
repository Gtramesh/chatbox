// Global Variables
let currentUser = null;
let activeSection = 'home';
let activeChat = null;
let conversations = [];

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
    
    // Click outside to close emoji picker
    document.addEventListener('click', function(e) {
        const emojiPicker = document.getElementById('emojiPicker');
        const emojiBtn = document.querySelector('.emoji-btn');
        
        if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
            emojiPicker.style.display = 'none';
        }
    });
    
    // Load sample data
    loadSampleData();
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
    
    if (message) {
        addMessageToChat(message, 'sent');
        messageInput.value = '';
        
        // Simulate response
        setTimeout(() => {
            const responses = [
                "That's great! 👍",
                "I totally agree with you!",
                "Interesting! Tell me more.",
                "Sounds good! 😊",
                "Absolutely! 🎉"
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addMessageToChat(randomResponse, 'received');
        }, 1000 + Math.random() * 2000);
    }
}

function addMessageToChat(message, type) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type} animate__animated animate__fadeInUp`;
    
    if (type === 'received') {
        messageDiv.innerHTML = `
            <img src="https://picsum.photos/seed/user2/32/32" alt="User" class="message-avatar">
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

// Sample Data Loading
function loadSampleData() {
    // Sample conversations
    conversations = [
        {
            id: 1,
            name: 'Sarah Johnson',
            avatar: 'https://picsum.photos/seed/user2/40/40',
            lastMessage: 'Hey! How are you doing?',
            time: '2:30 PM',
            unread: 2,
            online: true
        },
        {
            id: 2,
            name: 'Mike Wilson',
            avatar: 'https://picsum.photos/seed/user3/40/40',
            lastMessage: 'See you tomorrow!',
            time: '1:15 PM',
            unread: 0,
            online: false
        },
        {
            id: 3,
            name: 'Project Team',
            avatar: 'https://picsum.photos/seed/group1/40/40',
            lastMessage: 'John: Great work everyone!',
            time: '12:45 PM',
            unread: 1,
            online: true,
            isGroup: true
        }
    ];
}

// Conversation Management
function selectConversation(conversationId) {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
        activeChat = conversation;
        
        // Update UI
        document.querySelector('.chat-contact h3').textContent = conversation.name;
        document.querySelector('.chat-contact .avatar').src = conversation.avatar;
        
        // Clear unread messages
        conversation.unread = 0;
        updateConversationList();
        
        // Load chat history (simulated)
        loadChatHistory(conversationId);
    }
}

function loadChatHistory(conversationId) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    // Simulate loading previous messages
    const sampleMessages = [
        { text: 'Hey there! 👋', type: 'received', time: '2:00 PM' },
        { text: 'Hi! How are you?', type: 'sent', time: '2:05 PM' },
        { text: 'I\'m doing great! Thanks for asking 😊', type: 'received', time: '2:10 PM' },
        { text: 'What have you been up to?', type: 'sent', time: '2:15 PM' },
        { text: 'Working on some exciting projects!', type: 'received', time: '2:20 PM' }
    ];
    
    sampleMessages.forEach((msg, index) => {
        setTimeout(() => {
            addMessageToChat(msg.text, msg.type);
        }, index * 100);
    });
}

function updateConversationList() {
    // This would update the conversation list UI
    // For now, it's handled in the HTML
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

// Search Functionality
function searchConversations(query) {
    const filtered = conversations.filter(conv => 
        conv.name.toLowerCase().includes(query.toLowerCase())
    );
    
    // Update conversation list with filtered results
    updateConversationList();
}

// File Upload (Simulated)
function handleFileUpload() {
    showNotification('File upload feature coming soon!', 'info');
}

// Voice Call (Simulated)
function startVoiceCall() {
    showNotification('Voice call feature coming soon!', 'info');
}

function startVideoCall() {
    showNotification('Video call feature coming soon!', 'info');
}

// Typing Indicators
function showTypingIndicator() {
    // Show typing indicator in chat
}

function hideTypingIndicator() {
    // Hide typing indicator in chat
}

// Online Status Management
function updateOnlineStatus(status) {
    const statusElement = document.querySelector('.status');
    statusElement.className = `status ${status}`;
    statusElement.textContent = status === 'online' ? 'Online' : 'Offline';
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.search-container input').focus();
    }
    
    // Escape to close emoji picker
    if (e.key === 'Escape') {
        document.getElementById('emojiPicker').style.display = 'none';
    }
    
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const messageInput = document.getElementById('messageInput');
        if (document.activeElement === messageInput) {
            sendMessage();
        }
    }
});

// Theme Toggle (Bonus Feature)
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
const debouncedSearch = debounce(searchConversations, 300);

// Add CSS for notifications
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        padding: 15px 20px;
        z-index: 10000;
        min-width: 300px;
        max-width: 400px;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-success {
        border-left: 4px solid var(--success-color);
        color: var(--success-color);
    }
    
    .notification-error {
        border-left: 4px solid var(--danger-color);
        color: var(--danger-color);
    }
    
    .notification-warning {
        border-left: 4px solid var(--warning-color);
        color: var(--warning-color);
    }
    
    .notification-info {
        border-left: 4px solid var(--primary-color);
        color: var(--primary-color);
    }
    
    .dark-theme {
        --light-color: #1a202c;
        --text-primary: #f7fafc;
        --text-secondary: #cbd5e0;
        --border-color: #2d3748;
        background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
    }
    
    .dark-theme .auth-card,
    .dark-theme .sidebar,
    .dark-theme .main-content,
    .dark-theme .message-content,
    .dark-theme .chat-input,
    .dark-theme .group-card,
    .dark-theme .stat-card {
        background: #2d3748;
        color: var(--text-primary);
    }
    
    .dark-theme .chat-messages {
        background: #1a202c;
    }
`;

// Add notification styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
