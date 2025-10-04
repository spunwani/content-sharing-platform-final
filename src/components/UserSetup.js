import React, { useState } from 'react';
import { User, Mail } from 'lucide-react';
import { api } from '../config/api';

const UserSetup = ({ onUserLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await api.createUser(formData);
      onUserLogin(user);
    } catch (err) {
      setError('Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-setup">
      <h2>Welcome to Content Sharing Platform</h2>
      <p className="text-center mb-2" style={{ color: '#666' }}>
        Create your account to start sharing amazing content!
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">
            <User size={16} style={{ marginRight: '0.5rem' }} />
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">
            <Mail size={16} style={{ marginRight: '0.5rem' }} />
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </div>
        
        {error && (
          <div className="error">
            {error}
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

export default UserSetup;
