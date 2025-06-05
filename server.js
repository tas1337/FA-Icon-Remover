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
  const fa6Pattern = /"([a-z0-9-]+)":\s*\[\s*\d+,\s*\d+,\s*(?:\[[^\]]*\]|\[\]),\s*"([^"]+)",/g;
  
  let match;
  while ((match = fa6Pattern.exec(content)) !== null) {
    const iconName = match[1];
    const unicode = match[2];
    
    if (iconName && unicode && !icons.some(icon => icon.name === iconName)) {
      icons.push({
        name: iconName,
        unicode: unicode,
        displayName: iconName
      });
    }
  }

  // Fallback patterns for other FontAwesome formats
  if (icons.length === 0) {
    const fallbackPatterns = [
      // Pattern for fa-icon definitions with unicode
      /["']([a-z0-9-]+)["']\s*:\s*{[^}]*unicode:\s*["']([^"']+)["'][^}]*}/g,
      // Pattern for icon objects with iconName property
      /iconName:\s*["']([a-z0-9-]+)["'][^}]*unicode:\s*["']([^"']+)["']/g,
      // Generic object pattern
      /["']([a-z][a-z0-9-]*[a-z0-9])["']\s*:\s*\[[^\]]*\]/g
    ];

    fallbackPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const iconName = match[1];
        const unicode = match[2] || '';
        
        if (iconName && iconName.length > 2 && !icons.some(icon => icon.name === iconName)) {
          icons.push({
            name: iconName,
            unicode: unicode,
            displayName: iconName
          });
        }
      }
    });
  }

  console.log(`Found ${icons.length} icons in Font Awesome file`);
  return icons.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function generateCustomFontAwesome(originalContent, selectedIcons) {
  let customContent = originalContent;
  
  const selectedNames = selectedIcons.map(icon => icon.name);
  console.log(`Generating custom file with ${selectedNames.length} selected icons`);
  
  // Font Awesome 6.x format: Remove icon definitions that aren't selected
  // Pattern: "iconName": [width, height, aliases, unicode, svgPath],
  const fa6IconPattern = /"([a-z0-9-]+)":\s*\[\s*\d+,\s*\d+,\s*(?:\[[^\]]*\]|\[\]),\s*"[^"]+",\s*"[^"]*"\s*\],?/g;
  
  customContent = customContent.replace(fa6IconPattern, (match, iconName) => {
    if (selectedNames.includes(iconName)) {
      return match; // Keep this icon
    }
    return ''; // Remove this icon
  });
  
  // Clean up formatting issues from removals
  customContent = customContent.replace(/,\s*,/g, ','); // Remove double commas
  customContent = customContent.replace(/{\s*,/g, '{'); // Remove leading commas in objects
  customContent = customContent.replace(/,\s*}/g, '}'); // Remove trailing commas before closing braces
  customContent = customContent.replace(/,\s*\]/g, ']'); // Remove trailing commas before closing arrays
  customContent = customContent.replace(/:\s*,/g, ': '); // Clean up empty values
  
  // Remove any empty icon objects that might be left
  customContent = customContent.replace(/var\s+icons\s*=\s*{\s*};?/g, 'var icons = {};');
  
  console.log('Custom Font Awesome file generated successfully');
  return customContent;
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Font Awesome Customizer running at http://localhost:${port}`);
});