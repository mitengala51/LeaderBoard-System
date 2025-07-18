// App.jsx - Main application entry point
import React from 'react';
import Dashboard from './components/Dashboard';

// Main App component - serves as the root component
const App = () => {
  return (
    <div className="App">
      {/* Load the main Dashboard component */}
      <Dashboard />
    </div>
  );
};

export default App;