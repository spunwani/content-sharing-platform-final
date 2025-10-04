from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import logging
import uuid
from collections import defaultdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('public/user_interactions.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Content Sharing Platform API", version="1.0.0")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory data structures
users: Dict[str, Dict[str, Any]] = {}
images: Dict[str, Dict[str, Any]] = {}
followers: Dict[str, List[str]] = defaultdict(list)  # user_id -> list of follower_ids
likes: Dict[str, List[str]] = defaultdict(list)  # image_id -> list of user_ids who liked
shares: Dict[str, List[str]] = defaultdict(list)  # image_id -> list of user_ids who shared
user_interactions: List[Dict[str, Any]] = []

# Add shared posts storage
shared_posts: Dict[str, List[Dict[str, Any]]] = defaultdict(list)  # user_id -> list of shared posts

# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: str

class ImageUpload(BaseModel):
    title: str
    description: str
    image_url: str
    is_trial: bool = False

class ImageResponse(BaseModel):
    id: str
    title: str
    description: str
    image_url: str
    uploader_id: str
    uploader_username: str
    upload_time: datetime
    likes_count: int
    shares_count: int
    is_liked: bool = False
    is_shared: bool = False
    is_trial: bool = False
    is_from_non_follower: bool = False

class ShareRequest(BaseModel):
    image_id: str
    auto_share: bool = False

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    followers_count: int
    following_count: int

# Helper functions
def log_interaction(user_id: str, action: str, details: Dict[str, Any]):
    """Log user interactions for analytics"""
    interaction = {
        "timestamp": datetime.now().isoformat(),
        "user_id": user_id,
        "action": action,
        "details": details
    }
    user_interactions.append(interaction)
    logger.info(f"User {user_id} performed {action}: {details}")

def get_user_feed(user_id: str, limit: int = 20) -> List[ImageResponse]:
    """Get personalized feed for user based on followers and trial posts"""
    user_following = set(uid for uid, followers_list in followers.items() if user_id in followers_list)
    
    # Efficiently filter and sort images in one pass
    relevant_images = []
    for image in images.values():
        uploader_id = image["uploader_id"]
        is_followed_user = uploader_id in user_following
        is_own_image = uploader_id == user_id
        is_trial_post = image.get("is_trial", False)
        
        # Include image if: own image OR (followed user AND not trial) OR (trial AND not followed)
        if (is_own_image or 
            (is_followed_user and not is_trial_post) or 
            (is_trial_post and not is_followed_user and not is_own_image)):
            relevant_images.append(image)
    
    # Sort by upload time (most recent first) and limit results
    relevant_images.sort(key=lambda x: x["upload_time"], reverse=True)
    relevant_images = relevant_images[:limit]
    
    # Convert to response format efficiently
    feed = []
    for image in relevant_images:
        uploader_id = image["uploader_id"]
        image_id = image["id"]
        is_followed_user = uploader_id in user_following
        is_own_image = uploader_id == user_id
        is_trial_post = image.get("is_trial", False)
        
        feed.append(ImageResponse(
            id=image_id,
            title=image["title"],
            description=image["description"],
            image_url=image["image_url"],
            uploader_id=uploader_id,
            uploader_username=users[uploader_id]["username"],
            upload_time=image["upload_time"],
            likes_count=len(likes[image_id]),
            shares_count=len(shares[image_id]),
            is_liked=user_id in likes[image_id],
            is_shared=user_id in shares[image_id],
            is_trial=is_trial_post,
            is_from_non_follower=is_trial_post and not is_followed_user and not is_own_image
        ))
    
    return feed

# API Endpoints

@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate):
    """Create a new user"""
    user_id = str(uuid.uuid4())
    users[user_id] = {
        "id": user_id,
        "username": user.username,
        "email": user.email,
        "created_at": datetime.now()
    }
    
    log_interaction(user_id, "user_created", {"username": user.username})
    
    return UserResponse(
        id=user_id,
        username=user.username,
        email=user.email,
        followers_count=0,
        following_count=0
    )

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get user information"""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users[user_id]
    return UserResponse(
        id=user_id,
        username=user["username"],
        email=user["email"],
        followers_count=len(followers[user_id]),
        following_count=len([uid for uid, followers_list in followers.items() if user_id in followers_list])
    )

@app.get("/users/", response_model=List[UserResponse])
async def get_all_users():
    """Get all users"""
    user_list = []
    for user_id, user_data in users.items():
        user_list.append(UserResponse(
            id=user_id,
            username=user_data["username"],
            email=user_data["email"],
            followers_count=len(followers[user_id]),
            following_count=len([uid for uid, followers_list in followers.items() if user_id in followers_list])
        ))
    return user_list

@app.post("/users/{user_id}/follow/{target_user_id}")
async def toggle_follow_user(user_id: str, target_user_id: str):
    """Follow or unfollow another user"""
    if user_id not in users or target_user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_id == target_user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    if user_id in followers[target_user_id]:
        # Unfollow: remove from followers list
        followers[target_user_id].remove(user_id)
        log_interaction(user_id, "unfollow", {"target_user_id": target_user_id})
        return {"message": f"Successfully unfollowed user {target_user_id}", "action": "unfollowed"}
    else:
        # Follow: add to followers list
        followers[target_user_id].append(user_id)
        log_interaction(user_id, "follow", {"target_user_id": target_user_id})
        return {"message": f"Successfully followed user {target_user_id}", "action": "followed"}

@app.post("/images/upload", response_model=ImageResponse)
async def upload_image(
    title: str = Form(...),
    description: str = Form(...),
    image_url: str = Form(...),
    uploader_id: str = Form(...),
    is_trial: str = Form("false")
):
    """Upload a new image"""
    if uploader_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert string to boolean
    is_trial_bool = is_trial.lower() in ['true', '1', 'yes', 'on']
    
    image_id = str(uuid.uuid4())
    image_data = {
        "id": image_id,
        "title": title,
        "description": description,
        "image_url": image_url,
        "uploader_id": uploader_id,
        "upload_time": datetime.now(),
        "is_trial": is_trial_bool
    }
    
    images[image_id] = image_data
    
    log_interaction(uploader_id, "image_upload", {
        "image_id": image_id,
        "title": title,
        "is_trial": is_trial_bool
    })
    
    return ImageResponse(
        id=image_id,
        title=title,
        description=description,
        image_url=image_url,
        uploader_id=uploader_id,
        uploader_username=users[uploader_id]["username"],
        upload_time=image_data["upload_time"],
        likes_count=0,
        shares_count=0,
        is_trial=is_trial_bool,
        is_from_non_follower=False  # For the uploader, it's their own post
    )

@app.get("/images/feed/{user_id}", response_model=List[ImageResponse])
async def get_feed(user_id: str, limit: int = 20):
    """Get personalized feed for user"""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    log_interaction(user_id, "feed_view", {"limit": limit})
    return get_user_feed(user_id, limit)

@app.get("/images/{image_id}", response_model=ImageResponse)
async def get_image(image_id: str, user_id: Optional[str] = None):
    """Get specific image details"""
    if image_id not in images:
        raise HTTPException(status_code=404, detail="Image not found")
    
    image = images[image_id]
    is_liked = user_id in likes[image_id] if user_id else False
    is_shared = user_id in shares[image_id] if user_id else False
    is_trial = image.get("is_trial", False)
    
    # Check if this is from a non-follower (for trial posts)
    is_from_non_follower = False
    if user_id and is_trial:
        user_following = [uid for uid, followers_list in followers.items() if user_id in followers_list]
        is_from_non_follower = image["uploader_id"] not in user_following and image["uploader_id"] != user_id
    
    return ImageResponse(
        id=image["id"],
        title=image["title"],
        description=image["description"],
        image_url=image["image_url"],
        uploader_id=image["uploader_id"],
        uploader_username=users[image["uploader_id"]]["username"],
        upload_time=image["upload_time"],
        likes_count=len(likes[image_id]),
        shares_count=len(shares[image_id]),
        is_liked=is_liked,
        is_shared=is_shared,
        is_trial=is_trial,
        is_from_non_follower=is_from_non_follower
    )

@app.post("/images/{image_id}/like")
async def like_image(image_id: str, user_id: str):
    """Like an image"""
    if image_id not in images:
        raise HTTPException(status_code=404, detail="Image not found")
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_id not in likes[image_id]:
        likes[image_id].append(user_id)
        log_interaction(user_id, "like", {"image_id": image_id})
        return {"message": "Image liked successfully"}
    else:
        likes[image_id].remove(user_id)
        log_interaction(user_id, "unlike", {"image_id": image_id})
        return {"message": "Image unliked successfully"}

@app.post("/images/{image_id}/share")
async def share_image(image_id: str, user_id: str, share_request: ShareRequest):
    """Share an image with followers"""
    if image_id not in images:
        raise HTTPException(status_code=404, detail="Image not found")
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    log_interaction(user_id, "share", {
        "image_id": image_id,
        "auto_share": share_request.auto_share
    })
    
    # Auto-share to people you follow if enabled
    if share_request.auto_share:
        # Get people that the user follows, excluding the original uploader
        following_users = [
            target_user_id for target_user_id, followers_list in followers.items()
            if user_id in followers_list and target_user_id != images[image_id]["uploader_id"]
        ]
        
        log_interaction(user_id, "auto_share", {
            "image_id": image_id,
            "following_notified": len(following_users)
        })
        
        # Add to followed users' shared posts (check for duplicates)
        shared_count = 0
        for target_user_id in following_users:
            # Check if already shared to this user
            already_shared = any(
                shared_post["image_id"] == image_id and shared_post["shared_by"] == user_id
                for shared_post in shared_posts[target_user_id]
            )
            
            if not already_shared:
                shared_posts[target_user_id].append({
                    "image_id": image_id,
                    "shared_by": user_id,
                    "shared_at": datetime.now(),
                    "original_uploader": images[image_id]["uploader_id"]
                })
                shared_count += 1
        
        # Add user to shares list for each successful share
        for _ in range(shared_count):
            shares[image_id].append(user_id)
    else:
        # For regular share (not auto-share), just add user once
        shares[image_id].append(user_id)
    
    return {"message": "Image shared successfully"}

@app.post("/images/{image_id}/share-to-user")
async def share_to_user(
    image_id: str, 
    user_id: str = Query(...), 
    target_user_id: str = Query(...)
):
    """Share an image to a specific user"""
    if image_id not in images:
        raise HTTPException(status_code=404, detail="Image not found")
    if user_id not in users or target_user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user follows target user
    if user_id not in followers[target_user_id]:
        raise HTTPException(status_code=400, detail="You can only share to users you follow")
    
    # Check if already shared to this user
    already_shared = any(
        shared_post["image_id"] == image_id and shared_post["shared_by"] == user_id
        for shared_post in shared_posts[target_user_id]
    )
    
    if already_shared:
        raise HTTPException(status_code=400, detail="Image already shared to this user")
    
    # Add to shares list and target user's shared posts
    shares[image_id].append(user_id)
    shared_posts[target_user_id].append({
        "image_id": image_id,
        "shared_by": user_id,
        "shared_at": datetime.now(),
        "original_uploader": images[image_id]["uploader_id"]
    })
    
    log_interaction(user_id, "share_to_user", {
        "image_id": image_id,
        "target_user_id": target_user_id
    })
    
    return {"message": f"Image shared to {users[target_user_id]['username']}"}

@app.get("/images/shared/{user_id}")
async def get_shared_posts(user_id: str):
    """Get shared posts for a user"""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    shared_posts_list = []
    for shared_post in shared_posts[user_id]:
        image = images[shared_post["image_id"]]
        shared_posts_list.append({
            "id": image["id"],
            "title": image["title"],
            "description": image["description"],
            "image_url": image["image_url"],
            "uploader_id": image["uploader_id"],
            "uploader_username": users[image["uploader_id"]]["username"],
            "upload_time": image["upload_time"],
            "shared_by": shared_post["shared_by"],
            "shared_by_username": users[shared_post["shared_by"]]["username"],
            "shared_at": shared_post["shared_at"],
            "likes_count": len(likes[image["id"]]),
            "shares_count": len(shares[image["id"]]),
            "is_liked": user_id in likes[image["id"]],
            "is_shared": user_id in shares[image["id"]]
        })
    
    # Sort by most recent shared
    shared_posts_list.sort(key=lambda x: x["shared_at"], reverse=True)
    
    return shared_posts_list

@app.get("/images/{image_id}/likes")
async def get_image_likes(image_id: str):
    """Get list of users who liked an image"""
    if image_id not in images:
        raise HTTPException(status_code=404, detail="Image not found")
    
    liked_users = []
    for user_id in likes[image_id]:
        if user_id in users:
            liked_users.append({
                "user_id": user_id,
                "username": users[user_id]["username"]
            })
    
    return {"likes": liked_users, "count": len(liked_users)}

@app.get("/analytics/{user_id}")
async def get_user_analytics(user_id: str):
    """Get analytics for a user"""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's interactions
    user_actions = [action for action in user_interactions if action["user_id"] == user_id]
    
    # Get user's images
    user_images = [img for img in images.values() if img["uploader_id"] == user_id]
    
    # Calculate metrics
    total_likes = sum(len(likes[img["id"]]) for img in user_images)
    total_shares = sum(len(shares[img["id"]]) for img in user_images)
    
    return {
        "user_id": user_id,
        "username": users[user_id]["username"],
        "total_images": len(user_images),
        "total_likes_received": total_likes,
        "total_shares_received": total_shares,
        "followers_count": len(followers[user_id]),
        "following_count": len([uid for uid, followers_list in followers.items() if user_id in followers_list]),
        "recent_interactions": user_actions[-10:]  # Last 10 interactions
    }

@app.get("/analytics/system")
async def get_system_analytics():
    """Get system-wide analytics"""
    return {
        "total_users": len(users),
        "total_images": len(images),
        "total_interactions": len(user_interactions),
        "most_liked_image": max(images.values(), key=lambda x: len(likes[x["id"]])) if images else None,
        "most_shared_image": max(images.values(), key=lambda x: len(shares[x["id"]])) if images else None,
        "recent_activity": user_interactions[-20:]  # Last 20 system interactions
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "users_count": len(users),
        "images_count": len(images),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/users/{user_id}/following")
async def get_following_users(user_id: str):
    """Get users that a user follows"""
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Efficiently find users that the current user follows
    following_users = []
    for target_user_id, followers_list in followers.items():
        if user_id in followers_list:
            following_users.append(UserResponse(
                id=target_user_id,
                username=users[target_user_id]["username"],
                email=users[target_user_id]["email"],
                followers_count=len(followers[target_user_id]),
                following_count=len([uid for uid, followers_list in followers.items() if target_user_id in followers_list])
            ))
    
    return following_users

@app.get("/users/{user_id}/is-following/{target_user_id}")
async def is_following_user(user_id: str, target_user_id: str):
    """Check if a user is following another user"""
    if user_id not in users or target_user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_following = user_id in followers[target_user_id]
    return {"is_following": is_following}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

