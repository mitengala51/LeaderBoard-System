// UserSelector.jsx - Component for selecting users and adding new ones
import React, { useState } from 'react';
import { Users, Plus, CheckCircle, AlertCircle } from 'lucide-react';

const UserSelector = ({ users, selectedUser, onUserSelect, onAddUser, loading }) => {
  // State for add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [notification, setNotification] = useState(null);

  // Handle form submission for adding new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!newUser.name.trim() || !newUser.email.trim()) {
      setNotification({ type: 'error', message: 'Both name and email are required' });
      return;
    }

    // Call parent function to add user
    const success = await onAddUser({ 
      name: newUser.name.trim(), 
      email: newUser.email.trim() 
    });

    if (success) {
      // Reset form on success
      setNewUser({ name: '', email: '' });
      setShowAddForm(false);
      setNotification({ type: 'success', message: 'User added successfully!' });
    } else {
      setNotification({ type: 'error', message: 'Failed to add user' });
    }

    // Clear notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle form cancellation
  const handleCancel = () => {
    setNewUser({ name: '', email: '' });
    setShowAddForm(false);
    setNotification(null);
  };

  return (
    <div className="space-y-6">
      {/* User Selection Dropdown */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Select User
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose a user to claim points for
          </label>
          <select
            value={selectedUser}
            onChange={(e) => onUserSelect(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            disabled={loading}
          >
            <option value="">Select a user...</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.totalPoints} pts)
              </option>
            ))}
          </select>
        </div>

        {/* Show selected user info */}
        {selectedUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              ✓ Selected: {users.find(u => u._id === selectedUser)?.name}
            </p>
          </div>
        )}
      </div>

      {/* Add New User Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-green-500" />
          Add New User
        </h2>
        
        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-3 rounded-lg border-l-4 flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-700' 
              : 'bg-red-50 border-red-500 text-red-700'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}

        {!showAddForm ? (
          // Show add user button
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New User
          </button>
        ) : (
          // Show add user form
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Enter user name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email address"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !newUser.name.trim() || !newUser.email.trim()}
                className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Add User'
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserSelector;