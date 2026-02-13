# GD Icon Maker API

## Endpoint
`POST /api/submit.php`

## Parameters
All sent as `multipart/form-data`

### Required:
- `image` (file) - Square image (1:1 ratio, any size)
- `name` (string) - Pack name
- `author` (string) - Author name

### Optional:
- `packIcon` (file) - Custom pack.png (will be resized to 336x336 with watermark)
- `p1Color` (string) - Hex color for cube/ball (e.g., "#FF0000")
- `p2Color` (string) - Hex color for wave (e.g., "#00FF00")
- `noBall` (string) - Set to "true" to skip ball gamemode icons
- `ballOnly` (string) - Set to "true" to generate ONLY ball gamemode icons
- `noWave` (string) - Set to "true" to skip wave gamemode icons
- `waveOnly` (string) - Set to "true" to generate ONLY wave gamemode icons
- `noCube` (string) - Set to "true" to skip cube gamemode icons
- `cubeOnly` (string) - Set to "true" to generate ONLY cube gamemode icons

## Response
Returns ZIP file directly for download on success.

On error, returns JSON:
```json
{
  "success": false,
  "error": "error message here"
}
```

## Example Usage

### cURL:
```bash
curl -X POST https://gdiconmaker.rf.gd/api/submit.php \
  -F "image=@myicon.png" \
  -F "name=My Cool Pack" \
  -F "author=YourName" \
  -o pack.zip
```

### With custom pack icon:
```bash
curl -X POST https://gdiconmaker.rf.gd/api/submit.php \
  -F "image=@myicon.png" \
  -F "name=My Cool Pack" \
  -F "author=YourName" \
  -F "packIcon=@custom_pack.png" \
  -o pack.zip
```

### With color customization:
```bash
curl -X POST https://gdiconmaker.rf.gd/api/submit.php \
  -F "image=@myicon.png" \
  -F "name=My Cool Pack" \
  -F "author=YourName" \
  -F "p1Color=#FF0000" \
  -F "p2Color=#00FF00" \
  -o pack.zip
```

### Ball only mode:
```bash
curl -X POST https://gdiconmaker.rf.gd/api/submit.php \
  -F "image=@myicon.png" \
  -F "name=Ball Pack" \
  -F "author=YourName" \
  -F "ballOnly=true" \
  -o pack.zip
```

### Wave only mode:
```bash
curl -X POST https://gdiconmaker.rf.gd/api/submit.php \
  -F "image=@myicon.png" \
  -F "name=Wave Pack" \
  -F "author=YourName" \
  -F "waveOnly=true" \
  -o pack.zip
```

### Cube only mode:
```bash
curl -X POST https://gdiconmaker.rf.gd/api/submit.php \
  -F "image=@myicon.png" \
  -F "name=Cube Pack" \
  -F "author=YourName" \
  -F "cubeOnly=true" \
  -o pack.zip
```

### No ball mode:
```bash
curl -X POST https://gdiconmaker.rf.gd/api/submit.php \
  -F "image=@myicon.png" \
  -F "name=No Ball Pack" \
  -F "author=YourName" \
  -F "noBall=true" \
  -o pack.zip
```

## Notes
- Image MUST be 1:1 ratio (square)
- Gamemode flags are mutually exclusive (e.g., can't use both `ballOnly` and `waveOnly`)
- If no gamemode flags are set, all gamemodes are generated
- Color format: hex colors with # (e.g., "#FFFFFF")
- Colors use HSV hue-shift for conversion
- ZIP is deleted after download
- No rate limiting (yet lol)
