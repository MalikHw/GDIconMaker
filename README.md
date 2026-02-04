# GD Custom Icons Maker

**Create custom Geometry Dash icon packs with ease!**

Made with ❤️ by **MalikHw47**

## 🌟 Features

- ✅ Upload any image (even non-square!)
- ✅ Interactive crop tool for non-square images
- ✅ Works with images of any size (with quality warning for small images)
- ✅ Auto-generates pack ID from pack name
- ✅ Beautiful animated RGB gradient background
- ✅ Nerd Fonts icons throughout
- ✅ Donation prompt to support the developer
- ✅ Fully responsive design

## 📁 VPS File Structure

```
/var/www/html/gdiconmaker/  (or your web root)
│
├── index.html              # Main webpage with upload form
├── style.css               # Animated styling with RGB gradient
├── script.js               # Client-side validation, crop UI, and AJAX
├── process.php             # Server-side image processing (FIXED for shared hosting!)
│
├── pack.json               # Template pack.json (only id/author/name modified)
├── pack.png                # Pack thumbnail (also used as favicon)
│
├── player_01-hd.png        # HD template background
├── player_01-hd.plist      # HD plist configuration
│
├── player_01-uhd.png       # UHD template background
├── player_01-uhd.plist     # UHD plist configuration
│
└── downloads/              # Generated ZIP files (auto-created)
    └── [user_packs].zip
```

## 🚀 Setup Instructions for InfinityFree (or any shared hosting)

### 1. Requirements
- PHP 7.4+ with GD extension enabled (usually enabled by default)
- Web hosting with file upload support
- Write permissions on the web directory

### 2. Installation

1. **Upload all files** to your web root via FTP or File Manager:
   - Extract the ZIP
   - Upload all files to `htdocs` or `public_html`

2. **Set permissions** (if using FTP):
   ```bash
   chmod 755 downloads/
   ```

3. **Verify PHP GD** is enabled:
   - Create a file `phpinfo.php` with `<?php phpinfo(); ?>`
   - Look for "GD Support" = enabled

### 3. Configuration

Your `pack.json` should look like this:
```json
{
    "id": "default_pack",
    "author": "Default Author",
    "name": "Default Pack Name",
    "version": "1.0",
    "description": "Custom description here"
}
```

The script will ONLY modify:
- `id` → Auto-generated as `gdiconmaker.[packname]`
- `author` → `[YourName] (from gdiconmaker.rf.gd)`
- `name` → User's pack name

All other fields stay untouched!

### 4. Template Files

Replace these with your actual Geometry Dash templates:
- `player_01-hd.png` - HD resolution background
- `player_01-uhd.png` - UHD resolution background  
- `player_01-hd.plist` - HD configuration
- `player_01-uhd.plist` - UHD configuration
- `pack.png` - Pack thumbnail

## 📝 How It Works

1. **Upload** - User uploads any image (even non-square)
2. **Crop** (if needed) - Interactive crop tool for non-square images with 1:1 ratio
3. **Warning** - Shows warning if image < 108x108px ("quality will be shit")
4. **Process**:
   - **HD**: Resize to 55x56px → Rotate 90° → Place at (71,5) on player_01-hd.png
   - **UHD**: Resize to 108x108px → No rotation → Place at (37,8) on player_01-uhd.png
5. **Pack Creation**:
   - Modifies pack.json with user's info
   - Auto-generates ID as `gdiconmaker.[name]`
   - Creates ZIP with proper structure
6. **Download** - User gets donation prompt, then downloads their pack!

## 🎨 Features Breakdown

### Auto-Generated Pack ID
No manual ID input needed! The script automatically creates:
- Pack Name: "My Cool Pack" → ID: `gdiconmaker.MyCoolPack`

### Image Crop Tool
- Drag-and-drop crop area
- Fixed 1:1 ratio
- Visual preview before processing

### Quality Warnings
- Shows warning for images < 108x108px
- Still allows processing (user's choice!)

### Donation Integration
- Popup after successful generation
- Links to your donation page
- Non-intrusive (optional)

## 🔧 Troubleshooting

### "Failed to create temporary directory"
- **Fix**: Check that your hosting allows directory creation
- **InfinityFree**: This should work fine now (uses local temp dir, not sys_get_temp_dir)

### "Failed to load template"
- **Fix**: Make sure all PNG/plist files are in the root directory

### "Permission denied"
- **Fix**: Check that `downloads/` folder has write permissions (755)

### Images not appearing correctly
- **Fix**: Verify coordinates match your template dimensions
- HD: Icon at (71, 5) to (125, 60)
- UHD: Icon at (37, 8) to (144, 115)

### ZIP download fails
- **Fix**: Check `downloads/` directory exists and is writable

## 🌐 Connect with MalikHw47

- 🎥 **YouTube**: [@MalikHw47](https://youtube.com/@MalikHw47)
- 🎮 **Twitch**: [MalikHw47](https://twitch.tv/MalikHw47)
- 💻 **GitHub**: [MalikHw](https://github.com/MalikHw)
- 🌍 **Website**: [malikhw.github.io](https://malikhw.github.io)
- ❤️ **Donate**: [malikhw.github.io/donate](https://malikhw.github.io/donate)

---

## 📜 License

Free to use! If you found this helpful, please consider:
- ⭐ Starring the repo
- 💝 Supporting via donation
- 🔗 Sharing with others

---

**Made with ❤️ by MalikHw47 | gdiconmaker.rf.gd**
