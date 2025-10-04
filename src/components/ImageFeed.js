import React from 'react';
import { Heart, Share2, Clock, User, FlaskConical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../config/api';

const ImageFeed = ({ images, currentUser, loading, error, onImageUpdate, onShare }) => {
  const handleLike = async (imageId, isLiked) => {
    try {
      await api.likeImage(imageId, currentUser.id);
      const currentImage = images.find(img => img.id === imageId);
      onImageUpdate(imageId, {
        is_liked: !isLiked,
        likes_count: isLiked ? currentImage.likes_count - 1 : currentImage.likes_count + 1
      });
    } catch (err) {
      console.error('Failed to like image:', err);
    }
  };

  const handleShare = (imageId) => {
    const image = images.find(img => img.id === imageId);
    onShare(image);
  };

  if (loading) {
    return (
      <div className="feed-section">
        <div className="loading">
          <div>Loading images...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-section">
        <div className="error">
          {error}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="feed-section">
        <div className="empty-state">
          <h3>No images yet</h3>
          <p>Upload your first image to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-section">
      <div className="feed-header">
        <h2>Your Feed</h2>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {images.length} image{images.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="image-grid">
        {images.map((image) => (
          <div key={image.id} className={`image-card ${image.is_trial ? 'trial-post' : ''}`}>
            <div className="image-container">
              <img 
                src={image.image_url} 
                alt={image.title}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x200/667eea/ffffff?text=Image+Not+Found';
                }}
              />
            </div>
            
            <div className="image-content">
              <div className="image-header">
                <div>
                  <div className="image-title">
                    {image.title}
                    {image.is_trial && (
                      <span className="trial-badge">
                        <FlaskConical size={12} />
                        Trial
                      </span>
                    )}
                  </div>
                  <div className="image-author">
                    <User size={14} style={{ marginRight: '0.25rem' }} />
                    {image.uploader_username}
                    {image.is_from_non_follower && (
                      <span className="non-follower-indicator">
                        (from someone you don't follow)
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ color: '#999', fontSize: '0.8rem' }}>
                  <Clock size={14} style={{ marginRight: '0.25rem' }} />
                  {formatDistanceToNow(new Date(image.upload_time), { addSuffix: true })}
                </div>
              </div>
              
              <div className="image-description">
                {image.description}
              </div>
              
              <div className="image-actions">
                <div className="action-buttons">
                  <button
                    className={`action-btn ${image.is_liked ? 'liked' : ''}`}
                    onClick={() => handleLike(image.id, image.is_liked)}
                  >
                    <Heart size={16} fill={image.is_liked ? 'currentColor' : 'none'} />
                    {image.likes_count}
                  </button>
                  
                  <button
                    className={`action-btn ${image.is_shared ? 'shared' : ''}`}
                    onClick={() => handleShare(image.id)}
                  >
                    <Share2 size={16} />
                    {image.shares_count}
                  </button>
                </div>
                
                <div className="image-stats">
                  <span>{image.likes_count} like{image.likes_count !== 1 ? 's' : ''}</span>
                  <span>{image.shares_count} share{image.shares_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageFeed;
