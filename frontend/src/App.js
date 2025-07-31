import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Components } from './components';
import SecurityManager from './security';

const { 
  Sidebar, 
  ChatWindow, 
  WelcomeScreen,
  SettingsModal,
  NewChatModal,
  ProfileModal 
} = Components;

// Mock data for contacts and chats
const mockContacts = [
  {
    id: 1,
    name: 'Alice Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
    lastMessage: 'Hey, how are you doing?',
    timestamp: '2:30 PM',
    unreadCount: 2,
    isOnline: true,
    phone: '+1 (555) 123-4567'
  },
  {
    id: 2,
    name: 'Bob Smith',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    lastMessage: 'Thanks for the update!',
    timestamp: '1:15 PM',
    unreadCount: 0,
    isOnline: false,
    phone: '+1 (555) 987-6543'
  },
  {
    id: 3,
    name: 'Carol Davis',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    lastMessage: 'See you tomorrow!',
    timestamp: '11:45 AM',
    unreadCount: 1,
    isOnline: true,
    phone: '+1 (555) 456-7890'
  },
  {
    id: 4,
    name: 'David Wilson',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    lastMessage: 'Great job on the project!',
    timestamp: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
    phone: '+1 (555) 234-5678'
  },
  {
    id: 5,
    name: 'Emma Brown',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    lastMessage: 'Can you send me the files?',
    timestamp: 'Tuesday',
    unreadCount: 3,
    isOnline: true,
    phone: '+1 (555) 345-6789'
  },
  {
    id: 6,
    name: 'Family Group',
    avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=150&h=150&fit=crop&crop=center',
    lastMessage: 'Mom: Dinner is ready!',
    timestamp: '6:30 PM',
    unreadCount: 5,
    isOnline: true,
    isGroup: true,
    phone: 'Group Chat'
  }
];

const mockMessages = {
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
  3: [
    {
      id: 1,
      text: 'Are we still meeting tomorrow at 10 AM?',
      timestamp: '11:40 AM',
      sender: 'Carol Davis',
      isSent: false,
      isRead: true,
      encrypted: true
    },
    {
      id: 2,
      text: 'Yes, definitely! I\'ll see you at the coffee shop.',
      timestamp: '11:42 AM',
      sender: 'You',
      isSent: true,
      isRead: true,
      encrypted: true
    },
    {
      id: 3,
      text: 'See you tomorrow!',
      timestamp: '11:45 AM',
      sender: 'Carol Davis',
      isSent: false,
      isRead: false,
      encrypted: true
    }
  ],
  6: [
    {
      id: 1,
      text: 'What time should we meet for lunch?',
      timestamp: '5:30 PM',
      sender: 'Dad',
      isSent: false,
      isRead: true,
      encrypted: true
    },
    {
      id: 2,
      text: 'How about 12:30 PM at the usual place?',
      timestamp: '5:35 PM',
      sender: 'You',
      isSent: true,
      isRead: true,
      encrypted: true
    },
    {
      id: 3,
      text: 'Sounds perfect!',
      timestamp: '5:40 PM',
      sender: 'Mom',
      isSent: false,
      isRead: true,
      encrypted: true
    },
    {
      id: 4,
      text: 'I\'ll be a bit late, start without me',
      timestamp: '6:15 PM',
      sender: 'Sarah',
      isSent: false,
      isRead: true,
      encrypted: true
    },
    {
      id: 5,
      text: 'Dinner is ready!',
      timestamp: '6:30 PM',
      sender: 'Mom',
      isSent: false,
      isRead: false,
      encrypted: true
    }
  ]
};

function App() {
  const [selectedContact, setSelectedContact] = useState(null);
  const [contacts, setContacts] = useState(mockContacts);
  const [messages, setMessages] = useState(mockMessages);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [securityEnabled, setSecurityEnabled] = useState(true);
  const [encryptionStatus, setEncryptionStatus] = useState('active');

  // Security initialization
  useEffect(() => {
    if (!window.securityManager) {
      window.securityManager = new SecurityManager();
    }

    // Initialize secure data storage
    const storedContacts = window.securityManager.secureGet('contacts');
    if (storedContacts) {
      setContacts(storedContacts);
    }

    const storedMessages = window.securityManager.secureGet('messages');
    if (storedMessages) {
      setMessages(storedMessages);
    }

    // Set up security monitoring
    const securityInterval = setInterval(() => {
      if (window.securityManager) {
        const report = window.securityManager.getSecurityReport();
        console.log('Security Status:', report);
      }
    }, 30000);

    // Cleanup function
    return () => {
      clearInterval(securityInterval);
    };
  }, []);

  // Global functions for security
  useEffect(() => {
    window.clearSensitiveData = () => {
      setMessages({});
      setContacts([]);
      setSelectedContact(null);
      if (window.securityManager) {
        window.securityManager.clearAllData();
      }
    };

    window.clearAllData = window.clearSensitiveData;
  }, []);

  const sendMessage = (text) => {
    if (!selectedContact || !text.trim()) return;

    // Security: Rate limiting
    if (!window.securityManager.rateLimit('sendMessage', 30, 60000)) {
      alert('Rate limit exceeded. Please wait before sending more messages.');
      return;
    }

    // Security: Input validation and sanitization
    const sanitizedText = window.securityManager.sanitizeInput(text);
    if (!window.securityManager.validateInput(sanitizedText, 'message')) {
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

    // Encrypt message before storing
    const encryptedMessage = {
      ...newMessage,
      text: window.securityManager.encryptData(sanitizedText)
    };

    const updatedMessages = {
      ...messages,
      [selectedContact.id]: [...(messages[selectedContact.id] || []), newMessage]
    };

    setMessages(updatedMessages);

    // Secure storage
    window.securityManager.secureSet('messages', updatedMessages);

    // Update last message in contacts
    const updatedContacts = contacts.map(contact => 
      contact.id === selectedContact.id 
        ? { ...contact, lastMessage: sanitizedText, timestamp: newMessage.timestamp }
        : contact
    );

    setContacts(updatedContacts);
    window.securityManager.secureSet('contacts', updatedContacts);

    // Log security event
    window.securityManager.logSecurityEvent('Message sent', { 
      contactId: selectedContact.id,
      messageLength: sanitizedText.length,
      encrypted: true
    });
  };

  const handleContactSelect = (contact) => {
    // Security: Rate limiting for contact selection
    if (!window.securityManager.rateLimit('selectContact', 100, 60000)) {
      return;
    }

    setSelectedContact(contact);
    
    // Log security event
    window.securityManager.logSecurityEvent('Contact selected', { 
      contactId: contact.id,
      contactName: contact.name 
    });
  };

  const handleSearchChange = (query) => {
    // Security: Sanitize search input
    const sanitizedQuery = window.securityManager.sanitizeInput(query);
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
      sessionSecure: window.securityManager?.sessionId ? true : false,
      lastActivity: window.lastActivity
    };
  };

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
              🛡️ Session: {window.securityManager?.sessionId?.substring(0, 8)}...
            </span>
            <span className="security-indicator anti-tamper" title="Anti-tampering protection active">
              🔐 Protected
            </span>
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
          />
        )}
      </div>
    </div>
  );
}

export default App;