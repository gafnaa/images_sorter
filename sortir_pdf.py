import os
import shutil
import customtkinter as ctk
from tkinter import filedialog, messagebox, simpledialog
from PIL import Image

# --- Attempt to import PyMuPDF and set a flag ---
try:
    import fitz  # PyMuPDF library
    pymupdf_available = True
except ImportError:
    pymupdf_available = False

class PDFSorter(ctk.CTk):
    """
    A GUI application for sorting PDF files into different destination folders,
    featuring a preview of the first page.
    """
    def __init__(self):
        super().__init__()

        # --- Basic App Setup ---
        self.title("PDF Sorter 📂 (with Preview)")
        self.geometry("800x750") # Increased height for better view
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")

        # --- App State Variables ---
        self.source_folder = ""
        self.destination_folders = []
        self.pdf_list = []
        self.current_index = 0
        self.total_files = 0
        
        # --- Check for dependency ---
        if not pymupdf_available:
            messagebox.showwarning(
                "Missing Dependency",
                "PyMuPDF is not installed. PDF previews will be disabled.\n\nPlease install it for the full experience:\npip install PyMuPDF"
            )

        # --- Configure Main Grid Layout ---
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1) # Make the center area expand.

        self._create_widgets()

    def _create_widgets(self):
        """Create and arrange all the GUI widgets in the window."""

        # --- Top Frame for Folder Selection ---
        top_frame = ctk.CTkFrame(self, fg_color="transparent")
        top_frame.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")
        top_frame.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(top_frame, text="PDF Sorter", font=ctk.CTkFont(size=24, weight="bold")).grid(row=0, column=0, pady=(0, 5))
        ctk.CTkLabel(top_frame, text="Select a source folder with PDFs and destination folders to begin.", font=ctk.CTkFont(size=12)).grid(row=1, column=0)
        
        select_folder_btn = ctk.CTkButton(top_frame, text="Select Source Folder", command=self.select_source_folder, height=35)
        select_folder_btn.grid(row=2, column=0, pady=15)

        # --- Main Display Area (for PDF preview) ---
        self.pdf_preview_label = ctk.CTkLabel(self, text="📄\n\nYour PDF preview will appear here.", font=ctk.CTkFont(size=20), fg_color=("#e0e0e0", "#1E1E1E"), corner_radius=10)
        self.pdf_preview_label.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")
        
        # --- Info & Navigation Frame ---
        info_nav_frame = ctk.CTkFrame(self, fg_color="transparent")
        info_nav_frame.grid(row=2, column=0, padx=20, pady=(10, 5), sticky="ew")
        info_nav_frame.grid_columnconfigure(1, weight=1) # Center the labels

        self.prev_btn = ctk.CTkButton(info_nav_frame, text="⬅️", font=ctk.CTkFont(size=20), command=self.prev_file, width=50, height=50, state="disabled")
        self.prev_btn.grid(row=0, column=0, rowspan=2)

        self.filename_label = ctk.CTkLabel(info_nav_frame, text="File: N/A", font=ctk.CTkFont(size=14, weight="bold"))
        self.filename_label.grid(row=0, column=1)

        self.progress_label = ctk.CTkLabel(info_nav_frame, text="PDF: 0 of 0", font=ctk.CTkFont(size=12))
        self.progress_label.grid(row=1, column=1)

        self.next_btn = ctk.CTkButton(info_nav_frame, text="➡️", font=ctk.CTkFont(size=20), command=self.next_file, width=50, height=50, state="disabled")
        self.next_btn.grid(row=0, column=2, rowspan=2)

        # --- Destination Buttons Frame ---
        self.button_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.button_frame.grid(row=3, column=0, padx=20, pady=(5, 20), sticky="ew")

    def select_source_folder(self):
        """Opens a dialog to select the source folder containing PDF files."""
        folder = filedialog.askdirectory(title="Select Folder with PDFs")
        if not folder:
            return

        self.source_folder = folder
        try:
            all_files = os.listdir(self.source_folder)
            self.pdf_list = sorted([f for f in all_files if f.lower().endswith(".pdf")])
            self.total_files = len(self.pdf_list)
        except FileNotFoundError:
            messagebox.showerror("Error", "Source folder not found.")
            return

        if not self.pdf_list:
            messagebox.showinfo("No Files Found", "No PDF files were found in the selected folder.")
            return

        self.get_destination_folders()
        self.current_index = 0
        self.display_current_file()

    def get_destination_folders(self):
        """Prompts the user for the number of destination folders and their paths."""
        num_folders = simpledialog.askinteger("Destination Folders", "How many destination folders do you need?", minvalue=1, parent=self)
        if num_folders is None:
            self.pdf_list = []
            self.source_folder = ""
            return

        self.destination_folders = []
        for i in range(num_folders):
            folder_path = filedialog.askdirectory(title=f"Select Destination Folder {i+1}")
            if folder_path:
                self.destination_folders.append(folder_path)
            else:
                self.pdf_list = []
                self.source_folder = ""
                return

        self._create_destination_buttons()

    def _create_destination_buttons(self):
        """Clears old buttons and creates new ones for each destination folder."""
        for widget in self.button_frame.winfo_children():
            widget.destroy()
        
        if not self.destination_folders:
            return

        num_cols = len(self.destination_folders)
        self.button_frame.grid_columnconfigure(list(range(num_cols)), weight=1)

        for i, folder in enumerate(self.destination_folders):
            folder_name = os.path.basename(folder)
            btn = ctk.CTkButton(self.button_frame, text=folder_name, command=lambda f=folder: self.move_file(f), height=35)
            btn.grid(row=0, column=i, padx=5, pady=5, sticky="ew")

    def display_current_file(self):
        """Updates the UI to show a preview and info for the current PDF file."""
        if not self.pdf_list:
            self.pdf_preview_label.configure(text="🎉\n\nAll PDFs have been sorted!", image=None)
            self.filename_label.configure(text="File: Done!")
            self.progress_label.configure(text=f"PDF: {self.total_files} of {self.total_files}")
            self.prev_btn.configure(state="disabled")
            self.next_btn.configure(state="disabled")
            return

        self.prev_btn.configure(state="normal")
        self.next_btn.configure(state="normal")

        if self.current_index >= len(self.pdf_list):
            self.current_index = len(self.pdf_list) - 1

        current_filename = self.pdf_list[self.current_index]
        self.filename_label.configure(text=f"File: {current_filename}")
        self.progress_label.configure(text=f"PDF: {self.current_index + 1} of {len(self.pdf_list)}")
        
        # --- PDF Preview Logic ---
        if pymupdf_available:
            try:
                pdf_path = os.path.join(self.source_folder, current_filename)
                doc = fitz.open(pdf_path)
                page = doc.load_page(0)  # Load the first page
                
                # Render page to a pixmap (an image format)
                pix = page.get_pixmap(dpi=150)
                doc.close()
                
                # Convert pixmap to a PIL Image
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
                # Create a CTkImage for display
                ctk_img = ctk.CTkImage(light_image=img, dark_image=img, size=(pix.width / 2, pix.height / 2))
                
                self.pdf_preview_label.configure(text="", image=ctk_img)
            except Exception as e:
                print(f"Error rendering PDF {current_filename}: {e}")
                self.pdf_preview_label.configure(text=f"📄\n\nCould not preview:\n{current_filename}", image=None)
        else:
            # Fallback if PyMuPDF is not installed
            self.pdf_preview_label.configure(text=f"📄\n\n{current_filename}", image=None)


    def move_file(self, destination_folder):
        """Moves the current PDF file to the specified destination folder."""
        if not self.pdf_list:
            return

        source_path = os.path.join(self.source_folder, self.pdf_list[self.current_index])
        destination_path = os.path.join(destination_folder, self.pdf_list[self.current_index])

        try:
            if os.path.exists(destination_path):
                response = messagebox.askyesno("File Exists", f"'{os.path.basename(destination_path)}' already exists.\nDo you want to overwrite it?")
                if not response:
                    return

            shutil.move(source_path, destination_folder)
            del self.pdf_list[self.current_index]
            self.display_current_file()
            
        except Exception as e:
            messagebox.showerror("Error", f"Could not move file: {e}")

    def next_file(self):
        """Navigates to the next file in the list."""
        if self.current_index < len(self.pdf_list) - 1:
            self.current_index += 1
            self.display_current_file()

    def prev_file(self):
        """Navigates to the previous file in the list."""
        if self.current_index > 0:
            self.current_index -= 1
            self.display_current_file()

if __name__ == "__main__":
    app = PDFSorter()
    app.mainloop()
