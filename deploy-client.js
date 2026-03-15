// Simple client-side deployment script for static hosting
// This file enables the app to work without a backend server for static hosting

// Mock database for static deployment
const mockDatabase = {
    users: [],
    messages: [],
    conversations: [],
    groups: []
};

// Mock authentication for static deployment
function mockLogin(email, password) {
    const user = {
        id: Date.now(),
        username: email.split('@')[0],
        email: email,
        avatar: `https://picsum.photos/seed/${email}/40/40`,
        status: 'online'
    };
    
    mockDatabase.users.push(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
}

// Enhanced frontend script for static deployment
window.addEventListener('DOMContentLoaded', function() {
    // Check if running in static mode (no backend)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.log('Running in static deployment mode');
        
        // Override login handler for static mode
        const originalLogin = window.handleLogin;
        window.handleLogin = function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (email && password) {
                const user = mockLogin(email, password);
                document.getElementById('userName').textContent = user.username;
                showPage('chatApp');
                showNotification('Login successful! Welcome to ChatBox.', 'success');
            }
        };
        
        // Override signup handler for static mode
        const originalSignup = window.handleSignup;
        window.handleSignup = function(e) {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showNotification('Passwords do not match!', 'error');
                return;
            }
            
            if (name && email && password) {
                const user = mockLogin(email, password);
                user.username = name;
                document.getElementById('userName').textContent = user.username;
                showPage('chatApp');
                showNotification('Account created successfully! Welcome to ChatBox.', 'success');
            }
        };
        
        // Mock message sending for static mode
        const originalSendMessage = window.sendMessage;
        window.sendMessage = function() {
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
                        "Absolutely! 🎉",
                        "Thanks for sharing!",
                        "How exciting! 🌟",
                        "I love that idea! 💡"
                    ];
                    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                    addMessageToChat(randomResponse, 'received');
                }, 1000 + Math.random() * 2000);
            }
        };
    }
});

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mockDatabase, mockLogin };
}
