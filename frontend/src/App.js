import React, { useEffect, useState } from 'react';
import './App.css';
import { AuthProvider, useAuth, AuthPage } from './Auth';
import { SecureChat, SecureWelcomeScreen } from './SecureChat';
import './SecureStorage'; // Import to initialize secure storage

// Main App component with enhanced privacy and security
function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Set dark mode based on system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    // Apply dark mode to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <div className="text-lg font-medium text-gray-900 dark:text-white">
            Loading Secure Chat...
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Initializing privacy protections
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <SecureChat />
      
      {/* Dark mode toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed bottom-4 right-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        title="Toggle dark mode"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize security logging
    console.info('🔒 Secure Chat Application initialized with enhanced privacy protection');
    console.info('🛡️ Security features: JWT auth, input sanitization, rate limiting, secure storage');
    console.info('🔐 Privacy features: session-based storage, automatic cleanup, data encryption');
  }, []);

  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;