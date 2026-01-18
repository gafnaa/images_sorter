import os
import shutil
import base64
import webview
from threading import Thread
import sys
import io
import datetime
from flask import Flask, send_file, request, Response
from flask_cors import CORS
from functools import lru_cache

# --- Flask Server for Streaming ---
server = Flask(__name__)
CORS(server)
PORT = 23456

@server.route('/video')
@server.route('/view')
def serve_file():
    path = request.args.get('path')
    if not path:
        return "No path provided", 400
    try:
        # Basic security check? 
        return send_file(path)
    except Exception as e:
        return str(e), 500

@lru_cache(maxsize=1000)
def get_thumbnail_bytes(path):
    """Generate and cache thumbnail bytes."""
    if not path or not os.path.exists(path):
        return None
    
    img = None
    ext = os.path.splitext(path)[1].lower()
    is_video = ext in {".mp4", ".mov", ".avi", ".mkv", ".webm"}
    
    try:
        from PIL import Image, ImageOps
        if is_video:
            # Video Thumbnail Logic
            try:
                import cv2
                cap = cv2.VideoCapture(path)
                if cap.isOpened():
                    try:
                        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                    except: total = 0
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 30 if total > 60 else 0)
                    ret, frame = cap.read()
                    if ret:
                        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        img = Image.fromarray(frame_rgb)
                    cap.release()
            except: pass
            
            if img is None:
                # Fallback video placeholder
                img = Image.new('RGB', (150, 150), color='#334155') 
                from PIL import ImageDraw
                draw = ImageDraw.Draw(img)
                for y in range(10, 150, 20):
                    draw.rectangle([5, y, 15, y+10], fill='white')
                    draw.rectangle([135, y, 145, y+10], fill='white')
                draw.rectangle([40, 60, 110, 90], outline='white', width=2)
                draw.line([50, 65, 75, 85], fill='white', width=3)
                draw.line([75, 85, 100, 65], fill='white', width=3)
        else:
            # Image Thumbnail Logic
            with Image.open(path) as i:
                i = ImageOps.exif_transpose(i)
                if i.mode in ('RGBA', 'P'): 
                    i = i.convert('RGB')
                i.thumbnail((150, 150))
                img = i.copy()
                
        if img:
            # Ensure max size (already done for image, do for video)
            img.thumbnail((150, 150))
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=70)
            return buffer.getvalue()
            
    except Exception as e:
        print(f"Thumb Gen Error {path}: {e}")
        
    return None

@server.route('/thumbnail')
def serve_thumbnail():
    path = request.args.get('path')
    if not path: return "Missing path", 400
    
    data = get_thumbnail_bytes(path)
    if data:
        return send_file(io.BytesIO(data), mimetype='image/jpeg')
    return "Error", 500

def start_server():
    server.run(host='127.0.0.1', port=PORT, threaded=True)

# Start server in background thread
t = Thread(target=start_server, daemon=True)
t.start()

