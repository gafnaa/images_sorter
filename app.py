import os
import shutil
import base64
import webview
from threading import Thread
import sys
from PIL import Image, ImageOps, ExifTags
import io
import datetime

# Define the API class that will be exposed to JavaScript
class Api:
    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def select_folder(self):
        """Open a folder selection dialog and return the path."""
        import tkinter as tk
        from tkinter import filedialog
        
        print("API: select_folder called (using Tkinter)")
        try:
            root = tk.Tk()
            root.withdraw() # Hide the main window
            root.attributes('-topmost', True) # Bring to front
            
            # This implementation is more robust on Windows than pywebview's native dialog
            folder_path = filedialog.askdirectory()
            
            root.destroy()
            
            print(f"API: Selected path: {folder_path}")
            if folder_path:
                return folder_path.replace('/', '\\') # Normalize for Windows visual consistency
            return None
        except Exception as e:
            print(f"API: Error opening dialog: {e}")
            return None

    def scan_images(self, folder_path, allowed_extensions=None):
        """Return a list of image filenames in the folder."""
        if not folder_path or not os.path.exists(folder_path):
            return []
        
        images = []
        # Default extensions if none provided
        if not allowed_extensions:
            valid_exts = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".arw", ".cr2", ".cr3", ".nef", ".raf", ".dng", ".orf", ".rw2"}
        else:
            # Ensure extensions start with dot and are lowercase
            valid_exts = {f".{ext.lower().lstrip('.')}" for ext in allowed_extensions}
            
        try:
            for f in os.listdir(folder_path):
                ext = os.path.splitext(f)[1].lower()
                if ext in valid_exts:
                    images.append(f)
        except Exception as e:
            print(f"Error scanning folder: {e}")
        return images

    def load_image(self, path, is_thumbnail=False):
        """Read an image file, resize if needed, and return as base64 string."""
        if not path or not os.path.exists(path):
            return None
        
        try:
            # Use PIL to load and resize
            with Image.open(path) as img:
                # Handle orientation metadata
                img = ImageOps.exif_transpose(img)
                
                # Convert to RGB to avoid alpha channel issues with JPEG
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                # Resize logic
                if is_thumbnail:
                    img.thumbnail((150, 150)) # Efficient resize
                else:
                    # Limit max resolution for preview to save RAM (e.g., 2K max)
                    # Most screens are 1080p or 1440p, full 4K/20MB file is wasteful
                    img.thumbnail((1920, 1080))
                
                # Save to buffer
                buffer = io.BytesIO()
                img.save(buffer, format="JPEG", quality=80 if is_thumbnail else 90)
                b64_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
                return f"data:image/jpeg;base64,{b64_data}"
                
        except Exception as e:
            print(f"API: Error loading image {path}: {e}")
            return None

    def get_image_metadata(self, filename, src_folder):
        """Get resolution, size, and EXIF data."""
        try:
            path = os.path.join(src_folder, filename)
            if not os.path.exists(path):
                return {}
            
            # File size
            stats = os.stat(path)
            size_mb = stats.st_size / (1024 * 1024)
            
            width = 0
            height = 0
            img_format = "Unknown"
            exif_data = {}

            try:
                with Image.open(path) as img:
                    width, height = img.size
                    img_format = img.format or "Unknown"
                    
                    if hasattr(img, '_getexif') and img._getexif():
                        exif = img._getexif()
                        for tag, value in exif.items():
                            decoded = ExifTags.TAGS.get(tag, tag)
                            if decoded in ['DateTimeOriginal', 'Make', 'Model', 'ISOSpeedRatings', 'ExposureTime', 'FNumber']:
                                exif_data[decoded] = str(value)
            except Exception as read_err:
                print(f"Error reading metadata from image: {read_err}") 
                # Proceed with basic file stats

            # Format specific values
            iso = exif_data.get('ISOSpeedRatings', '')
            
            aperture = ""
            if 'FNumber' in exif_data:
                try:
                    aperture = f"f/{exif_data['FNumber']}"
                except: pass

            return {
                "filename": filename,
                "resolution": f"{width} x {height}",
                "size": f"{size_mb:.2f} MB",
                "format": img_format,
                "date": exif_data.get('DateTimeOriginal', 'Unknown'),
                "camera": f"{exif_data.get('Make', '')} {exif_data.get('Model', '')}".strip() or "Unknown",
                "iso": iso,
                "aperture": aperture,
                "shutter": exif_data.get('ExposureTime', '')
            }
        except Exception as e:
            return {"error": str(e)}

    def move_image(self, filename, src_folder, dest_folder):
        """Move an image from src to dest."""
        try:
            src_path = os.path.join(src_folder, filename)
            dest_path = os.path.join(dest_folder, filename)
            
            # Ensure dest folder exists
            if not os.path.exists(dest_folder):
                os.makedirs(dest_folder)
                
            shutil.move(src_path, dest_path)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_image(self, filename, src_folder):
        """Soft delete: Move image to a .trash folder inside src_folder."""
        try:
            trash_path = os.path.join(src_folder, '.trash')
            if not os.path.exists(trash_path):
                os.makedirs(trash_path)
            
            src_path = os.path.join(src_folder, filename)
            dest_path = os.path.join(trash_path, filename)
            
            if os.path.exists(src_path):
                shutil.move(src_path, dest_path)
                return {"success": True}
            else:
                return {"success": False, "error": "File not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def restore_image(self, filename, src_folder):
        """Restore image from .trash folder."""
        try:
            trash_path = os.path.join(src_folder, '.trash')
            src_path = os.path.join(trash_path, filename) # It is now in trash
            dest_path = os.path.join(src_folder, filename) # Moving back to original source
            
            if os.path.exists(src_path):
                shutil.move(src_path, dest_path)
                return {"success": True}
            else:
                return {"success": False, "error": "File in trash not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}

def start_app():
    api = Api()
    
    # Determine if we are running in dev mode (npm run dev running separate) or prod
    # specific logic can be added. for now let's assume dev mode usually ports 5173
    # OR we point to the built index.html
    
    # Function to get the correct path for resources
    def resource_path(relative_path):
        """ Get absolute path to resource, works for dev and for PyInstaller """
        try:
            # PyInstaller creates a temp folder and stores path in _MEIPASS
            base_path = sys._MEIPASS
        except Exception:
            base_path = os.path.dirname(os.path.abspath(__file__))
        return os.path.join(base_path, relative_path)

    # Check if 'dist' exists, if so use it, else try localhost
    url = "http://localhost:5173"
    
    # Check for the built UI file
    # In PyInstaller, we will likely bundle it into 'ui/dist' folder inside the executable
    ui_path = resource_path(os.path.join("ui", "dist", "index.html"))
    
    if os.path.exists(ui_path):
        url = ui_path

    # If an argument is passed, use it as URL (e.g. for dev)
    if len(sys.argv) > 1:
        url = sys.argv[1]

    window = webview.create_window(
        'Image Sorter Pro', 
        url, 
        js_api=api,
        width=1000,
        height=800,
        background_color='#0f172a' # Match the theme
    )
    api.set_window(window)
    webview.start(debug=False)

if __name__ == '__main__':
    start_app()
