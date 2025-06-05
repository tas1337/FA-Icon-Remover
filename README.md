# Font Awesome Customizer

A Docker-based web application that allows you to upload a Font Awesome JavaScript file, preview all available icons, select only the ones you need, and download a custom optimized version.

## Features

- 📁 **Easy Upload**: Drag & drop or browse to upload your Font Awesome JS file
- 🔍 **Search & Filter**: Find specific icons quickly with the search function
- ✅ **Visual Selection**: See all icons with previews and select the ones you need
- 📊 **Real-time Stats**: See total icons, selected count, and estimated size reduction
- 🎯 **Bulk Actions**: Select all, select none, or use search to filter selections
- 📥 **Custom Download**: Generate and download your optimized Font Awesome file

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone or create the project structure:**
```bash
mkdir fontawesome-customizer
cd fontawesome-customizer
```

2. **Create all the files** (Dockerfile, package.json, server.js, etc.) as shown in the artifacts above.

3. **Create the public directory and add index.html:**
```bash
mkdir public
# Add the index.html file to the public directory
```

4. **Build and run with Docker Compose:**
```bash
docker-compose up --build
```

5. **Access the application:**
Open your browser and go to `http://localhost:3000`

### Using Docker directly

```bash
# Build the image
docker build -t fontawesome-customizer .

# Run the container
docker run -p 3000:3000 fontawesome-customizer
```

## How to Use

1. **Upload your Font Awesome JS file** - Drag & drop or click to browse
2. **Wait for parsing** - The app will extract all available icons
3. **Select your icons** - Use the search box to find specific icons, then check the ones you want
4. **Review stats** - See how many icons you've selected and estimated file size reduction
5. **Generate custom file** - Click "Generate Custom File" button
6. **Download** - Click the download button to get your optimized Font Awesome file

## File Structure

```
fontawesome-customizer/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.js
├── README.md
├── public/
│   └── index.html
└── uploads/ (created automatically)
```

## Technical Details

### Supported Font Awesome Formats
- Font Awesome 5.x and 6.x JavaScript files
- Both free and pro versions (though pro icons may require different parsing)

### Icon Detection
The app uses multiple regex patterns to detect icon definitions in JavaScript files:
- Standard FontAwesome icon object patterns
- Unicode-based definitions
- Various naming conventions (camelCase, kebab-case)

### Optimization Process
1. **Parse**: Extract all icon definitions from the original file
2. **Filter**: Keep only selected icons and core FontAwesome functionality
3. **Clean**: Remove unused definitions and fix formatting
4. **Generate**: Create the optimized file for download

## Environment Variables

- `NODE_ENV`: Set to 'production' for production deployment
- `PORT`: Server port (default: 3000)

## Security Notes

- File uploads are limited to 10MB
- Only JavaScript files are accepted
- Uploaded files are automatically cleaned up after processing
- CORS is enabled for development (disable in production if needed)

## Troubleshooting

### Icons not displaying correctly
- Make sure your Font Awesome file is a complete, valid JavaScript file
- Some heavily minified files might not parse correctly
- Try with the original unminified version if available

### File upload fails
- Check file size (max 10MB)
- Ensure file has .js extension
- Verify the file is a valid Font Awesome JavaScript file

### Generated file doesn't work
- The optimization process is complex and may not work perfectly with all Font Awesome versions
- Always test the generated file in your application
- Keep a backup of your original file

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is for educational and utility purposes. Font Awesome is a separate product with its own licensing terms.