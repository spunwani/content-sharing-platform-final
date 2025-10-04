// API Configuration
export const API_BASE_URL = 'http://localhost:8000';

// API Helper Functions
export const api = {
  // User endpoints
  createUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users/`);
    return response.json();
  },

  getUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    return response.json();
  },

  followUser: async (userId, targetUserId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/follow/${targetUserId}`, {
      method: 'POST',
    });
    return response.json();
  },

  isFollowingUser: async (userId, targetUserId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/is-following/${targetUserId}`);
    return response.json();
  },

  // Image endpoints
  uploadImage: async (imageData) => {
    const formData = new FormData();
    Object.keys(imageData).forEach(key => {
      formData.append(key, imageData[key]);
    });

    const response = await fetch(`${API_BASE_URL}/images/upload`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  getFeed: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/images/feed/${userId}`);
    return response.json();
  },

  getImage: async (imageId, userId = null) => {
    const url = userId 
      ? `${API_BASE_URL}/images/${imageId}?user_id=${userId}`
      : `${API_BASE_URL}/images/${imageId}`;
    const response = await fetch(url);
    return response.json();
  },

  likeImage: async (imageId, userId) => {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}/like?user_id=${userId}`, {
      method: 'POST',
    });
    return response.json();
  },

  shareImage: async (imageId, userId, autoShare = false) => {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}/share?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_id: imageId,
        auto_share: autoShare,
      }),
    });
    return response.json();
  },

  shareToUser: async (imageId, userId, targetUserId) => {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}/share-to-user?user_id=${userId}&target_user_id=${targetUserId}`, {
      method: 'POST',
    });
    return response.json();
  },

  getSharedPosts: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/images/shared/${userId}`);
    return response.json();
  },

  // Analytics
  getUserAnalytics: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/analytics/${userId}`);
    return response.json();
  },

  getSystemAnalytics: async () => {
    const response = await fetch(`${API_BASE_URL}/analytics/system`);
    return response.json();
  },

  // Health check
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  getFollowingUsers: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/following`);
    return response.json();
  },
};
