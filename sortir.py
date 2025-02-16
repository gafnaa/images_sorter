import os
import shutil
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
from PIL import Image, ImageTk
from customtkinter import *

class ImageSorter:
    def __init__(self, root):
        self.root = root
        self.root.title("Image Sorter")
        self.root.geometry("850x750")
        self.root.configure(bg="#0F0F0F")
        
        self.image_folder = ""
        self.destination_folders = []
        self.image_list = []
        self.current_index = 0
        
        # UI Elements
        self.label = tk.Label(root, text="Image Sorter", fg="white", bg="#0F0F0F", font=("Segoe UI", 18, "bold"))
        self.label.pack(pady=5)
        
        self.sub_label = tk.Label(root, text="Pilih folder yang berisi gambar", fg="white", bg="#0F0F0F", font=("Segoe UI", 12))
        self.sub_label.pack(pady=5)
        
        self.select_folder_btn = CTkButton(root, text="Select Folder", command=self.select_folder, font=("Segoe UI", 12), fg_color="#3695FF", text_color="white", corner_radius=20)
        self.select_folder_btn.pack(pady=5)
        
        self.canvas = tk.Canvas(root, width=500, height=400, bg="#1E1E1E", relief=tk.FLAT, bd=2)
        self.canvas.pack(pady=10)
        
        self.filename_label = tk.Label(root, text="", fg="white", bg="#0F0F0F", font=("Segoe UI", 12, "bold"))
        self.filename_label.pack(pady=5)
        
        self.nav_frame = tk.Frame(root, bg="#0F0F0F")
        self.nav_frame.pack()
        
        self.prev_btn = tk.Button(self.nav_frame, text="⭠", font=("Segoe UI", 14, "bold"), bg="#1E1E1E", fg="white", padx=10, pady=5, command=self.prev_image, relief=tk.FLAT)
        self.prev_btn.pack(side=tk.LEFT, padx=5, pady=5)
        
        self.next_btn = tk.Button(self.nav_frame, text="⭢", font=("Segoe UI", 14, "bold"), bg="#1E1E1E", fg="white", padx=10, pady=5, command=self.next_image, relief=tk.FLAT)
        self.next_btn.pack(side=tk.RIGHT, padx=5, pady=5)
        
        self.button_frame = tk.Frame(root, bg="#0F0F0F")
        self.button_frame.pack()
    
    def select_folder(self):
        self.image_folder = filedialog.askdirectory()
        if not self.image_folder:
            return
        
        self.image_list = [f for f in os.listdir(self.image_folder) if f.lower().endswith((".png", ".jpg", ".jpeg", ".gif"))]
        
        if not self.image_list:
            messagebox.showerror("Error", "No images found in the selected folder.")
            return
        
        self.get_destination_folders()
        self.display_image()
    
    def get_destination_folders(self):
        num_folders = simpledialog.askinteger("Info banh!", "Mau ada berapa destinasi folder?", minvalue=1)
        if num_folders is None:
            return
        
        self.destination_folders = []
        
        for i in range(num_folders):
            folder_path = filedialog.askdirectory(title=f"Select destination folder {i+1}")
            if folder_path:
                self.destination_folders.append(folder_path)
        
        # Add buttons for sorting
        for widget in self.button_frame.winfo_children():
            widget.destroy()
        
        for folder in self.destination_folders:
            btn = CTkButton(self.button_frame, text=os.path.basename(folder), command=lambda f=folder: self.move_image(f),
                            font=("Segoe UI", 12, "bold"), fg_color="#3695FF", text_color="white", corner_radius=20)
            btn.pack(side=tk.LEFT, padx=5, pady=5)
    
    def display_image(self):
        if self.current_index < 0:
            self.current_index = 0
        if self.current_index >= len(self.image_list):
            self.current_index = len(self.image_list) - 1
        
        if not self.image_list:
            return
        
        image_path = os.path.join(self.image_folder, self.image_list[self.current_index])
        image = Image.open(image_path)
        image.thumbnail((500, 400))
        self.tk_image = ImageTk.PhotoImage(image)
        self.canvas.create_image(250, 200, anchor=tk.CENTER, image=self.tk_image)
        
        self.filename_label.config(text=self.image_list[self.current_index])
    
    def move_image(self, destination):
        if self.current_index >= len(self.image_list):
            return
        
        image_path = os.path.join(self.image_folder, self.image_list[self.current_index])
        shutil.move(image_path, destination)
        del self.image_list[self.current_index]
        
        if self.current_index >= len(self.image_list):
            self.current_index = max(0, len(self.image_list) - 1)
        
        self.display_image()
    
    def next_image(self):
        if self.current_index < len(self.image_list) - 1:
            self.current_index += 1
            self.display_image()
    
    def prev_image(self):
        if self.current_index > 0:
            self.current_index -= 1
            self.display_image()

if __name__ == "__main__":
    root = tk.Tk()
    app = ImageSorter(root)
    root.mainloop()
