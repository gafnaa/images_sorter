import os
import shutil
import customtkinter as ctk
from tkinter import filedialog, messagebox, simpledialog
from PIL import Image

class ImageSorter(ctk.CTk):
    def __init__(self):
        super().__init__()

        # --- Basic App Setup ---
        self.title("Image Sorter ✨")
        self.geometry("800x700")
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")

        # --- App State Variables ---
        self.image_folder = ""
        self.destination_folders = []
        self.image_list = []
        self.current_index = 0
        self.total_images = 0

        # --- Configure Main Grid Layout ---
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1) # Make the image area expand

        self._create_widgets()

    def _create_widgets(self):
        """Create and layout all the GUI widgets."""

        # --- Top Frame for Folder Selection ---
        top_frame = ctk.CTkFrame(self, fg_color="transparent")
        top_frame.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")
        top_frame.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(top_frame, text="Image Sorter", font=ctk.CTkFont(size=24, weight="bold")).grid(row=0, column=0, pady=(0, 5))
        ctk.CTkLabel(top_frame, text="Select a source folder and destination folders to begin sorting.", font=ctk.CTkFont(size=12)).grid(row=1, column=0)
        
        select_folder_btn = ctk.CTkButton(top_frame, text="Select Source Folder", command=self.select_source_folder, height=35)
        select_folder_btn.grid(row=2, column=0, pady=15)

        # --- Main Image Display ---
        self.image_label = ctk.CTkLabel(self, text="🖼️\n\nYour image will appear here.", font=ctk.CTkFont(size=20), fg_color=("#e0e0e0", "#1E1E1E"), corner_radius=10)
        self.image_label.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")
        
        # --- Info & Navigation Frame ---
        info_nav_frame = ctk.CTkFrame(self, fg_color="transparent")
        info_nav_frame.grid(row=2, column=0, padx=20, pady=(10, 5), sticky="ew")
        info_nav_frame.grid_columnconfigure(1, weight=1)

        self.prev_btn = ctk.CTkButton(info_nav_frame, text="⬅️", font=ctk.CTkFont(size=20), command=self.prev_image, width=50, height=50)
        self.prev_btn.grid(row=0, column=0, rowspan=2)

        self.filename_label = ctk.CTkLabel(info_nav_frame, text="File: N/A", font=ctk.CTkFont(size=14, weight="bold"))
        self.filename_label.grid(row=0, column=1)

        self.progress_label = ctk.CTkLabel(info_nav_frame, text="Image: 0 of 0", font=ctk.CTkFont(size=12))
        self.progress_label.grid(row=1, column=1)

        self.next_btn = ctk.CTkButton(info_nav_frame, text="➡️", font=ctk.CTkFont(size=20), command=self.next_image, width=50, height=50)
        self.next_btn.grid(row=0, column=2, rowspan=2)

        # --- Destination Buttons Frame ---
        self.button_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.button_frame.grid(row=3, column=0, padx=20, pady=(5, 20), sticky="ew")

    def select_source_folder(self):
        """Select the source folder containing images."""
        folder = filedialog.askdirectory()
        if not folder:
            return

        self.image_folder = folder
        all_files = os.listdir(self.image_folder)
        self.image_list = [f for f in all_files if f.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp"))]
        self.total_images = len(self.image_list)

        if not self.image_list:
            messagebox.showerror("Error", "No images found in the selected folder.")
            return

        self.get_destination_folders()
        self.current_index = 0
        self.display_image()

    def get_destination_folders(self):
        """Prompt user for the number of destination folders and their paths."""
        num_folders = simpledialog.askinteger("Destination Folders", "How many destination folders do you need?", minvalue=1)
        if num_folders is None:
            return

        self.destination_folders = []
        for i in range(num_folders):
            folder_path = filedialog.askdirectory(title=f"Select Destination Folder {i+1}")
            if folder_path:
                self.destination_folders.append(folder_path)

        # Clear old buttons and create new ones
        for widget in self.button_frame.winfo_children():
            widget.destroy()
        
        # Center the buttons
        self.button_frame.grid_columnconfigure(list(range(len(self.destination_folders))), weight=1)

        for i, folder in enumerate(self.destination_folders):
            folder_name = os.path.basename(folder)
            btn = ctk.CTkButton(self.button_frame, text=folder_name, command=lambda f=folder: self.move_image(f), height=35)
            btn.grid(row=0, column=i, padx=5, pady=5, sticky="ew")

    def display_image(self):
        """Display the current image and update info labels."""
        if not self.image_list:
            self.image_label.configure(text="🎉\n\nAll images have been sorted!", image=None)
            self.filename_label.configure(text="File: Done!")
            self.progress_label.configure(text=f"Image: {self.total_images} of {self.total_images}")
            return

        # Clamp index to valid range
        if self.current_index < 0:
            self.current_index = 0
        if self.current_index >= len(self.image_list):
            self.current_index = len(self.image_list) - 1

        image_path = os.path.join(self.image_folder, self.image_list[self.current_index])
        
        try:
            # Open and resize image to fit the label
            image = Image.open(image_path)
            ctk_image = ctk.CTkImage(light_image=image, dark_image=image, size=(500, 400)) # Use CTkImage for better scaling
            self.image_label.configure(image=ctk_image, text="")
        except Exception as e:
            self.image_label.configure(text=f"Error loading image:\n{e}", image=None)

        self.filename_label.configure(text=f"File: {self.image_list[self.current_index]}")
        self.progress_label.configure(text=f"Image: {self.current_index + 1} of {len(self.image_list)}")

    def move_image(self, destination):
        """Move the current image to the selected destination folder."""
        if self.current_index >= len(self.image_list):
            return

        try:
            source_path = os.path.join(self.image_folder, self.image_list[self.current_index])
            shutil.move(source_path, destination)
            
            # Remove from list and update display
            del self.image_list[self.current_index]
            self.display_image()
            
        except Exception as e:
            messagebox.showerror("Error", f"Could not move file: {e}")

    def next_image(self):
        """Go to the next image."""
        if self.current_index < len(self.image_list) - 1:
            self.current_index += 1
            self.display_image()

    def prev_image(self):
        """Go to the previous image."""
        if self.current_index > 0:
            self.current_index -= 1
            self.display_image()

if __name__ == "__main__":
    app = ImageSorter()
    app.mainloop()