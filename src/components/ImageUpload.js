import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Type, FileText } from 'lucide-react';
import { api } from '../config/api';

const ImageUpload = ({ currentUser, onImageUpload }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    is_trial: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const imageData = {
        ...formData,
        uploader_id: currentUser.id
      };

      const newImage = await api.uploadImage(imageData);
      onImageUpload(newImage);
      
      setFormData({ title: '', description: '', image_url: '', is_trial: false });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-section">
      <h3>
        <Upload size={20} style={{ marginRight: '0.5rem' }} />
        Upload New Image
      </h3>
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div>
          <label htmlFor="title" style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: '#555', fontWeight: '500' }}>
            <Type size={16} style={{ marginRight: '0.5rem' }} />
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter image title"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: '#555', fontWeight: '500' }}>
            <FileText size={16} style={{ marginRight: '0.5rem' }} />
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your image"
            required
          />
        </div>
        
        <div>
          <label htmlFor="image_url" style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: '#555', fontWeight: '500' }}>
            <ImageIcon size={16} style={{ marginRight: '0.5rem' }} />
            Image URL
          </label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            required
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            id="is_trial"
            name="is_trial"
            checked={formData.is_trial}
            onChange={handleChange}
            style={{ transform: 'scale(1.2)' }}
          />
          <label htmlFor="is_trial" style={{ color: '#555', fontWeight: '500', cursor: 'pointer' }}>
            🧪 Trial Post (share with non-followers to test content)
          </label>
        </div>
        
        {error && (
          <div className="error">
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ 
            background: '#d4edda', 
            color: '#155724', 
            padding: '0.75rem', 
            borderRadius: '8px',
            border: '1px solid #c3e6cb'
          }}>
            ✅ Image uploaded successfully!
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>
      
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.9rem', color: '#666' }}>
        <strong>Tip:</strong> Use image URLs from services like:
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
          <li>Unsplash: https://unsplash.com</li>
          <li>Pexels: https://pexels.com</li>
          <li>Or any public image URL</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUpload;
