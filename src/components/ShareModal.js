import React, { useState, useEffect, useCallback } from 'react';
import { X, Users, Share2 } from 'lucide-react';
import { api } from '../config/api';

const ShareModal = ({ isOpen, onClose, image, currentUser, onShare }) => {
  const [followedUsers, setFollowedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFollowedUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const following = await api.getFollowingUsers(currentUser.id);
      
      if (Array.isArray(following)) {
        // Filter out the original uploader from the list of users to share with
        const filteredFollowing = image && image.uploader_id 
          ? following.filter(user => user.id !== image.uploader_id)
          : following;
        setFollowedUsers(filteredFollowing);
      } else {
        setFollowedUsers([]);
        setError('Invalid response from server');
      }
    } catch (err) {
      setError(`Failed to load followed users: ${err.message}`);
      setFollowedUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, image]);

  useEffect(() => {
    if (isOpen) {
      loadFollowedUsers();
    }
  }, [isOpen, loadFollowedUsers]);

  const handleShareToUser = async (targetUserId) => {
    try {
      await api.shareToUser(image.id, currentUser.id, targetUserId);
      onShare();
      onClose();
    } catch (err) {
      console.error('Failed to share to user:', err);
    }
  };

  const handleAutoShare = async () => {
    try {
      await api.shareImage(image.id, currentUser.id, true);
      onShare();
      onClose();
    } catch (err) {
      console.error('Failed to auto-share:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            <Share2 size={20} style={{ marginRight: '0.5rem' }} />
            Share Image
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="share-options">
            <button 
              className="auto-share-btn"
              onClick={handleAutoShare}
            >
              <Users size={16} />
              Auto-share to all followers
            </button>
          </div>
          
          <div className="followed-users">
            <h4>Share to users you follow:</h4>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : followedUsers.length === 0 ? (
              <div className="no-users">
                No users to share with
                {image.uploader_id === currentUser.id ? (
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                    (You can't share your own post)
                  </div>
                ) : (
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                    (The only user you follow is the original uploader)
                  </div>
                )}
              </div>
            ) : (
              <div className="user-list">
                {followedUsers.map((user) => (
                  <div key={user.id} className="user-item">
                    <div className="user-avatar">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.username}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <button
                      className="share-btn"
                      onClick={() => handleShareToUser(user.id)}
                    >
                      Share
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
