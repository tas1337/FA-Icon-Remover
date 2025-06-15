const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve search-config.js explicitly
app.get('/search-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'search-config.js'));
});

// Upload and parse Font Awesome file
app.post('/upload', upload.single('faFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Parse Font Awesome icons from the JS file
    const icons = parseIconsFromJS(fileContent);
    
    res.json({ 
      icons: icons,
      originalContent: fileContent
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

// Generate custom Font Awesome file
app.post('/generate', (req, res) => {
  try {
    const { originalContent, selectedIcons } = req.body;
    
    if (!originalContent || !selectedIcons) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const customContent = generateCustomFontAwesome(originalContent, selectedIcons);
    
    res.json({ content: customContent });
  } catch (error) {
    console.error('Error generating custom file:', error);
    res.status(500).json({ error: 'Error generating custom file' });
  }
});

function parseIconsFromJS(content) {
  const icons = [];
  
  // Font Awesome 6.x format: "iconName": [width, height, aliases, unicode, svgPath]
  // Updated regex to capture width, height, unicode, and SVG path
  const fa6Pattern = /"([a-z0-9-]+)":\s*\[\s*(\d+),\s*(\d+),\s*(?:\[[^\]]*\]|\[\]),\s*"([^"]+)",\s*"([^"]*)"\s*\]/g;
  
  let match;
  while ((match = fa6Pattern.exec(content)) !== null) {
    const iconName = match[1];
    const width = parseInt(match[2]);
    const height = parseInt(match[3]);
    const unicode = match[4];
    const svgPath = match[5];
    
    if (iconName && unicode && !icons.some(icon => icon.name === iconName)) {
      icons.push({
        name: iconName,
        unicode: unicode,
        displayName: iconName,
        width: width,
        height: height,
        svgPath: svgPath
      });
    }
  }

  // Fallback patterns for other FontAwesome formats
  if (icons.length === 0) {
    console.log('Trying fallback patterns...');
    
    // Alternative pattern for different FA formats
    const fallbackPattern1 = /"([a-z0-9-]+)":\s*\[\s*\d+,\s*\d+,\s*(?:\[[^\]]*\]|\[\]),\s*"([^"]+)"/g;
    
    while ((match = fallbackPattern1.exec(content)) !== null) {
      const iconName = match[1];
      const unicode = match[2];
      
      if (iconName && unicode && !icons.some(icon => icon.name === iconName)) {
        icons.push({
          name: iconName,
          unicode: unicode,
          displayName: iconName,
          width: 512,
          height: 512,
          svgPath: '' // No SVG path available in this format
        });
      }
    }
    
    // Pattern for fa-icon definitions with unicode
    const fallbackPattern2 = /["']([a-z0-9-]+)["']\s*:\s*{[^}]*unicode:\s*["']([^"']+)["'][^}]*}/g;
    
    while ((match = fallbackPattern2.exec(content)) !== null) {
      const iconName = match[1];
      const unicode = match[2];
      
      if (iconName && unicode && !icons.some(icon => icon.name === iconName)) {
        icons.push({
          name: iconName,
          unicode: unicode,
          displayName: iconName,
          width: 512,
          height: 512,
          svgPath: ''
        });
      }
    }
  }

  console.log(`Found ${icons.length} icons in Font Awesome file`);
  console.log('Sample icons:', icons.slice(0, 3).map(i => ({name: i.name, hasSvg: !!i.svgPath})));
  
  return icons.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function generateCustomFontAwesome(originalContent, selectedIcons) {
  let customContent = originalContent;
  
  const selectedNames = selectedIcons.map(icon => icon.name);
  console.log(`Generating custom file with ${selectedNames.length} selected icons:`, selectedNames.slice(0, 10));
  
  // Font Awesome 6.x format: Remove icon definitions that aren't selected
  // Pattern: "iconName": [width, height, aliases, unicode, svgPath],
  const fa6IconPattern = /"([a-z0-9-]+)":\s*\[\s*\d+,\s*\d+,\s*(?:\[[^\]]*\]|\[\]),\s*"[^"]+",\s*"[^"]*"\s*\],?/g;
  
  let removedCount = 0;
  let keptCount = 0;
  
  customContent = customContent.replace(fa6IconPattern, (match, iconName) => {
    if (selectedNames.includes(iconName)) {
      console.log(`Keeping icon: ${iconName}`);
      keptCount++;
      return match; // Keep this icon
    } else {
      console.log(`Removing icon: ${iconName}`);
      removedCount++;
      return ''; // Remove this icon
    }
  });
  
  // Also handle the fallback pattern
  const fallbackPattern = /"([a-z0-9-]+)":\s*\[\s*\d+,\s*\d+,\s*(?:\[[^\]]*\]|\[\]),\s*"[^"]+"\s*\],?/g;
  
  customContent = customContent.replace(fallbackPattern, (match, iconName) => {
    if (selectedNames.includes(iconName)) {
      keptCount++;
      return match;
    } else {
      removedCount++;
      return '';
    }
  });
  
  console.log(`Icon processing complete: kept ${keptCount}, removed ${removedCount}`);
  
  // Clean up formatting issues from removals
  customContent = customContent.replace(/,\s*,/g, ','); // Remove double commas
  customContent = customContent.replace(/{\s*,/g, '{'); // Remove leading commas in objects
  customContent = customContent.replace(/,\s*}/g, '}'); // Remove trailing commas before closing braces
  customContent = customContent.replace(/,\s*\]/g, ']'); // Remove trailing commas before closing arrays
  customContent = customContent.replace(/:\s*,/g, ': '); // Clean up empty values
  
  // Remove any empty icon objects that might be left
  customContent = customContent.replace(/var\s+icons\s*=\s*{\s*};?/g, 'var icons = {};');
  
  console.log('Custom Font Awesome file generated successfully');
  console.log('Original size:', originalContent.length, 'bytes');
  console.log('Custom size:', customContent.length, 'bytes');
  console.log('Size reduction:', Math.round((1 - customContent.length/originalContent.length) * 100) + '%');
  
  return customContent;
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Font Awesome Customizer running at http://localhost:${port}`);
});