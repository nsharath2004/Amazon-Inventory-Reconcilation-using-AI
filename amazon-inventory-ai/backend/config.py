import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

DATABASE_PATH = os.path.join(BASE_DIR, "inventory.db")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
SAMPLE_FOLDER = os.path.join(PROJECT_ROOT, "ml", "sample_images")
CHECKPOINT_PATH = os.path.join(PROJECT_ROOT, "ml", "checkpoints", "best_model.pth")

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB limit

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
