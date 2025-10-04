import React from 'react';
import { RefreshCw, LogOut, User } from 'lucide-react';

const Header = ({ currentUser, onLogout, onRefresh }) => {
  const handleRefresh = () => {
    onRefresh();
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <header className="header">
      <h1>📸 Content Sharing Platform</h1>
      
      {currentUser && (
        <div className="user-info">
          <div className="user-avatar">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: '600', color: '#333' }}>
              {currentUser.username}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              {currentUser.email}
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={handleRefresh}
              title="Refresh Feed"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
