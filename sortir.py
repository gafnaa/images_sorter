import os
import shutil
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
from PIL import Image, ImageTk

class ImageSorter:
    def __init__(self, root):
        self.root = root
        self.root.title("Image Sorter")
        self.root.geometry("700x600")
        self.root.configure(bg="#2C3E50")
        
        self.image_folder = ""
        self.destination_folders = []
        self.image_list = []
        self.current_index = 0
        
        # UI Elements
        self.label = tk.Label(root, text="Select a folder with images", fg="white", bg="#2C3E50", font=("Arial", 14, "bold"))
        self.label.pack(pady=10)
        
        self.select_folder_btn = tk.Button(root, text="Select Folder", command=self.select_folder, font=("Arial", 12), bg="#3498DB", fg="white", padx=10, pady=5)
        self.select_folder_btn.pack(pady=5)
        
        self.canvas = tk.Canvas(root, width=500, height=500, bg="#ECF0F1", relief=tk.SUNKEN, bd=2)
        self.canvas.pack(pady=10)
        
        self.button_frame = tk.Frame(root, bg="#2C3E50")
        self.button_frame.pack()
    
    def select_folder(self):
        self.image_folder = filedialog.askdirectory()
        if not self.image_folder:
            return
        
        self.image_list = [f for f in os.listdir(self.image_folder) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
        
        if not self.image_list:
            messagebox.showerror("Error", "No images found in the selected folder.")
            return
        
        self.get_destination_folders()
        self.display_image()
    
    def get_destination_folders(self):
        num_folders = int(simpledialog.askstring("Input", "Enter number of destination folders:"))
        self.destination_folders = []
        
        for i in range(num_folders):
            folder_path = filedialog.askdirectory(title=f"Select destination folder {i+1}")
            if folder_path:
                self.destination_folders.append(folder_path)
        
        # Add buttons for sorting
        for widget in self.button_frame.winfo_children():
            widget.destroy()
        
        for folder in self.destination_folders:
            btn = tk.Button(self.button_frame, text=os.path.basename(folder), command=lambda f=folder: self.move_image(f),
                            font=("Arial", 12, "bold"), bg="#1ABC9C", fg="white", padx=10, pady=5)
            btn.pack(side=tk.LEFT, padx=5, pady=5)
    
    def display_image(self):
        if self.current_index >= len(self.image_list):
            messagebox.showinfo("Done", "All images have been sorted.")
            self.root.quit()
            return
        
        image_path = os.path.join(self.image_folder, self.image_list[self.current_index])
        image = Image.open(image_path)
        image.thumbnail((500, 500))
        self.tk_image = ImageTk.PhotoImage(image)
        self.canvas.create_image(250, 250, anchor=tk.CENTER, image=self.tk_image)
    
    def move_image(self, destination):
        image_path = os.path.join(self.image_folder, self.image_list[self.current_index])
        shutil.move(image_path, destination)
        self.current_index += 1
        self.display_image()

if __name__ == "__main__":
    root = tk.Tk()
    app = ImageSorter(root)
    root.mainloop()
