// src/App.jsx
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

// Custom hooks
import { useAuth } from './hooks';

// Component imports
import { LoginForm, Header, Dashboard } from './components';

import './App.css';

function App() {
  // Use custom auth hook
  const { user, signInWithGoogle, handleSignOut, clearBrowserData } = useAuth();

  // If user is not authenticated, show login form
  if (!user) {
    return <LoginForm signInWithGoogle={signInWithGoogle} clearBrowserData={clearBrowserData} />;
  }

  // If user is authenticated, show main app with dashboard
  return (
    <div className="App">
      <Header
        user={user}
        onSignOut={handleSignOut}
      />

      <div style={{ minHeight: '100vh' }}>
        <Dashboard user={user} />
      </div>
    </div>
  );
}

export default App;