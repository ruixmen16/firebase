// src/App.jsx
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

// Custom hooks
import { useAuth } from './hooks';

// Component imports
import { LoginForm, Header, ChatComponent, Dashboard } from './components';

import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  // Use custom auth hook
  const { user, signInWithGoogle, handleSignOut } = useAuth();

  // If user is not authenticated, show login form
  if (!user) {
    return <LoginForm onSignIn={signInWithGoogle} />;
  }

  // If user is authenticated, show main app
  return (
    <div className="App">
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
      />

      <div style={{ minHeight: '100vh' }}>
        {activeTab === 'chat' && <ChatComponent user={user} />}
        {activeTab === 'dashboard' && <Dashboard user={user} />}
      </div>
    </div>
  );
}

export default App;