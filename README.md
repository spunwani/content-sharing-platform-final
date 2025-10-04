# Content Sharing Platform

A modern social media application built with React and FastAPI that allows users to share images, follow each other, and discover content through personalized feeds. Features unique "trial posts" functionality for content creators to test content with non-followers.

## Features

### User Management
- User registration and authentication
- Follow/unfollow system
- User discovery and profiles

### Content Sharing
- Image upload with title and description
- **Trial Posts**: Share content with non-followers to test engagement
- Personalized feeds based on followed users
- Like and share functionality

### Social Features
- Follow other users to see their content
- Auto-share to all followers (excluding original uploader)
- Individual sharing to specific users
- Shared posts section showing content shared with you

### Analytics & Logging
- User interaction logging
- Analytics endpoints for user and system metrics
- Health check endpoint

## Architecture

### Frontend (React)
- **React 18** with functional components and hooks
- **Lucide React** for modern icons
- **date-fns** for date formatting
- Responsive design with CSS Grid and Flexbox
- Local storage for user persistence

### Backend (FastAPI)
- **Python FastAPI** server with in-memory data storage
- **Pydantic** for data validation
- **CORS** enabled for frontend integration
- Comprehensive logging system
- RESTful API design

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/spunwani/content-sharing-platform-final.git
   cd content-sharing-platform-final
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   python mil.py
   ```
   The API will be available at `http://localhost:8000`

2. **Start the frontend** (in a new terminal)
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`

## Trial Posts Feature

The platform includes a unique "trial posts" feature inspired by Instagram's content testing:

- **Regular Posts**: Visible to followers and the uploader
- **Trial Posts**: Visible only to users who DON'T follow the uploader
- **Use Case**: Content creators can test content with a broader audience before sharing with their followers

### How Trial Posts Work:
1. Upload an image and check "Trial Post"
2. The post appears in feeds of users who don't follow you
3. Perfect for testing content before sharing with your audience

## Project Structure

```
├── mil.py                    # FastAPI backend server
├── requirements.txt          # Python dependencies
├── package.json             # Node.js dependencies
├── src/
│   ├── App.js              # Main React component
│   ├── App.css             # Main styles
│   ├── index.js            # React entry point
│   ├── config/api.js       # API configuration
│   └── components/
│       ├── Header.js       # Navigation header
│       ├── UserSetup.js    # User registration
│       ├── ImageFeed.js    # Image display and interactions
│       ├── ImageUpload.js  # Image upload form
│       ├── UserList.js     # User discovery
│       └── ShareModal.js   # Sharing interface
└── public/
    ├── index.html          # HTML template
    └── manifest.json       # PWA manifest
```

## API Endpoints

### Users
- `POST /users/` - Create user
- `GET /users/` - Get all users
- `GET /users/{user_id}` - Get user details
- `POST /users/{user_id}/follow/{target_user_id}` - Follow user
- `GET /users/{user_id}/following` - Get following users

### Images
- `POST /images/upload` - Upload image (supports trial posts)
- `GET /images/feed/{user_id}` - Get personalized feed
- `GET /images/{image_id}` - Get image details
- `POST /images/{image_id}/like` - Like/unlike image
- `POST /images/{image_id}/share` - Share image (auto-share)
- `POST /images/{image_id}/share-to-user` - Share to specific user
- `GET /images/shared/{user_id}` - Get shared posts

### Analytics
- `GET /analytics/{user_id}` - User analytics
- `GET /analytics/system` - System analytics
- `GET /health` - Health check

## Key Features Explained

### Personalized Feed Algorithm
The feed shows:
1. **Your own posts** (trial or regular)
2. **Followed users' regular posts** (not trial posts)
3. **Trial posts from non-followers**

### Smart Sharing
- **Auto-share**: Shares to all followers except original uploader
- **Individual share**: Excludes original uploader from options
- **Duplicate prevention**: Can't share the same content twice to the same user

### Trial Post Logic
```python
# Include image if:
# 1. It's your own image, OR
# 2. It's from someone you follow AND it's NOT a trial post, OR  
# 3. It's a trial post from someone you DON'T follow
```

---
