// Dashboard.jsx - Main dashboard component that orchestrates all functionality
import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, Star, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

// Import child components
import Leaderboard from './Leaderboard';
import UserSelector from './UserSelector';
import ClaimButton from './ClaimButton';

// Import API functions
import { userAPI, leaderboardAPI, claimAPI } from '../api';

// Notification component for global alerts
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border-l-4 ${bgColor} ${textColor} shadow-lg max-w-md`}>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-auto text-xl hover:opacity-70">×</button>
      </div>
    </div>
  );
};

// Statistics cards component
const StatsCards = ({ stats }) => {
  const statItems = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-500'
    },
    {
      title: 'Total Points',
      value: stats.totalPoints,
      icon: Star,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500'
    },
    {
      title: 'Total Claims',
      value: stats.totalClaims,
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statItems.map((stat, index) => (
        <div key={index} className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${stat.borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-8 h-8 ${stat.textColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  // Main application state
  const [users, setUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPoints: 0,
    totalClaims: 0
  });
  
  //  Separate loading states - only leaderboard initial load shows spinner
  const [loading, setLoading] = useState({
    users: false,
    leaderboard: false, // Only used for initial load
    claiming: false,
    adding: false
  });
  
  // Notification state
  const [notification, setNotification] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Use useRef to track if initial load is complete
  // This prevents race conditions and ensures polling works reliably
  const initialLoadComplete = useRef(false);
  
  // Use useRef to store interval ID for proper cleanup
  const pollingIntervalRef = useRef(null);

  // Centralized leaderboard fetch function with optional loading state
  const fetchLeaderboard = async (showLoading = false) => {
    if (showLoading) {
      setLoading(prev => ({ ...prev, leaderboard: true }));
    }
    
    try {
      const response = await leaderboardAPI.getLeaderboard(10);
      setLeaderboard(response.data.leaderboard || []);
      setLastUpdate(Date.now());
      
      // Mark initial load as complete after first successful fetch
      if (!initialLoadComplete.current) {
        initialLoadComplete.current = true;
        console.log('✅ Initial leaderboard load complete - polling will now start');
      }
      
      return true;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      if (showLoading) {
        showNotification('Failed to load leaderboard', 'error');
      }
      return false;
    } finally {
      if (showLoading) {
        setLoading(prev => ({ ...prev, leaderboard: false }));
      }
    }
  };

  //  Centralized stats fetch function
  const fetchStats = async () => {
    try {
      const response = await userAPI.getStats();
      setStats(response.data || { totalUsers: 0, totalPoints: 0, totalClaims: 0 });
      return true;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return false;
    }
  };

  //  Separate polling function that runs every 3 seconds
  const startPolling = () => {
    // Clear any existing interval first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(async () => {
      // Only poll if initial load is complete
      if (initialLoadComplete.current) {
        console.log('🔄 Polling update - fetching latest data');
        
        // Fetch both leaderboard and stats without loading spinners
        await Promise.all([
          fetchLeaderboard(false), // false = no loading spinner
          fetchStats()
        ]);
      }
    }, 3000); // Poll every 3 seconds
    
    console.log('🚀 Polling started - updates every 3 seconds');
  };

  //  Cleanup function to stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('🛑 Polling stopped');
    }
  };

  //  Initialize dashboard data on component mount
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🎯 Initializing app - loading initial data');
      
      try {
        // Load initial data with loading spinners
        await Promise.all([
          fetchUsers(),
          fetchLeaderboard(true), // true = show loading spinner
          fetchStats()
        ]);
        
        // Start polling after initial load is complete
        startPolling();
        
      } catch (error) {
        console.error('Error during app initialization:', error);
        showNotification('Failed to load application data', 'error');
      }
    };

    initializeApp();
    
    //  Cleanup function runs when component unmounts
    return () => {
      stopPolling();
    };
  }, []); // Empty dependency array - runs once on mount

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data.users || []);
      return true;
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Failed to load users', 'error');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // Handle adding new user
  const handleAddUser = async (userData) => {
    setLoading(prev => ({ ...prev, adding: true }));
    try {
      await userAPI.addUser(userData);
      
      //  Refresh users and stats after adding user
      await Promise.all([
        fetchUsers(),
        fetchStats()
      ]);
      
      showNotification(`User ${userData.name} added successfully!`, 'success');
      return true;
    } catch (error) {
      console.error('Error adding user:', error);
      showNotification(error.response?.data?.message || 'Failed to add user', 'error');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, adding: false }));
    }
  };

  // Handle claiming points for user
  const handleClaimPoints = async (userId, points) => {
    setLoading(prev => ({ ...prev, claiming: true }));
    try {
      await claimAPI.claimPoints({
        userId: userId,
        points: points,
        claimType: 'random'
      });

      //  Immediately refresh leaderboard and stats after claiming
      // Show loading for leaderboard since user expects immediate feedback
      await Promise.all([
        fetchLeaderboard(true), // true = show loading spinner for user feedback
        fetchStats()
      ]);
      
      showNotification(`${points} points claimed successfully!`, 'success');
      return true;
    } catch (error) {
      console.error('Error claiming points:', error);
      showNotification(error.response?.data?.message || 'Failed to claim points', 'error');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, claiming: false }));
    }
  };

  // Show notification helper
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Close notification helper
  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Global notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-800">Leaderboard System</h1>
          </div>
          <p className="text-gray-600 text-lg">Track progress, claim points, and compete!</p>
        </div>

        {/* Statistics Cards */}
        <StatsCards stats={stats} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Points Claiming Component */}
            <ClaimButton
              selectedUser={selectedUser}
              users={users}
              onClaimPoints={handleClaimPoints}
              loading={loading.claiming}
            />

            {/* User Selection and Addition Component */}
            <UserSelector
              users={users}
              selectedUser={selectedUser}
              onUserSelect={setSelectedUser}
              onAddUser={handleAddUser}
              loading={loading.adding}
            />
          </div>

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-2">
            <Leaderboard
              leaderboard={leaderboard}
              loading={loading.leaderboard} // Only shows loading on initial load
              lastUpdate={lastUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;