# Define the API class that will be exposed to JavaScript
class Api:
    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def select_folder(self):
        """Open a folder selection dialog and return the path."""
        print("API: select_folder called (using Native PyWebView)")
        try:
            if self._window:
                # Returns a tuple of file paths
                result = self._window.create_file_dialog(webview.FOLDER_DIALOG)
                if result and len(result) > 0:
                    folder_path = result[0]
                    print(f"API: Selected path: {folder_path}")
                    return folder_path
            else:
                 print("API: No window attached for dialog")
            return None
        except Exception as e:
            print(f"API: Error opening dialog: {e}")
            return None

    def scan_images(self, folder_path, allowed_extensions=None):
        """Return a list of image and video filenames in the folder."""
        if not folder_path or not os.path.exists(folder_path):
            return []
        
        images = []
        # Default extensions if none provided
        if not allowed_extensions:
            # Added video extensions
            valid_exts = {
                ".png", ".jpg", ".jpeg", ".gif", ".webp", 
                ".arw", ".cr2", ".cr3", ".nef", ".raf", ".dng", ".orf", ".rw2",
                ".mp4", ".mov", ".avi", ".mkv", ".webm"
            }
        else:
            # Ensure extensions start with dot and are lowercase
            valid_exts = {f".{ext.lower().lstrip('.')}" for ext in allowed_extensions}
            
        try:
            # Use scandir for better performance
            with os.scandir(folder_path) as entries:
                for entry in entries:
                    if entry.is_file():
                        ext = os.path.splitext(entry.name)[1].lower()
                        if ext in valid_exts:
                            images.append(entry.name)
        except Exception as e:
            print(f"Error scanning folder: {e}")
        
        # Sort explicitly since scandir is not ordered
        images.sort()
        return images

    def load_image(self, path, is_thumbnail=False):
        """
        Read an image file, resize if needed, and return as base64 string.
        For videos:
         - if is_thumbnail: return a generated placeholder image.
         - else: return the absolute file path prefixed with 'video|' for the frontend to handle.
        """
        if not path or not os.path.exists(path):
            return None
        
        ext = os.path.splitext(path)[1].lower()
        is_video = ext in {".mp4", ".mov", ".avi", ".mkv", ".webm"}

        if is_video and not is_thumbnail:
            # Return Streaming URL via Flask
            import urllib.parse
            quoted_path = urllib.parse.quote(path) # Quote safely
            # Note: 127.0.0.1 is safer than localhost for some windows setups
            return f"video|http://127.0.0.1:{PORT}/video?path={quoted_path}"

        try:
            if is_video and is_thumbnail:
                img = None
                try:
                    # Try to generate real thumbnail using OpenCV
                    import cv2
                    # print(f"DEBUG: Generating thumb for {path}")
                    cap = cv2.VideoCapture(path)
                    if cap.isOpened():
                        # Try to read a frame from the middle or at least 1 second in (approx 30 frames)
                        # to avoid black fading in
                        try:
                            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                        except:
                            total_frames = 0
                            
                        if total_frames > 60:
                            cap.set(cv2.CAP_PROP_POS_FRAMES, 30)
                        else:
                            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                            
                        ret, frame = cap.read()
                        if ret:
                            # Convert BGR (OpenCV) to RGB (PIL)
                            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                            img = Image.fromarray(frame_rgb)
                        else:
                            print(f"Warning: Could not read frame from {path}")
                        
                        cap.release()
                    else:
                        print(f"Warning: Could not open video file for thumbnail: {path}")
                except ImportError as e:
                    print(f"OpenCV Import Error: {e}")
                except Exception as e:
                    print(f"Error generating video thumbnail: {e}")

                if img is None:
                    # Fallback: Generate a placeholder for video thumbnail using PIL
                    # Lighter background to be visible
                    img = Image.new('RGB', (150, 150), color='#334155') 
                    from PIL import ImageDraw
                    draw = ImageDraw.Draw(img)
                    
                    # Draw film strip holes on left and right
                    for y in range(10, 150, 20):
                        draw.rectangle([5, y, 15, y+10], fill='white')
                        draw.rectangle([135, y, 145, y+10], fill='white')
                    
                    # Draw a text-like rect in center
                    draw.rectangle([40, 60, 110, 90], outline='white', width=2)
                    # Maybe just a "V" shape
                    draw.line([50, 65, 75, 85], fill='white', width=3)
                    draw.line([75, 85, 100, 65], fill='white', width=3)
                
                # Ensure resize happens for both cases
                img.thumbnail((150, 150))

                
            else:
                # Use PIL to load and resize image
                from PIL import Image, ImageOps
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
                        img.thumbnail((1920, 1080))
            
            # Save to buffer (common for both image and video thumbnail)
            buffer = io.BytesIO()
            # If it was a PIL image (either loaded or generated)
            img.save(buffer, format="JPEG", quality=80 if is_thumbnail else 90)
            b64_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return f"data:image/jpeg;base64,{b64_data}"
                
        except Exception as e:
            print(f"API: Error loading asset {path}: {e}")
            return None

    def get_image_metadata(self, path):
        """Get resolution, size, and EXIF data."""
        try:
            # path is now the full path passed from frontend
            if not os.path.exists(path):
                return {}
            
            filename = os.path.basename(path)
            # File size
            stats = os.stat(path)
            size_mb = stats.st_size / (1024 * 1024)
            
            width = 0
            height = 0
            img_format = "Unknown"
            exif_data = {}

            # Check if video
            ext = os.path.splitext(filename)[1].lower()
            is_video = ext in {".mp4", ".mov", ".avi", ".mkv", ".webm"}
            
            if is_video:
                img_format = f"Video ({ext.strip('.')})"
                # For now getting video resolution is complex without ffmpeg/opencv dependency
                # which we want to avoid if possible for simplicity or handle gracefully
                # We can just leave width/height 0 or generic
            else:
                try:
                    from PIL import Image, ExifTags
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

    # Enable File Access (Attempt to fix video playback)
    # Note: These flags depend on the underlying browser engine (CEF/WebView2/etc)
    try:
        webview.settings['ALLOW_FILE_ACCESS_FROM_FILES'] = True
        webview.settings['ALLOW_UNIVERSAL_ACCESS_FROM_FILES'] = True
    except Exception:
        pass # Settings might not exist in some versions

    window = webview.create_window(
        'MediaSort', 
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
