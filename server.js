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
    const parseResult = parseIconsFromJS(fileContent);
    
    res.json({ 
      icons: parseResult.icons,
      originalContent: fileContent,
      families: parseResult.families
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
  const families = {};
  
  // More robust IIFE splitting - look for the complete IIFE pattern
  const iifePattern = /\(function \(\) \{\s*'use strict';([\s\S]*?)\}\(\)\);/g;
  let iifeMatch;
  
  console.log('Starting to parse Font Awesome file...');
  
  while ((iifeMatch = iifePattern.exec(content)) !== null) {
    const iifeContent = iifeMatch[1];
    
    // Find the bunker call to determine family prefix
    const bunkerMatch = iifeContent.match(/bunker\(\(\) => \{\s*defineIcons\('([^']+)'/);
    if (!bunkerMatch) {
      console.log('Skipping IIFE block without defineIcons call');
      continue;
    }
    
    const familyPrefix = bunkerMatch[1];
    console.log(`Processing family: ${familyPrefix}`);
    
    // Extract icons object from this block
    const iconsObjectMatch = iifeContent.match(/var icons = \{([\s\S]*?)\};/);
    if (!iconsObjectMatch) {
      console.log(`No icons object found in ${familyPrefix} family`);
      families[familyPrefix] = [];
      continue;
    }
    
    const iconsContent = iconsObjectMatch[1].trim();
    
    if (!iconsContent || iconsContent === '') {
      console.log(`Empty icons object in ${familyPrefix} family`);
      families[familyPrefix] = [];
      continue;
    }
    
    // Parse individual icons in this family
    const iconPattern = /"([a-z0-9-]+)":\s*\[\s*(\d+),\s*(\d+),\s*(?:\[[^\]]*\]|\[\]),\s*"([^"]+)",\s*"([^"]*)"\s*\]/g;
    
    let match;
    const familyIcons = [];
    
    while ((match = iconPattern.exec(iconsContent)) !== null) {
      const iconName = match[1];
      const width = parseInt(match[2]);
      const height = parseInt(match[3]);
      const unicode = match[4];
      const svgPath = match[5];
      
      if (iconName && unicode) {
        const iconData = {
          name: iconName,
          unicode: unicode,
          displayName: `${iconName} (${familyPrefix})`,
          width: width,
          height: height,
          svgPath: svgPath,
          family: familyPrefix,
          fullDefinition: match[0]
        };
        
        icons.push(iconData);
        familyIcons.push(iconData);
      }
    }
    
    families[familyPrefix] = familyIcons;
    console.log(`Found ${familyIcons.length} icons in ${familyPrefix} family`);
  }

  console.log(`Total found: ${icons.length} icons across ${Object.keys(families).length} families`);
  console.log('Families:', Object.keys(families));
  
  return {
    icons: icons.sort((a, b) => a.displayName.localeCompare(b.displayName)),
    families: families
  };
}

function generateCustomFontAwesome(originalContent, selectedIcons) {
  console.log(`Generating custom file with ${selectedIcons.length} selected icons`);
  
  // Group selected icons by family
  const selectedByFamily = {};
  selectedIcons.forEach(icon => {
    if (!selectedByFamily[icon.family]) {
      selectedByFamily[icon.family] = [];
    }
    selectedByFamily[icon.family].push(icon);
  });
  
  console.log('Selected icons by family:', Object.keys(selectedByFamily).map(family => 
    `${family}: ${selectedByFamily[family].length}`
  ));
  
  // Use more precise IIFE pattern matching
  const iifePattern = /(\(function \(\) \{\s*'use strict';)([\s\S]*?)(\}\(\)\);)/g;
  let customContent = '';
  let lastIndex = 0;
  let match;
  
  // Process each IIFE block
  while ((match = iifePattern.exec(originalContent)) !== null) {
    // Add content before this IIFE (like header comments)
    customContent += originalContent.substring(lastIndex, match.index);
    
    const iifeStart = match[1];
    const iifeBody = match[2];
    const iifeEnd = match[3];
    
    // Find which family this IIFE belongs to
    const bunkerMatch = iifeBody.match(/bunker\(\(\) => \{\s*defineIcons\('([^']+)'/);
    if (!bunkerMatch) {
      // Keep non-icon IIFE blocks as-is (like the main framework code)
      customContent += match[0];
      lastIndex = match.index + match[0].length;
      continue;
    }
    
    const familyPrefix = bunkerMatch[1];
    console.log(`Processing IIFE for family: ${familyPrefix}`);
    
    const selectedForThisFamily = selectedByFamily[familyPrefix] || [];
    
    if (selectedForThisFamily.length === 0) {
      console.log(`No icons selected for ${familyPrefix}, skipping entire IIFE`);
      lastIndex = match.index + match[0].length;
      continue; // Skip this entire IIFE block
    }
    
    // Find and replace the icons object
    const iconsObjectMatch = iifeBody.match(/([\s\S]*?)(var icons = \{)([\s\S]*?)(\};)([\s\S]*)/);
    if (!iconsObjectMatch) {
      console.log(`Could not find icons object in ${familyPrefix} family`);
      customContent += match[0];
      lastIndex = match.index + match[0].length;
      continue;
    }
    
    const beforeIcons = iconsObjectMatch[1];
    const iconsDeclaration = iconsObjectMatch[2];
    const iconsSuffix = iconsObjectMatch[4];
    const afterIcons = iconsObjectMatch[5];
    
    // Build new icons content with selected icons
    const newIconsContent = selectedForThisFamily.map(icon => {
      return `    "${icon.name}": [${icon.width}, ${icon.height}, [], "${icon.unicode}", "${icon.svgPath}"]`;
    }).join(',\n');
    
    // Reconstruct the IIFE with filtered icons
    const newIifeBody = beforeIcons + iconsDeclaration + '\n' + newIconsContent + '\n  ' + iconsSuffix + afterIcons;
    
    customContent += iifeStart + newIifeBody + iifeEnd;
    lastIndex = match.index + match[0].length;
    
    console.log(`Kept ${selectedForThisFamily.length} icons in ${familyPrefix} family`);
  }
  
  // Add any remaining content after the last IIFE
  customContent += originalContent.substring(lastIndex);
  
  console.log('Custom Font Awesome file generated successfully');
  console.log('Original size:', originalContent.length, 'bytes');
  console.log('Custom size:', customContent.length, 'bytes');
  console.log('Size reduction:', Math.round((1 - customContent.length/originalContent.length) * 100) + '%');
  
  return customContent;
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Font Awesome Customizer running at http://localhost:${port}`);
});