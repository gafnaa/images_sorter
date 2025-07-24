import os
import shutil
import datetime
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from customtkinter import *

class PDFSorterGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("PDF Sorter")
        self.root.geometry("600x450")
        self.root.configure(fg_color="#0F0F0F") # Dark background

        self.source_folder = ""
        self.destination_folder = ""

        # --- UI Elements ---

        # Title Label
        self.title_label = CTkLabel(root, text="PDF Sorter", font=("Segoe UI", 24, "bold"), text_color="white", fg_color="#0F0F0F")
        self.title_label.pack(pady=15)

        # Source Folder Selection
        self.source_frame = CTkFrame(root, fg_color="#0F0F0F")
        self.source_frame.pack(pady=10, fill="x", padx=20)

        self.source_label = CTkLabel(self.source_frame, text="Source Folder:", font=("Segoe UI", 12), text_color="white")
        self.source_label.pack(side="left", padx=5)

        self.source_entry = CTkEntry(self.source_frame, width=300, font=("Segoe UI", 12), fg_color="#1E1E1E", text_color="white", border_color="#3695FF")
        self.source_entry.pack(side="left", expand=True, fill="x", padx=5)

        self.browse_source_btn = CTkButton(self.source_frame, text="Browse", command=self.select_source_folder, font=("Segoe UI", 12), fg_color="#3695FF", text_color="white", corner_radius=15)
        self.browse_source_btn.pack(side="left", padx=5)

        # Destination Folder Selection
        self.dest_frame = CTkFrame(root, fg_color="#0F0F0F")
        self.dest_frame.pack(pady=10, fill="x", padx=20)

        self.dest_label = CTkLabel(self.dest_frame, text="Destination Folder:", font=("Segoe UI", 12), text_color="white")
        self.dest_label.pack(side="left", padx=5)

        self.dest_entry = CTkEntry(self.dest_frame, width=300, font=("Segoe UI", 12), fg_color="#1E1E1E", text_color="white", border_color="#3695FF")
        self.dest_entry.pack(side="left", expand=True, fill="x", padx=5)

        self.browse_dest_btn = CTkButton(self.dest_frame, text="Browse", command=self.select_destination_folder, font=("Segoe UI", 12), fg_color="#3695FF", text_color="white", corner_radius=15)
        self.browse_dest_btn.pack(side="left", padx=5)

        # Sort Button
        self.sort_btn = CTkButton(root, text="Sort PDFs", command=self.sort_pdfs, font=("Segoe UI", 14, "bold"), fg_color="#3695FF", text_color="white", corner_radius=20)
        self.sort_btn.pack(pady=20)

        # Status Label
        self.status_label = CTkLabel(root, text="", font=("Segoe UI", 10), text_color="#808080", fg_color="#0F0F0F")
        self.status_label.pack(pady=10)

    def select_source_folder(self):
        folder_selected = filedialog.askdirectory()
        if folder_selected:
            self.source_folder = folder_selected
            self.source_entry.delete(0, tk.END)
            self.source_entry.insert(0, self.source_folder)
            self.status_label.configure(text=f"Source folder selected: {os.path.basename(self.source_folder)}")

    def select_destination_folder(self):
        folder_selected = filedialog.askdirectory()
        if folder_selected:
            self.destination_folder = folder_selected
            self.dest_entry.delete(0, tk.END)
            self.dest_entry.insert(0, self.destination_folder)
            self.status_label.configure(text=f"Destination folder selected: {os.path.basename(self.destination_folder)}")

    def sort_pdfs(self):
        if not self.source_folder or not self.destination_folder:
            messagebox.showwarning("Missing Information", "Please select both source and destination folders.")
            return

        if not os.path.isdir(self.source_folder):
            messagebox.showerror("Error", f"Source directory '{self.source_folder}' not found.")
            return

        # Ensure the base destination directory exists
        os.makedirs(self.destination_folder, exist_ok=True)

        pdf_count = 0
        errors = []

        for filename in os.listdir(self.source_folder):
            if filename.lower().endswith(".pdf"):
                file_path = os.path.join(self.source_folder, filename)

                try:
                    # Using modification time for sorting
                    timestamp = os.path.getmtime(file_path)
                    creation_date = datetime.datetime.fromtimestamp(timestamp)

                    # Create subdirectories: YYYY/MM/DD
                    year_folder = os.path.join(self.destination_folder, creation_date.strftime("%Y"))
                    month_folder = os.path.join(year_folder, creation_date.strftime("%m"))
                    day_folder = os.path.join(month_folder, creation_date.strftime("%d"))

                    os.makedirs(day_folder, exist_ok=True)

                    destination_path = os.path.join(day_folder, filename)
                    shutil.move(file_path, destination_path)
                    pdf_count += 1
                    self.status_label.configure(text=f"Moved '{filename}' to {creation_date.strftime('%Y/%m/%d')}")
                    self.root.update_idletasks() # Update GUI to show progress

                except Exception as e:
                    errors.append(f"Error processing '{filename}': {e}")
                    self.status_label.configure(text=f"Error with '{filename}'")
                    self.root.update_idletasks()

        if errors:
            messagebox.showerror("Sorting Complete with Errors", f"Sorted {pdf_count} PDFs.\n\nErrors encountered:\n" + "\n".join(errors))
        else:
            messagebox.showinfo("Sorting Complete", f"Successfully sorted {pdf_count} PDF files.")
            self.status_label.configure(text=f"Successfully sorted {pdf_count} PDF files.")

if __name__ == "__main__":
    set_appearance_mode("dark") # Set custom theme to dark
    set_default_color_theme("blue") # Use a blue theme

    root = CTk()
    app = PDFSorterGUI(root)
    root.mainloop()
