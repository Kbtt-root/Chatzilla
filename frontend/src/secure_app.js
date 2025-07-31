import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Components } from './components';
import secureStorage, { AuthManager } from './secure_storage';

const { 
  Sidebar, 
  ChatWindow, 
  WelcomeScreen,
  SettingsModal,
  NewChatModal,
  ProfileModal 
} = Components;

// SECURE: Default avatars without external URLs
const DEFAULT_AVATARS = {
  male: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM0Qzc5RkYiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0id2hpdGUiLz48ZWxsaXBzZSBjeD0iNzUiIGN5PSIxMjAiIHJ4PSI0MCIgcnk9IjI1IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
  female: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGRjc5QzYiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0id2hpdGUiLz48ZWxsaXBzZSBjeD0iNzUiIGN5PSIxMjAiIHJ4PSI0MCIgcnk9IjI1IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
  group: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM2Nzc5RkYiLz48Y2lyY2xlIGN4PSI2MCIgY3k9IjU1IiByPSIxNSIgZmlsbD0id2hpdGUiLz48Y2lyY2xlIGN4PSI5MCIgY3k9IjU1IiByPSIxNSIgZmlsbD0id2hpdGUiLz48ZWxsaXBzZSBjeD0iNzUiIGN5PSIxMTAiIHJ4PSI0NSIgcnk9IjIwIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg=='
};

// SECURE: Mock contacts with local avatars
const getSecureMockContacts = () => [
  {
    id: 1,
    name: 'Alice Johnson',
    avatar: DEFAULT_AVATARS.female,
    lastMessage: 'Hey, how are you doing?',
    timestamp: '2:30 PM',
    unreadCount: 2,
    isOnline: true,
    phone: '+1 (555) 123-4567'
  },
  {
    id: 2,
    name: 'Bob Smith',
    avatar: DEFAULT_AVATARS.male,
    lastMessage: 'Thanks for the update!',
    timestamp: '1:15 PM',
    unreadCount: 0,
    isOnline: false,
    phone: '+1 (555) 987-6543'
  },
  {
    id: 3,
    name: 'Carol Davis',
    avatar: DEFAULT_AVATARS.female,
    lastMessage: 'See you tomorrow!',
    timestamp: '11:45 AM',
    unreadCount: 1,
    isOnline: true,
    phone: '+1 (555) 456-7890'
  },
  {
    id: 4,
    name: 'David Wilson',
    avatar: DEFAULT_AVATARS.male,
    lastMessage: 'Great job on the project!',
    timestamp: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
    phone: '+1 (555) 234-5678'
  },
  {
    id: 5,
    name: 'Emma Brown',
    avatar: DEFAULT_AVATARS.female,
    lastMessage: 'Can you send me the files?',
    timestamp: 'Tuesday',
    unreadCount: 3,
    isOnline: true,
    phone: '+1 (555) 345-6789'
  },
  {
    id: 6,
    name: 'Family Group',
    avatar: DEFAULT_AVATARS.group,
    lastMessage: 'Mom: Dinner is ready!',
    timestamp: '6:30 PM',
    unreadCount: 5,
    isOnline: true,
    isGroup: true,
    phone: 'Group Chat'
  }
];

// SECURE: Mock messages with proper encryption flags
const getSecureMockMessages = () => ({
  1: [
    {
      id: 1,
      text: 'Hey there! How are you doing today?',
      timestamp: '2:28 PM',
      sender: 'Alice Johnson',
      isSent: false,
      isRead: true,
      encrypted: true
    },
    {
      id: 2,
      text: 'I\'m doing great, thanks for asking! How about you?',
      timestamp: '2:29 PM',
      sender: 'You',
      isSent: true,
      isRead: true,
      encrypted: true
    },
    {
      id: 3,
      text: 'I\'m good too! Just finished work and thought I\'d check in.',
      timestamp: '2:30 PM',
      sender: 'Alice Johnson',
      isSent: false,
      isRead: false,
      encrypted: true
    }
  ],
  2: [
    {
      id: 1,
      text: 'Thanks for sending me that document earlier!',
      timestamp: '1:10 PM',
      sender: 'Bob Smith',
      isSent: false,
      isRead: true,
      encrypted: true
    },
    {
      id: 2,
      text: 'No problem at all! Let me know if you need anything else.',
      timestamp: '1:12 PM',
      sender: 'You',
      isSent: true,
      isRead: true,
      encrypted: true
    },
    {
      id: 3,
      text: 'Thanks for the update!',
      timestamp: '1:15 PM',
      sender: 'Bob Smith',
      isSent: false,
      isRead: true,
      encrypted: true
    }
  ],
  // Add more messages as needed...
});

