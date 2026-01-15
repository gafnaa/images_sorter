from PIL import Image, ImageDraw

def create_icon():
    # Create a 256x256 image
    size = (256, 256)
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Draw rounded square (Folder)
    # Front
    d.rounded_rectangle([(20, 60), (236, 236)], radius=40, fill="#3b82f6", outline="#1e40af", width=2)
    
    # "Image" representation (Sun)
    d.ellipse([(100, 100), (156, 156)], fill="#fbbf24")
    
    img.save('icon.ico', format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    print("icon.ico created.")

if __name__ == "__main__":
    create_icon()
