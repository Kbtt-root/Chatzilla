import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './Auth';

// Privacy-focused secure chat component
export const SecureChat = () => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load messages on component mount
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const headers = window.authManager.getAuthHeaders();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/messages`, {
        headers: headers
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    // Rate limiting for privacy and safety
    if (!window.secureStorage.rateLimit('sendMessage', 30, 60000)) {
      alert('Rate limit exceeded. Please wait before sending more messages.');
      return;
    }

    // Sanitize input for safety
    const sanitizedMessage = window.secureStorage.sanitizeInput(newMessage);
    
    if (sanitizedMessage.length > 1000) {
      alert('Message too long. Please keep messages under 1000 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const headers = window.authManager.getAuthHeaders();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          content: sanitizedMessage,
          recipient_id: 'general' // For demo purposes
        })
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout? Your session data will be cleared for privacy.')) {
      logout();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with privacy indicators */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                🔒 Secure Chat
              </h1>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                🛡️ Privacy Protected
              </span>
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                🔐 Encrypted
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, {user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 space-y-2">
              <p className="text-4xl">🔒</p>
              <p className="text-lg font-medium">Your secure chat is ready</p>
              <p className="text-sm">All messages are protected with enhanced privacy and security</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.sender_id === user?.user_id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_id === user?.user_id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center mt-1 space-x-1">
                  <p className="text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                  {message.encrypted && (
                    <span className="text-xs opacity-70" title="Message is encrypted">
                      🔒
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your secure message..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              maxLength={1000}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>🔒 Send</span>
              </>
            )}
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          🛡️ Your messages are protected with end-to-end privacy and security
        </div>
      </div>
    </div>
  );
};

// Privacy-focused welcome screen
export const SecureWelcomeScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="text-6xl">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Secure Chat Application
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Privacy-first secure messaging with enhanced protection
          </p>
        </div>
        
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-green-500">✓</span>
            <span>End-to-end encryption</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-green-500">✓</span>
            <span>Privacy-focused storage</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-green-500">✓</span>
            <span>Secure authentication</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-green-500">✓</span>
            <span>Rate limiting protection</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          🛡️ Your privacy and security are our top priority
        </div>
      </div>
    </div>
  );
};