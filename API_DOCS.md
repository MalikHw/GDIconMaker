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
- `noBall` (string) - Set to "true" to skip ball gamemode icons
- `ballOnly` (string) - Set to "true" to generate ONLY ball gamemode icons

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

### Ball only mode:
```bash
curl -X POST https://gdiconmaker.rf.gd/api/submit.php \
  -F "image=@myicon.png" \
  -F "name=Ball Pack" \
  -F "author=YourName" \
  -F "ballOnly=true" \
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
- Only one gamemode at a time (both, cube only, or ball only)
- `noBall` and `ballOnly` are mutually exclusive
- ZIP is deleted after download
- No rate limiting (yet lol)
