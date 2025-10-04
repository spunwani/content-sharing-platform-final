import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { api } from '../config/api';

const UserList = ({ currentUser, onUserFollow }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allUsers = await api.getAllUsers();
      const otherUsers = allUsers.filter(user => user.id !== currentUser.id);
      setUsers(otherUsers);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleFollow = async (targetUserId) => {
    try {
      await api.followUser(currentUser.id, targetUserId);
      onUserFollow(targetUserId);
      loadUsers();
    } catch (err) {
      console.error('Failed to follow user:', err);
    }
  };

  if (loading) {
    return (
      <div className="user-list">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-list">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="user-list">
      <h3>
        <Users size={20} style={{ marginRight: '0.5rem' }} />
        Discover Users
      </h3>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Follow other users to see their posts in your feed
      </p>
      
      <div className="user-grid">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{user.username}</div>
              <div className="user-email">{user.email}</div>
              <div className="user-stats">
                {user.followers_count} followers
              </div>
            </div>
            <button
              className="follow-btn"
              onClick={() => handleFollow(user.id)}
            >
              <UserPlus size={16} />
              Follow
            </button>
          </div>
        ))}
      </div>
      
      {users.length === 0 && (
        <div className="empty-state">
          <p>No other users found. Create another account to test following!</p>
        </div>
      )}
    </div>
  );
};

export default UserList;
