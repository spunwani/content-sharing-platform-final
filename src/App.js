import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import UserSetup from './components/UserSetup';
import ImageFeed from './components/ImageFeed';
import ImageUpload from './components/ImageUpload';
import UserList from './components/UserList';
import ShareModal from './components/ShareModal';
import { FlaskConical } from 'lucide-react';
import { API_BASE_URL } from './config/api';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [images, setImages] = useState([]);
  const [sharedPosts, setSharedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [shareModal, setShareModal] = useState({ isOpen: false, image: null });

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const loadImages = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/images/feed/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      } else {
        throw new Error('Failed to load images');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const loadSharedPosts = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/images/shared/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setSharedPosts(data);
      }
    } catch (err) {
      console.error('Failed to load shared posts:', err);
    }
  }, [currentUser]);

  // Load images when user is set
  useEffect(() => {
    if (currentUser) {
      loadImages();
      loadSharedPosts();
    }
  }, [currentUser, loadImages, loadSharedPosts]);

  const handleUserLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    setImages([]);
    setSharedPosts([]);
    localStorage.removeItem('currentUser');
  };

  const handleImageUpload = useCallback((newImage) => {
    setImages(prevImages => [newImage, ...prevImages]);
  }, []);

  const handleImageUpdate = useCallback((imageId, updatedImage) => {
    setImages(prevImages => 
      prevImages.map(img => 
        img.id === imageId ? { ...img, ...updatedImage } : img
      )
    );
  }, []);

  const handleUserFollow = useCallback((targetUserId) => {
    loadImages();
  }, [loadImages]);

  const handleShare = useCallback((image) => {
    setShareModal({ isOpen: true, image });
  }, []);

  const handleShareComplete = useCallback(() => {
    loadSharedPosts();
  }, [loadSharedPosts]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'shared' && currentUser) {
      loadSharedPosts();
    }
  };

  return (
    <div className="App">
      <Header 
        currentUser={currentUser} 
        onLogout={handleUserLogout}
        onRefresh={loadImages}
      />
      
      <main className="main-content">
        {!currentUser ? (
          <UserSetup onUserLogin={handleUserLogin} />
        ) : (
          <div className="app-content">
            <div className="content-grid">
              <div className="feed-section">
                <div className="tab-navigation">
                  <button 
                    className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
                    onClick={() => handleTabChange('feed')}
                  >
                    📸 Feed
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
                    onClick={() => handleTabChange('discover')}
                  >
                    👥 Discover
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'shared' ? 'active' : ''}`}
                    onClick={() => handleTabChange('shared')}
                  >
                    📤 Shared
                  </button>
                </div>
                
                {activeTab === 'feed' ? (
                  <ImageFeed 
                    images={images}
                    currentUser={currentUser}
                    loading={loading}
                    error={error}
                    onImageUpdate={handleImageUpdate}
                    onShare={handleShare}
                  />
                ) : activeTab === 'discover' ? (
                  <UserList 
                    currentUser={currentUser}
                    onUserFollow={handleUserFollow}
                  />
                ) : (
                  <div className="shared-posts">
                    <h3>Shared Posts</h3>
                    {sharedPosts.length === 0 ? (
                      <div className="empty-state">
                        <p>No shared posts yet</p>
                      </div>
                    ) : (
                      <div className="image-grid">
                        {sharedPosts.map((post) => (
                          <div key={post.id} className={`image-card ${post.is_trial ? 'trial-post' : ''}`}>
                            <div className="image-container">
                              <img 
                                src={post.image_url} 
                                alt={post.title}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/400x200/667eea/ffffff?text=Image+Not+Found';
                                }}
                              />
                            </div>
                            <div className="image-content">
                              <div className="image-header">
                                <div>
                                  <div className="image-title">
                                    {post.title}
                                    {post.is_trial && (
                                      <span className="trial-badge">
                                        <FlaskConical size={12} />
                                        Trial
                                      </span>
                                    )}
                                  </div>
                                  <div className="image-author">
                                    👤 {post.uploader_username}
                                  </div>
                                  <div className="shared-by">
                                    📤 Shared by {post.shared_by_username}
                                  </div>
                                </div>
                              </div>
                              <div className="image-description">
                                {post.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="upload-section">
                <ImageUpload 
                  currentUser={currentUser}
                  onImageUpload={handleImageUpload}
                />
              </div>
            </div>
          </div>
        )}
      </main>
      
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, image: null })}
        image={shareModal.image}
        currentUser={currentUser}
        onShare={handleShareComplete}
      />
    </div>
  );
}

export default App;
