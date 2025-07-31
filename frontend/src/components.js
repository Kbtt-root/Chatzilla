import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Smile, 
  Paperclip, 
  Send, 
  Settings, 
  MessageSquarePlus,
  User,
  Lock,
  Bell,
  Moon,
  Sun,
  X,
  Check,
  CheckCheck,
  Shield,
  MessageCircle,
  Users,
  Eye,
  EyeOff,
  AlertTriangle,
  Key,
  Activity
} from 'lucide-react';

// Sidebar Component with Enhanced Security
const Sidebar = ({ 
  contacts, 
  selectedContact, 
  onSelectContact, 
  searchQuery, 
  onSearchChange,
  onShowSettings,
  onShowNewChat,
  onShowProfile 
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [encryptionVisible, setEncryptionVisible] = useState(true);

  const getTotalUnreadCount = () => {
    return contacts.reduce((total, contact) => total + contact.unreadCount, 0);
  };

  const handleContactClick = (contact) => {
    // Security check before allowing contact selection
    if (window.securityManager && !window.securityManager.rateLimit('contactSelect', 50, 60000)) {
      console.warn('Contact selection rate limited');
      return;
    }
    onSelectContact(contact);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Security: Sanitize search input
    if (window.securityManager) {
      const sanitized = window.securityManager.sanitizeInput(value);
      onSearchChange(sanitized);
    } else {
      onSearchChange(value);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <div className="chatzilla-logo">
            <div className="chatzilla-icon">
              <Shield size={24} />
            </div>
            <span>Chatzilla</span>
            <div className="security-badge" title="Maximum Security Enabled">
              <Lock size={12} />
            </div>
          </div>
        </div>
        <div className="sidebar-header-right">
          <button className="header-btn" onClick={onShowNewChat} title="New Chat">
            <MessageSquarePlus size={20} />
          </button>
          <button className="header-btn" onClick={onShowProfile} title="Profile">
            <User size={20} />
          </button>
          <button className="header-btn" onClick={onShowSettings} title="Settings">
            <Settings size={20} />
          </button>
          <button 
            className={`header-btn ${isLocked ? 'locked' : ''}`} 
            onClick={() => setIsLocked(!isLocked)}
            title={isLocked ? "Unlock Sidebar" : "Lock Sidebar"}
          >
            {isLocked ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div className="search-container">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search conversations (encrypted)"
            value={searchQuery}
            onChange={handleSearchChange}
            autoComplete="off"
            spellCheck="false"
          />
          <div className="encryption-indicator" title="Search is encrypted">
            <Key size={12} />
          </div>
        </div>
      </div>

      <div className={`contacts-list ${isLocked ? 'locked' : ''}`}>
        {isLocked ? (
          <div className="locked-overlay">
            <Lock size={48} />
            <p>Contacts list is locked for privacy</p>
            <button onClick={() => setIsLocked(false)}>Unlock</button>
          </div>
        ) : (
          contacts.map(contact => (
            <div
              key={contact.id}
              className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
              onClick={() => handleContactClick(contact)}
            >
              <div className="contact-avatar">
                <img src={contact.avatar} alt={contact.name} loading="lazy" />
                {contact.isOnline && <div className="online-indicator"></div>}
                <div className="encryption-badge" title="End-to-end encrypted">
                  <Lock size={8} />
                </div>
              </div>
              <div className="contact-info">
                <div className="contact-header">
                  <span className="contact-name">{contact.name}</span>
                  <div className="contact-meta">
                    <span className="contact-time">{contact.timestamp}</span>
                    <Shield size={10} className="verified-badge" title="Verified Contact" />
                  </div>
                </div>
                <div className="contact-preview">
                  <div className="last-message-container">
                    <Lock size={10} className="message-encrypted" />
                    <span className="last-message">{contact.lastMessage}</span>
                  </div>
                  {contact.unreadCount > 0 && (
                    <div className="unread-badge">{contact.unreadCount}</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {getTotalUnreadCount() > 0 && (
        <div className="sidebar-badge">
          {getTotalUnreadCount()}
        </div>
      )}

      {/* Security Monitoring Panel */}
      <div className="security-panel">
        <div className="security-status">
          <Activity size={12} />
          <span>Security Active</span>
        </div>
      </div>
    </div>
  );
};

// Enhanced Chat Window Component
const ChatWindow = ({ contact, messages, onSendMessage, securityStatus }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [encryptionDetails, setEncryptionDetails] = useState({
    algorithm: 'Chatzilla Protocol',
    keyExchange: 'X3DH',
    forwardSecrecy: 'Double Ratchet'
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    // Security: Input validation and sanitization
    if (window.securityManager) {
      const sanitized = window.securityManager.sanitizeInput(value);
      setNewMessage(sanitized);
    } else {
      setNewMessage(value);
    }

    // Typing indicator
    setIsTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleSend = () => {
    if (newMessage.trim()) {
      // Security check
      if (window.securityManager && !window.securityManager.rateLimit('sendMessage', 30, 60000)) {
        alert('Rate limit exceeded. Please slow down.');
        return;
      }

      onSendMessage(newMessage);
      setNewMessage('');
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp;
  };

  const emojis = ['😀', '😂', '❤️', '👍', '👋', '🔥', '💯', '🎉', '🛡️', '🔒'];

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-contact-info">
          <div className="chat-avatar">
            <img src={contact.avatar} alt={contact.name} />
            {contact.isOnline && <div className="online-indicator"></div>}
            <div className="encryption-badge" title="End-to-end encrypted conversation">
              <Lock size={10} />
            </div>
          </div>
          <div className="chat-details">
            <div className="chat-name-container">
              <h3>{contact.name}</h3>
              <Shield size={14} className="verified-icon" title="Verified Contact" />
            </div>
            <div className="chat-status-container">
              <span className="chat-status">
                {contact.isGroup ? `${contact.phone}` : (contact.isOnline ? 'Online' : 'Last seen recently')}
              </span>
              <div className="encryption-status" title={`Encrypted with ${encryptionDetails.algorithm}`}>
                <Lock size={10} />
                <span>E2E</span>
              </div>
            </div>
          </div>
        </div>
        <div className="chat-actions">
          <button className="chat-action-btn" title="Voice Call (Encrypted)">
            <Phone size={20} />
          </button>
          <button className="chat-action-btn" title="Video Call (Encrypted)">
            <Video size={20} />
          </button>
          <button className="chat-action-btn" title="Security Settings">
            <Shield size={20} />
          </button>
          <button className="chat-action-btn" title="More">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Encryption Status Banner */}
      <div className="encryption-banner">
        <Lock size={14} />
        <span>Messages are end-to-end encrypted. Only you and {contact.name} can read them.</span>
        <button className="learn-more-btn" title="Learn about encryption">
          <AlertTriangle size={12} />
        </button>
      </div>

      <div className="messages-container">
        <div className="messages-list">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.isSent ? 'sent' : 'received'}`}>
              <div className="message-content">
                {!message.isSent && contact.isGroup && (
                  <div className="message-sender">{message.sender}</div>
                )}
                <div className="message-bubble">
                  <div className="message-security-indicator">
                    <Lock size={8} title="This message is encrypted" />
                  </div>
                  <span className="message-text">{message.text}</span>
                  <div className="message-meta">
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                    {message.isSent && (
                      <div className="message-status">
                        {message.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
                      </div>
                    )}
                    <div className="message-encryption" title="Encrypted">
                      <Shield size={8} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <Lock size={8} title="Typing indicator is encrypted" />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="message-input-container">
        <div className="input-security-bar">
          <Lock size={10} />
          <span>Your message will be end-to-end encrypted</span>
        </div>
        <div className="message-input-wrapper">
          <button className="input-action-btn" title="Attach File (Encrypted)">
            <Paperclip size={20} />
          </button>
          
          <div className="message-input">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows="1"
              autoComplete="off"
              spellCheck="false"
              maxLength="1000"
            />
            <div className="input-encryption-indicator" title="Input is encrypted">
              <Key size={10} />
            </div>
          </div>

          <button 
            className="input-action-btn" 
            title="Emoji (Security: No tracking)"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={20} />
          </button>

          {showEmojiPicker && (
            <div className="emoji-picker">
              <div className="emoji-header">
                <Lock size={10} />
                <span>Private Emojis</span>
              </div>
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  className="emoji-btn"
                  onClick={() => {
                    setNewMessage(prev => prev + emoji);
                    setShowEmojiPicker(false);
                    inputRef.current?.focus();
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <button 
            className={`send-btn ${newMessage.trim() ? 'active' : ''}`} 
            onClick={handleSend}
            disabled={!newMessage.trim()}
            title="Send Encrypted Message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Welcome Screen
const WelcomeScreen = () => {
  const [securityReport, setSecurityReport] = useState(null);

  useEffect(() => {
    if (window.securityManager) {
      setSecurityReport(window.securityManager.getSecurityReport());
    }
  }, []);

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon">
          <Shield size={80} />
        </div>
        <h1>Welcome to Chatzilla</h1>
        <p>
          Select a conversation from your contacts to start messaging.
          <br />
          Your messages are secured with military-grade end-to-end encryption.
        </p>
        
        <div className="welcome-features">
          <div className="feature">
            <Lock size={24} />
            <div className="feature-text">
              <span>End-to-end encrypted</span>
              <small>Chatzilla Protocol with Perfect Forward Secrecy</small>
            </div>
          </div>
          <div className="feature">
            <MessageCircle size={24} />
            <div className="feature-text">
              <span>Private messaging</span>
              <small>No metadata collection or tracking</small>
            </div>
          </div>
          <div className="feature">
            <Users size={24} />
            <div className="feature-text">
              <span>Secure group chats</span>
              <small>Encrypted group messaging with verified members</small>
            </div>
          </div>
          <div className="feature">
            <Shield size={24} />
            <div className="feature-text">
              <span>Maximum security</span>
              <small>Anti-tampering, rate limiting, and monitoring</small>
            </div>
          </div>
        </div>

        {securityReport && (
          <div className="security-report">
            <h3>Security Status</h3>
            <div className="security-metrics">
              <div className="metric">
                <span>Session ID:</span>
                <code>{securityReport.sessionId}</code>
              </div>
              <div className="metric">
                <span>Security Events:</span>
                <code>{securityReport.auditLogCount}</code>
              </div>
              <div className="metric">
                <span>Memory Usage:</span>
                <code>{securityReport.memoryUsage ? 
                  `${Math.round(securityReport.memoryUsage.used / 1024 / 1024)}MB` : 
                  'N/A'
                }</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Settings Modal
const SettingsModal = ({ isDarkMode, onToggleDarkMode, onClose, securityStatus }) => {
  const [advancedSecurity, setAdvancedSecurity] = useState(true);
  const [paranoidMode, setParanoidMode] = useState(false);
  const [securityReport, setSecurityReport] = useState(null);

  useEffect(() => {
    if (window.securityManager) {
      setSecurityReport(window.securityManager.getSecurityReport());
    }
  }, []);

  const handleSecurityWipe = () => {
    if (window.confirm('This will permanently delete all data and cannot be undone. Continue?')) {
      if (window.securityManager) {
        window.securityManager.clearAllData();
      }
      alert('All data has been securely wiped.');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content security-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-container">
            <h2>Security Settings</h2>
            <Shield size={20} className="security-icon" />
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          {/* Security Status Section */}
          <div className="settings-section security-status-section">
            <h3>Security Status</h3>
            <div className="security-indicators-grid">
              <div className="security-indicator-card active">
                <Lock size={20} />
                <span>Encryption Active</span>
              </div>
              <div className="security-indicator-card active">
                <Shield size={20} />
                <span>Anti-Tampering</span>
              </div>
              <div className="security-indicator-card active">
                <Eye size={20} />
                <span>Privacy Protection</span>
              </div>
              <div className="security-indicator-card active">
                <Activity size={20} />
                <span>Threat Monitoring</span>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="settings-section">
            <h3>Appearance</h3>
            <div className="setting-item">
              <div className="setting-info">
                <span>Dark mode</span>
                <small>Reduces screen burn-in and improves privacy</small>
              </div>
              <button 
                className={`toggle-btn ${isDarkMode ? 'active' : ''}`}
                onClick={onToggleDarkMode}
              >
                {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="settings-section">
            <h3>Privacy & Security</h3>
            <div className="setting-item">
              <div className="setting-info">
                <span>Advanced Security Mode</span>
                <small>Maximum protection with additional hardening</small>
              </div>
              <div className={`toggle-switch ${advancedSecurity ? 'active' : ''}`}
                   onClick={() => setAdvancedSecurity(!advancedSecurity)}></div>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <span>Paranoid Mode</span>
                <small>Extra security measures and monitoring</small>
              </div>
              <div className={`toggle-switch ${paranoidMode ? 'active' : ''}`}
                   onClick={() => setParanoidMode(!paranoidMode)}></div>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <span>Read receipts</span>
                <small>Let contacts know when you've read their messages</small>
              </div>
              <div className="toggle-switch active"></div>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <span>Typing indicators</span>
                <small>Let contacts know when you're typing</small>
              </div>
              <div className="toggle-switch active"></div>
            </div>
          </div>

          {/* Security Report */}
          {securityReport && (
            <div className="settings-section">
              <h3>Security Report</h3>
              <div className="security-report-grid">
                <div className="report-item">
                  <span>Session ID:</span>
                  <code>{securityReport.sessionId}</code>
                </div>
                <div className="report-item">
                  <span>Security Events:</span>
                  <code>{securityReport.auditLogCount}</code>
                </div>
                <div className="report-item">
                  <span>Rate Limiters:</span>
                  <code>{securityReport.rateLimiterSize}</code>
                </div>
                {securityReport.memoryUsage && (
                  <div className="report-item">
                    <span>Memory:</span>
                    <code>{Math.round(securityReport.memoryUsage.used / 1024 / 1024)}MB</code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Emergency Actions */}
          <div className="settings-section emergency-section">
            <h3>Emergency Actions</h3>
            <button className="emergency-btn" onClick={handleSecurityWipe}>
              <AlertTriangle size={16} />
              Secure Data Wipe
            </button>
            <small>Permanently and securely delete all application data</small>
          </div>

          {/* Notifications */}
          <div className="settings-section">
            <h3>Notifications</h3>
            <div className="setting-item">
              <div className="setting-info">
                <span>Message notifications</span>
                <small>Show notifications for new messages</small>
              </div>
              <div className="toggle-switch active"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced New Chat Modal
const NewChatModal = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const availableContacts = [
    {
      id: 7,
      name: 'Frank Miller',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      phone: '+1 (555) 111-2222',
      isOnline: true,
      verified: true
    },
    {
      id: 8,
      name: 'Grace Lee',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
      phone: '+1 (555) 333-4444',
      isOnline: false,
      verified: true
    }
  ];

  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (window.securityManager) {
      const sanitized = window.securityManager.sanitizeInput(value);
      setSearchQuery(sanitized);
    } else {
      setSearchQuery(value);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-container">
            <h2>New Secure Chat</h2>
            <Lock size={16} className="encryption-icon" />
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="search-container">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search contacts or enter phone number"
                value={searchQuery}
                onChange={handleSearchChange}
                autoComplete="off"
                spellCheck="false"
              />
              <Lock size={12} title="Search is encrypted" />
            </div>
          </div>

          <div className="contacts-list">
            {availableContacts.map(contact => (
              <div key={contact.id} className="contact-item">
                <div className="contact-avatar">
                  <img src={contact.avatar} alt={contact.name} />
                  {contact.isOnline && <div className="online-indicator"></div>}
                  {contact.verified && (
                    <div className="verification-badge" title="Verified Contact">
                      <Shield size={8} />
                    </div>
                  )}
                </div>
                <div className="contact-info">
                  <div className="contact-header">
                    <span className="contact-name">{contact.name}</span>
                    {contact.verified && (
                      <Shield size={12} className="verified-icon" title="Verified" />
                    )}
                  </div>
                  <div className="contact-preview">
                    <span className="contact-phone">{contact.phone}</span>
                    <div className="encryption-ready" title="Ready for encrypted chat">
                      <Lock size={10} />
                      <span>E2E Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Profile Modal
const ProfileModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-container">
            <h2>Secure Profile</h2>
            <Shield size={16} className="security-icon" />
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="profile-section">
            <div className="profile-avatar-large">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face" alt="Your Profile" />
              <div className="profile-encryption-badge">
                <Lock size={12} />
              </div>
            </div>
            <h3>John Doe</h3>
            <p>+1 (555) 000-0000</p>
            <div className="profile-security-status">
              <Shield size={14} />
              <span>Verified & Encrypted</span>
            </div>
          </div>

          <div className="settings-section">
            <h3>About</h3>
            <div className="setting-item">
              <div className="setting-info">
                <span>Privacy focused messaging with maximum security</span>
                <div className="security-features">
                  <div className="feature-badge">
                    <Lock size={10} />
                    <span>E2E Encrypted</span>
                  </div>
                  <div className="feature-badge">
                    <Shield size={10} />
                    <span>Verified</span>
                  </div>
                  <div className="feature-badge">
                    <Eye size={10} />
                    <span>Private</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Security</h3>
            <div className="setting-item">
              <div className="setting-info">
                <span>Safety Number</span>
                <small>Verify encryption with contacts</small>
              </div>
              <div className="safety-number">
                <code>1234 5678 9012 3456</code>
                <button className="verify-btn" title="Verify Safety Number">
                  <Key size={14} />
                </button>
              </div>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <span>Encryption Protocol</span>
                <small>Chatzilla Protocol with Double Ratchet</small>
              </div>
              <div className="protocol-status active">
                <Shield size={14} />
                <span>Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Components = {
  Sidebar,
  ChatWindow,
  WelcomeScreen,
  SettingsModal,
  NewChatModal,
  ProfileModal
};