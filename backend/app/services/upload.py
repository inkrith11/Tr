import os
import logging
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException, status
from typing import Optional
import uuid
from pathlib import Path

from ..config import settings

logger = logging.getLogger(__name__)

# Configure Cloudinary if credentials are provided
if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET
    )

# Local upload directory
UPLOAD_DIR = Path("uploads").resolve()
UPLOAD_DIR.mkdir(exist_ok=True)

# Allowed extensions mapped from MIME types
_MIME_TO_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def _validate_image(file: UploadFile) -> str:
    """Validate image file type and return safe extension. Raises HTTPException on failure."""
    content_type = (file.content_type or "").lower()
    if content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image type '{content_type}'. Allowed: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
        )
    return _MIME_TO_EXT.get(content_type, "jpg")


async def upload_image(file: UploadFile, folder: str = "listings") -> Optional[str]:
    """
    Upload image to Cloudinary or local storage.
    Returns the URL of the uploaded image.
    """
    if not file:
        return None

    ext = _validate_image(file)

    # Read content and check size
    content = await file.read()
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large. Maximum size is {settings.MAX_IMAGE_SIZE_MB}MB"
        )

    # Generate safe unique filename (no user-controlled parts)
    unique_filename = f"{uuid.uuid4().hex}.{ext}"

    # If Cloudinary is configured, use it
    if settings.CLOUDINARY_CLOUD_NAME:
        try:
            result = cloudinary.uploader.upload(
                content,
                folder=f"apsit_tradehub/{folder}",
                public_id=unique_filename.split('.')[0],
                resource_type="image"
            )
            return result.get('secure_url')
        except Exception as e:
            logger.error("Cloudinary upload failed: %s", e)
            return None
    else:
        # Fall back to local storage
        try:
            # Sanitise folder name to prevent path traversal
            safe_folder = Path(folder).name  # strips any "../" tricks
            folder_path = (UPLOAD_DIR / safe_folder).resolve()
            if not str(folder_path).startswith(str(UPLOAD_DIR)):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid upload folder"
                )
            folder_path.mkdir(exist_ok=True)

            file_path = folder_path / unique_filename
            with open(file_path, 'wb') as f:
                f.write(content)

            return f"/uploads/{safe_folder}/{unique_filename}"
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Local upload failed: %s", e)
            return None


def delete_image(image_url: str) -> bool:
    """
    Delete image from storage.
    """
    if not image_url:
        return False

    if settings.CLOUDINARY_CLOUD_NAME and 'cloudinary' in image_url:
        try:
            parts = image_url.split('/')
            public_id = '/'.join(parts[-3:])[:-4]  # Remove extension
            cloudinary.uploader.destroy(public_id)
            return True
        except Exception as e:
            logger.error("Cloudinary delete failed: %s", e)
            return False
    else:
        # Local file deletion with path traversal protection
        try:
            if image_url.startswith('/uploads/'):
                file_path = (UPLOAD_DIR / image_url.split('/uploads/', 1)[1]).resolve()
                # Ensure resolved path is still under UPLOAD_DIR
                if not str(file_path).startswith(str(UPLOAD_DIR)):
                    logger.warning("Path traversal attempt blocked: %s", image_url)
                    return False
                if file_path.exists():
                    os.remove(file_path)
                    return True
            return False
        except Exception as e:
            logger.error("Local delete failed: %s", e)
            return False
