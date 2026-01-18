from PIL import Image
import cairosvg
import io

def svg_to_ico(svg_path="logo.svg", ico_path="icon.ico"):
    # Render SVG to PNG bytes
    png_bytes = cairosvg.svg2png(url=svg_path, output_width=256, output_height=256)

    # Load PNG into PIL Image
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")

    # Save as ICO with multiple sizes
    img.save(
        ico_path,
        format="ICO",
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    )

    print(f"{ico_path} created successfully from {svg_path}")

if __name__ == "__main__":
    svg_to_ico("logo.svg", "icon.ico")
