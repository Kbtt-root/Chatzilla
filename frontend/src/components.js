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
  Users
} from 'lucide-react';

// Sidebar Component
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
  const getTotalUnreadCount = () => {
    return contacts.reduce((total, contact) => total + contact.unreadCount, 0);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <div className="signal-logo">
            <div className="signal-icon">
              <Shield size={24} />
            </div>
            <span>Signal</span>
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
        </div>
      </div>

      <div className="search-container">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="contacts-list">
        {contacts.map(contact => (
          <div
            key={contact.id}
            className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
            onClick={() => onSelectContact(contact)}
          >
            <div className="contact-avatar">
              <img src={contact.avatar} alt={contact.name} />
              {contact.isOnline && <div className="online-indicator"></div>}
            </div>
            <div className="contact-info">
              <div className="contact-header">
                <span className="contact-name">{contact.name}</span>
                <span className="contact-time">{contact.timestamp}</span>
              </div>
              <div className="contact-preview">
                <span className="last-message">{contact.lastMessage}</span>
                {contact.unreadCount > 0 && (
                  <div className="unread-badge">{contact.unreadCount}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {getTotalUnreadCount() > 0 && (
        <div className="sidebar-badge">
          {getTotalUnreadCount()}
        </div>
      )}
    </div>
  );
};

// Chat Window Component
const ChatWindow = ({ contact, messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
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

  const emojis = ['😀', '😂', '❤️', '👍', '👋', '🔥', '💯', '🎉'];

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-contact-info">
          <div className="chat-avatar">
            <img src={contact.avatar} alt={contact.name} />
            {contact.isOnline && <div className="online-indicator"></div>}
          </div>
          <div className="chat-details">
            <h3>{contact.name}</h3>
            <span className="chat-status">
              {contact.isGroup ? `${contact.phone}` : (contact.isOnline ? 'Online' : 'Last seen recently')}
            </span>
          </div>
        </div>
        <div className="chat-actions">
          <button className="chat-action-btn" title="Voice Call">
            <Phone size={20} />
          </button>
          <button className="chat-action-btn" title="Video Call">
            <Video size={20} />
          </button>
          <button className="chat-action-btn" title="More">
            <MoreVertical size={20} />
          </button>
        </div>
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
                  <span className="message-text">{message.text}</span>
                  <div className="message-meta">
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                    {message.isSent && (
                      <div className="message-status">
                        {message.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="message-input-container">
        <div className="message-input-wrapper">
          <button className="input-action-btn" title="Attach File">
            <Paperclip size={20} />
          </button>
          
          <div className="message-input">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows="1"
            />
          </div>

          <button 
            className="input-action-btn" 
            title="Emoji"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={20} />
          </button>

          {showEmojiPicker && (
            <div className="emoji-picker">
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
            title="Send Message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Welcome Screen Component
const WelcomeScreen = () => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon">
          <Shield size={80} />
        </div>
        <h1>Welcome to Signal</h1>
        <p>
          Select a conversation from your contacts to start messaging.
          <br />
          Your messages are secured with end-to-end encryption.
        </p>
        <div className="welcome-features">
          <div className="feature">
            <Lock size={24} />
            <span>End-to-end encrypted</span>
          </div>
          <div className="feature">
            <MessageCircle size={24} />
            <span>Private messaging</span>
          </div>
          <div className="feature">
            <Users size={24} />
            <span>Group chats</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings Modal Component
const SettingsModal = ({ isDarkMode, onToggleDarkMode, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="settings-section">
            <h3>Appearance</h3>
            <div className="setting-item">
              <div className="setting-info">
                <span>Dark mode</span>
                <small>Toggle dark/light theme</small>
              </div>
              <button 
                className={`toggle-btn ${isDarkMode ? 'active' : ''}`}
                onClick={onToggleDarkMode}
              >
                {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3>Privacy & Security</h3>
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

// New Chat Modal Component
const NewChatModal = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const availableContacts = [
    {
      id: 7,
      name: 'Frank Miller',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      phone: '+1 (555) 111-2222',
      isOnline: true
    },
    {
      id: 8,
      name: 'Grace Lee',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
      phone: '+1 (555) 333-4444',
      isOnline: false
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Chat</h2>
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="contacts-list">
            {availableContacts.map(contact => (
              <div key={contact.id} className="contact-item">
                <div className="contact-avatar">
                  <img src={contact.avatar} alt={contact.name} />
                  {contact.isOnline && <div className="online-indicator"></div>}
                </div>
                <div className="contact-info">
                  <div className="contact-header">
                    <span className="contact-name">{contact.name}</span>
                  </div>
                  <div className="contact-preview">
                    <span className="contact-phone">{contact.phone}</span>
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

// Profile Modal Component
const ProfileModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Profile</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="profile-section">
            <div className="profile-avatar-large">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face" alt="Your Profile" />
            </div>
            <h3>John Doe</h3>
            <p>+1 (555) 000-0000</p>
          </div>

          <div className="settings-section">
            <h3>About</h3>
            <div className="setting-item">
              <div className="setting-info">
                <span>Privacy focused messaging</span>
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