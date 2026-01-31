import os
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from typing import Optional
import uuid
from pathlib import Path

from ..config import settings

# Configure Cloudinary if credentials are provided
if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET
    )

# Local upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


async def upload_image(file: UploadFile, folder: str = "listings") -> Optional[str]:
    """
    Upload image to Cloudinary or local storage.
    Returns the URL of the uploaded image.
    """
    if not file:
        return None
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    
    # If Cloudinary is configured, use it
    if settings.CLOUDINARY_CLOUD_NAME:
        try:
            # Read file content
            content = await file.read()
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                content,
                folder=f"apsit_tradehub/{folder}",
                public_id=unique_filename.split('.')[0],
                resource_type="image"
            )
            return result.get('secure_url')
        except Exception as e:
            print(f"Cloudinary upload failed: {e}")
            return None
    else:
        # Fall back to local storage
        try:
            folder_path = UPLOAD_DIR / folder
            folder_path.mkdir(exist_ok=True)
            
            file_path = folder_path / unique_filename
            content = await file.read()
            
            with open(file_path, 'wb') as f:
                f.write(content)
            
            # Return relative URL (you'd serve this via static files)
            return f"/uploads/{folder}/{unique_filename}"
        except Exception as e:
            print(f"Local upload failed: {e}")
            return None


def delete_image(image_url: str) -> bool:
    """
    Delete image from storage.
    """
    if not image_url:
        return False
    
    if settings.CLOUDINARY_CLOUD_NAME and 'cloudinary' in image_url:
        try:
            # Extract public_id from URL
            # Example: https://res.cloudinary.com/.../apsit_tradehub/listings/abc123.jpg
            parts = image_url.split('/')
            public_id = '/'.join(parts[-3:])[:-4]  # Remove extension
            cloudinary.uploader.destroy(public_id)
            return True
        except Exception as e:
            print(f"Cloudinary delete failed: {e}")
            return False
    else:
        # Local file deletion
        try:
            if image_url.startswith('/uploads/'):
                file_path = Path(image_url[1:])  # Remove leading /
                if file_path.exists():
                    os.remove(file_path)
                    return True
            return False
        except Exception as e:
            print(f"Local delete failed: {e}")
            return False