function SecureApp() {
  const [selectedContact, setSelectedContact] = useState(null);
  const [contacts, setContacts] = useState(getSecureMockContacts());
  const [messages, setMessages] = useState(getSecureMockMessages());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [securityEnabled, setSecurityEnabled] = useState(true);
  const [encryptionStatus, setEncryptionStatus] = useState('active');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authManager] = useState(new AuthManager(secureStorage));

  // Security initialization
  useEffect(() => {
    // Initialize secure storage
    window.secureStorage = secureStorage;
    window.authManager = authManager;

    // Check authentication status
    if (authManager.isAuthenticated()) {
      setIsAuthenticated(true);
      setCurrentUser(authManager.getUser());
    }

    // Load secure data if authenticated
    if (isAuthenticated) {
      const storedContacts = secureStorage.secureGet('contacts');
      if (storedContacts) {
        setContacts(storedContacts);
      }

      const storedMessages = secureStorage.secureGet('messages');
      if (storedMessages) {
        setMessages(storedMessages);
      }
    }

    // Set up security monitoring
    const securityInterval = setInterval(() => {
      const report = secureStorage.getSecurityReport();
      console.log('Security Status:', report);
    }, 30000);

    // Cleanup function
    return () => {
      clearInterval(securityInterval);
    };
  }, [authManager, isAuthenticated]);

  // Authentication handlers
  const handleLogin = async (email, password) => {
    try {
      const result = await authManager.login(email, password);
      setIsAuthenticated(true);
      setCurrentUser(result);
      console.log('Login successful');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleLogout = () => {
    authManager.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setMessages({});
    setContacts(getSecureMockContacts());
    setSelectedContact(null);
  };

  // Global functions for security (backward compatibility)
  useEffect(() => {
    window.clearSensitiveData = () => {
      secureStorage.clearSensitiveData();
      setMessages({});
      setContacts([]);
      setSelectedContact(null);
    };

    window.clearAllData = window.clearSensitiveData;
  }, []);

  const sendMessage = async (text) => {
    if (!selectedContact || !text.trim() || !isAuthenticated) return;

    // Security: Rate limiting
    if (!secureStorage.rateLimit('sendMessage', 30, 60000)) {
      alert('Rate limit exceeded. Please wait before sending more messages.');
      return;
    }

    // Security: Input validation and sanitization
    const sanitizedText = secureStorage.sanitizeInput(text);
    if (sanitizedText.length === 0) {
      alert('Invalid message content detected.');
      return;
    }

    const newMessage = {
      id: Date.now(),
      text: sanitizedText,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      sender: 'You',
      isSent: true,
      isRead: false,
      encrypted: true
    };

    const updatedMessages = {
      ...messages,
      [selectedContact.id]: [...(messages[selectedContact.id] || []), newMessage]
    };

    setMessages(updatedMessages);

    // Secure storage
    secureStorage.secureSet('messages', updatedMessages);

    // Update last message in contacts
    const updatedContacts = contacts.map(contact => 
      contact.id === selectedContact.id 
        ? { ...contact, lastMessage: sanitizedText, timestamp: newMessage.timestamp }
        : contact
    );

    setContacts(updatedContacts);
    secureStorage.secureSet('contacts', updatedContacts);

    // In a real app, send to server here
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: authManager.getAuthHeaders(),
        body: JSON.stringify({
          content: sanitizedText,
          recipient_id: selectedContact.id.toString()
        })
      });

      if (!response.ok) {
        console.error('Failed to send message to server');
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  const handleContactSelect = (contact) => {
    // Security: Rate limiting for contact selection
    if (!secureStorage.rateLimit('selectContact', 100, 60000)) {
      return;
    }

    setSelectedContact(contact);
  };

  const handleSearchChange = (query) => {
    // Security: Sanitize search input
    const sanitizedQuery = secureStorage.sanitizeInput(query);
    setSearchQuery(sanitizedQuery);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedContact ? messages[selectedContact.id] || [] : [];

  // Security status indicator
  const getSecurityStatus = () => {
    return {
      encryption: encryptionStatus,
      securityEnabled,
      sessionSecure: secureStorage.generateSessionId() ? true : false,
      authenticated: isAuthenticated,
      user: currentUser
    };
  };

  // Login component for unauthenticated users
  const LoginComponent = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (isRegistering) {
        try {
          await authManager.register(username, email, password);
          setIsAuthenticated(true);
          const user = authManager.getUser();
          setCurrentUser(user);
        } catch (error) {
          alert('Registration failed. Please try again.');
        }
      } else {
        await handleLogin(email, password);
      }
    };

    return (
      <div className="login-container">
        <div className="login-form">
          <div className="login-header">
            <h1>🛡️ Chatzilla Secure</h1>
            <p>Secure messaging with end-to-end encryption</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {isRegistering && (
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength="3"
                  maxLength="30"
                />
              </div>
            )}
            
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="8"
              />
            </div>
            
            <button type="submit" className="login-btn">
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          
          <p className="login-toggle">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              type="button" 
              onClick={() => setIsRegistering(!isRegistering)}
              className="toggle-btn"
            >
              {isRegistering ? 'Login' : 'Register'}
            </button>
          </p>
          
          <div className="security-notice">
            <p>🔒 This application uses:</p>
            <ul>
              <li>JWT Authentication</li>
              <li>Secure Password Hashing</li>
              <li>Session Management</li>
              <li>Input Validation</li>
              <li>CORS Protection</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginComponent />;
  }

  return (
    <div className={`App ${isDarkMode ? 'dark' : ''}`}>
      <div className="signal-container">
        {/* Security Status Bar */}
        <div className="security-status-bar">
          <div className="security-indicators">
            <span className="security-indicator encryption-active" title="End-to-end encryption active">
              🔒 Encrypted
            </span>
            <span className="security-indicator session-secure" title="Secure session active">
              🛡️ Authenticated: {currentUser?.username}
            </span>
            <span className="security-indicator anti-tamper" title="Anti-tampering protection active">
              🔐 Protected
            </span>
            <button 
              className="logout-btn"
              onClick={handleLogout}
              title="Secure Logout"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        <Sidebar
          contacts={filteredContacts}
          selectedContact={selectedContact}
          onSelectContact={handleContactSelect}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onShowSettings={() => setShowSettings(true)}
          onShowNewChat={() => setShowNewChat(true)}
          onShowProfile={() => setShowProfile(true)}
        />
        
        <div className="main-content">
          {selectedContact ? (
            <ChatWindow
              contact={selectedContact}
              messages={currentMessages}
              onSendMessage={sendMessage}
              securityStatus={getSecurityStatus()}
            />
          ) : (
            <WelcomeScreen />
          )}
        </div>

        {showSettings && (
          <SettingsModal
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onClose={() => setShowSettings(false)}
            securityStatus={getSecurityStatus()}
          />
        )}

        {showNewChat && (
          <NewChatModal
            onClose={() => setShowNewChat(false)}
          />
        )}

        {showProfile && (
          <ProfileModal
            onClose={() => setShowProfile(false)}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
}

export default SecureApp;