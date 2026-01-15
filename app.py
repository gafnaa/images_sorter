import os
import shutil
import base64
import webview
from threading import Thread
import sys

# Define the API class that will be exposed to JavaScript
class Api:
    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def select_folder(self):
        """Open a folder selection dialog and return the path."""
        # result is a tuple/list of paths or None
        if not self._window:
            return None
        result = self._window.create_file_dialog(webview.FOLDER_DIALOG)
        if result and len(result) > 0:
            return result[0]
        return None

    def scan_images(self, folder_path):
        """Return a list of image filenames in the folder."""
        if not folder_path or not os.path.exists(folder_path):
            return []
        
        images = []
        valid_exts = (".png", ".jpg", ".jpeg", ".gif", ".webp")
        try:
            for f in os.listdir(folder_path):
                if f.lower().endswith(valid_exts):
                    images.append(f)
        except Exception as e:
            print(f"Error scanning folder: {e}")
        return images

    def load_image(self, file_path):
        """Read an image file and return it as a base64 string."""
        if not os.path.exists(file_path):
            return None
        
        try:
            with open(file_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                # Guess mime type based on extension
                ext = os.path.splitext(file_path)[1].lower()
                mime = "image/jpeg"
                if ext == ".png": mime = "image/png"
                elif ext == ".gif": mime = "image/gif"
                elif ext == ".webp": mime = "image/webp"
                
                return f"data:{mime};base64,{encoded_string}"
        except Exception as e:
            print(f"Error loading image: {e}")
            return None

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

def start_app():
    api = Api()
    
    # Determine if we are running in dev mode (npm run dev running separate) or prod
    # specific logic can be added. for now let's assume dev mode usually ports 5173
    # OR we point to the built index.html
    
    # Check if 'dist' exists, if so use it, else try localhost
    url = "http://localhost:5173"
    if os.path.exists(os.path.join(os.path.dirname(__file__), "ui/dist/index.html")):
        url = os.path.join(os.path.dirname(__file__), "ui/dist/index.html")

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
    webview.start(debug=True)

if __name__ == '__main__':
    start_app()
