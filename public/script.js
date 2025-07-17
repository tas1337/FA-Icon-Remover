// Direct close function for escape key
function closeControlPanel() {
    const controlPanel = document.getElementById('controlPanel');
    const floatingBtn = document.getElementById('floatingControlBtn');
    
    if (controlPanel && floatingBtn) {
        controlPanelOpen = false;
        controlPanel.classList.remove('show');
        floatingBtn.classList.remove('panel-open');
        
        // Hide after animation completes
        setTimeout(() => {
            controlPanel.classList.add('hidden');
        }, 400);
    }
}

// Floating Control Panel Functions
let controlPanelOpen = false;

function toggleControlPanel() {
    const controlPanel = document.getElementById('controlPanel');
    const floatingBtn = document.getElementById('floatingControlBtn');
    
    if (!controlPanel || !floatingBtn) {
        console.error('Control panel elements not found');
        return;
    }
    
    controlPanelOpen = !controlPanelOpen;
    
    if (controlPanelOpen) {
        controlPanel.classList.remove('hidden');
        floatingBtn.classList.add('panel-open');
        
        // Small delay to ensure element is rendered before animation
        setTimeout(() => {
            controlPanel.classList.add('show');
        }, 10);
        
        // Auto-focus search box when panel opens
        setTimeout(() => {
            const searchBox = document.getElementById('searchBox');
            if (searchBox) {
                searchBox.focus();
            }
        }, 200);
        
        // Add escape key listener when panel opens
        document.addEventListener('keyup', handleEscapeKey);
    } else {
        controlPanel.classList.remove('show');
        floatingBtn.classList.remove('panel-open');
        
        // Remove escape key listener when panel closes
        document.removeEventListener('keyup', handleEscapeKey);
        
        // Hide after animation completes
        setTimeout(() => {
            if (!controlPanelOpen) {
                controlPanel.classList.add('hidden');
            }
        }, 400);
    }
}

// Simple escape key handler
function handleEscapeKey(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
        closeControlPanel();
    }
}

let allIcons = [];
let selectedIconsSet = new Set();
let originalContent = '';
let customContent = '';
let currentFilteredIcons = [];
let iconFamilies = {};
let customIcons = []; // Store custom icons separately
let currentFileName = ''; // Track current file name for contextual saves

// File upload handling
const uploadSection = document.getElementById('uploadSection');
const fileInput = document.getElementById('fileInput');

// Drag and drop
uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSection.classList.add('dragover');
});

uploadSection.addEventListener('dragleave', () => {
    uploadSection.classList.remove('dragover');
});

uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSection.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

async function handleFileUpload(file) {
    if (!file.name.endsWith('.js')) {
        alert('Please upload a JavaScript (.js) file');
        return;
    }

    const formData = new FormData();
    formData.append('faFile', file);

    showLoading();

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }

        // Clear previous state when loading new file
        allIcons = result.icons;
        originalContent = result.originalContent;
        iconFamilies = result.families || {};
        selectedIconsSet.clear();
        customIcons = []; // Clear custom icons for new file
        currentFilteredIcons = allIcons;
        currentFileName = file.name; // Store current file name
        customIconUploadSetup = false; // Reset custom icon upload setup

        console.log('Loaded icons:', allIcons.length);
        console.log('Families:', Object.keys(iconFamilies));
        console.log('Sample icon:', allIcons[0]);

        hideLoading();
        showIcons();
        
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading file: ' + error.message);
        hideLoading();
    }
}

function showLoading() {
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('loadingSection').classList.remove('hidden');
    document.getElementById('iconsSection').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingSection').classList.add('hidden');
}

function showIcons() {
    document.getElementById('iconsSection').classList.remove('hidden');
    document.getElementById('floatingControlBtn').classList.remove('hidden');
    renderIcons(allIcons);
    updateStats();
    setupSearch();
    setupCustomIconUpload(); // Initialize custom icon upload
    setupSizeSlider(); // Initialize size slider
    // Auto-load removed - user must manually load selections
}

function downloadCustomFile() {
    const blob = new Blob([customContent], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fontawesome-custom.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function createIconSVG(icon) {
    if (icon.svgPath && icon.svgPath.trim()) {
        // Create SVG element with the extracted path
        return `<svg viewBox="0 0 ${icon.width || 512} ${icon.height || 512}" xmlns="http://www.w3.org/2000/svg">
            <path d="${icon.svgPath}"/>
        </svg>`;
    } else if (icon.unicode) {
        // Fallback to unicode display
        return `<span class="unicode-display" title="Unicode: ${icon.unicode}">&#x${icon.unicode};</span>`;
    } else {
        // Fallback placeholder
        return `<span class="placeholder" title="${icon.displayName}">?</span>`;
    }
}

function getFamilyBadgeColor(family, isCustom = false) {
    if (isCustom) {
        return '#9c27b0'; // Purple for custom icons
    }
    
    const colors = {
        'fab': '#f39c12',  // brands - orange
        'fas': '#3498db',  // solid - blue
        'far': '#9b59b6',  // regular - purple
        'fal': '#1abc9c',  // light - teal
        'fat': '#e74c3c',  // thin - red
        'fad': '#2ecc71'   // duotone - green
    };
    return colors[family] || '#95a5a6'; // default gray
}

function renderIcons(filteredIcons = allIcons) {
    const grid = document.getElementById('iconsGrid');
    grid.innerHTML = '';

    // Group icons by family for better organization
    const iconsByFamily = {};
    const seenIcons = new Set(); // Track icons to prevent duplicates within same family+name combo
    
    filteredIcons.forEach(icon => {
        // Check for duplicates using family+name combination (not just name)
        const iconKey = `${icon.family}-${icon.name}`;
        if (seenIcons.has(iconKey)) {
            console.warn('Duplicate icon detected in rendering:', iconKey);
            return; // Skip duplicate
        }
        seenIcons.add(iconKey);
        
        if (!iconsByFamily[icon.family]) {
            iconsByFamily[icon.family] = [];
        }
        iconsByFamily[icon.family].push(icon);
    });

    // Render each family as a collapsible section
    Object.keys(iconsByFamily).sort().forEach(family => {
        const familySection = document.createElement('div');
        familySection.className = 'family-section';
        familySection.setAttribute('data-family', family);

        const badgeClass = iconsByFamily[family].some(icon => icon.isCustom) ? 'custom' : family;
        const familyDisplayName = iconsByFamily[family].some(icon => icon.isCustom) ? 'Custom Icons' : family.toUpperCase();

        familySection.innerHTML = `
            <div class="family-header" onclick="toggleFamily('${family}')">
                <div class="family-info">
                    <div class="family-badge ${badgeClass}">${familyDisplayName}</div>
                    <div class="family-title">Font Family: ${family}</div>
                    <div class="family-count">(${iconsByFamily[family].length} icons)</div>
                </div>
                <div class="collapse-icon">▼</div>
            </div>
            <div class="family-icons">
                ${iconsByFamily[family].map(icon => createIconHTML(icon)).join('')}
            </div>
        `;

        grid.appendChild(familySection);
    });
}

function createIconHTML(icon) {
    const iconPreview = createIconSVG(icon);
    const isSelected = selectedIconsSet.has(icon.name);
    
    return `
        <div class="icon-item ${isSelected ? 'selected' : ''}" onclick="toggleIcon('${icon.name}')">
            <div class="icon-preview">
                ${iconPreview}
            </div>
            <span class="icon-name">${icon.name}</span>
        </div>
    `;
}

function toggleFamily(family) {
    const familySection = document.querySelector(`[data-family="${family}"]`);
    familySection.classList.toggle('collapsed');
}

function toggleIcon(iconName) {
    if (selectedIconsSet.has(iconName)) {
        selectedIconsSet.delete(iconName);
    } else {
        selectedIconsSet.add(iconName);
    }
    
    // Update the specific icon item's appearance
    const iconItems = document.querySelectorAll('.icon-item');
    iconItems.forEach(item => {
        const nameSpan = item.querySelector('.icon-name');
        if (nameSpan && nameSpan.textContent === iconName) {
            item.classList.toggle('selected', selectedIconsSet.has(iconName));
        }
    });
    
    updateStats();
}

function updateStats() {
    const searchQuery = document.getElementById('searchBox').value.trim();
    
    if (searchQuery && currentFilteredIcons.length !== allIcons.length) {
        document.getElementById('totalIcons').textContent = `${currentFilteredIcons.length} / ${allIcons.length}`;
    } else {
        document.getElementById('totalIcons').textContent = allIcons.length;
    }
    
    // Show breakdown by family in selected count
    const selectedByFamily = {};
    Array.from(selectedIconsSet).forEach(iconName => {
        const icon = allIcons.find(i => i.name === iconName);
        if (icon) {
            selectedByFamily[icon.family] = (selectedByFamily[icon.family] || 0) + 1;
        }
    });
    
    let selectedText = selectedIconsSet.size.toString();
    if (Object.keys(selectedByFamily).length > 1) {
        const breakdown = Object.entries(selectedByFamily)
            .map(([family, count]) => `${family}:${count}`)
            .join(', ');
        selectedText += ` (${breakdown})`;
    }
    
    document.getElementById('selectedIcons').textContent = selectedText;
    
    const savings = allIcons.length > 0 ? Math.round((1 - selectedIconsSet.size / allIcons.length) * 100) : 0;
    document.getElementById('estimatedSavings').textContent = savings + '%';
}

function setupSearch() {
    const searchBox = document.getElementById('searchBox');
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    let searchTimeout;
    
    function performSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = searchBox.value.toLowerCase().trim();
            
            if (!query) {
                currentFilteredIcons = allIcons;
                hideSuggestions();
            } else {
                // Use semantic search from search-config.js if available
                if (typeof searchIconsBySemantic === 'function') {
                    currentFilteredIcons = searchIconsBySemantic(query, allIcons);
                } else {
                    // Fallback to simple search
                    currentFilteredIcons = allIcons.filter(icon => 
                        icon.name.toLowerCase().includes(query) ||
                        icon.displayName.toLowerCase().includes(query)
                    );
                }
                
                if (typeof getSearchSuggestions === 'function') {
                    showSuggestions(query);
                }
            }
            
            renderIcons(currentFilteredIcons);
            updateStats();
        }, 200);
    }
    
    function showSuggestions(query) {
        if (query.length < 2 || typeof getSearchSuggestions !== 'function') {
            hideSuggestions();
            return;
        }
        
        const suggestions = getSearchSuggestions(query);
        
        if (suggestions.length > 0) {
            suggestionsDiv.innerHTML = suggestions.map(suggestion => 
                `<div class="suggestion-item" onclick="applySuggestion('${suggestion}')">${suggestion}</div>`
            ).join('');
            suggestionsDiv.style.display = 'block';
        } else {
            hideSuggestions();
        }
    }
    
    function hideSuggestions() {
        suggestionsDiv.style.display = 'none';
    }
    
    // Event listeners
    searchBox.addEventListener('input', performSearch);
    searchBox.addEventListener('focus', () => {
        if (searchBox.value.trim().length >= 2) {
            showSuggestions(searchBox.value.trim());
        }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            hideSuggestions();
        }
    });
}

function applySuggestion(suggestion) {
    const searchBox = document.getElementById('searchBox');
    searchBox.value = suggestion;
    
    // Trigger search
    if (typeof searchIconsBySemantic === 'function') {
        currentFilteredIcons = searchIconsBySemantic(suggestion, allIcons);
    } else {
        currentFilteredIcons = allIcons.filter(icon => 
            icon.name.toLowerCase().includes(suggestion.toLowerCase()) ||
            icon.displayName.toLowerCase().includes(suggestion.toLowerCase())
        );
    }
    
    renderIcons(currentFilteredIcons);
    updateStats();
    
    // Hide suggestions
    document.getElementById('searchSuggestions').style.display = 'none';
}

function selectAll() {
    currentFilteredIcons.forEach(icon => selectedIconsSet.add(icon.name));
    renderIcons(currentFilteredIcons);
    updateStats();
}

function selectNone() {
    selectedIconsSet.clear();
    renderIcons(currentFilteredIcons);
    updateStats();
}

function selectVisible() {
    currentFilteredIcons.forEach(icon => selectedIconsSet.add(icon.name));
    renderIcons(currentFilteredIcons);
    updateStats();
}

async function generateCustomFile() {
    if (selectedIconsSet.size === 0) {
        alert('Please select at least one icon');
        return;
    }

    const selectedIcons = allIcons.filter(icon => selectedIconsSet.has(icon.name));
    console.log('Generating custom file with selected icons:', selectedIcons.map(i => `${i.name} (${i.family})`));

    // FIXED: Filter out custom icons that are already in selectedIcons
    const customIconsToSend = customIcons.filter(customIcon => {
        const isAlreadySelected = selectedIconsSet.has(customIcon.name);
        if (isAlreadySelected) {
            console.log(`Custom icon "${customIcon.name}" is already selected, not sending separately`);
            return false;
        }
        return true;
    });

    console.log(`Sending ${customIconsToSend.length} custom icons separately (not already selected)`);

    try {
        // Show loading state
        const generateBtn = document.querySelector('button[onclick="generateCustomFile()"]');
        const originalText = generateBtn.textContent;
        generateBtn.textContent = 'Generating...';
        generateBtn.disabled = true;

        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                originalContent: originalContent,
                selectedIcons: selectedIcons,
                customIcons: customIconsToSend // Send only unselected custom icons
            })
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response result keys:', Object.keys(result));
        
        if (result.error) {
            throw new Error(result.error);
        }

        customContent = result.content;
        
        // Show generation summary
        const selectedByFamily = {};
        selectedIcons.forEach(icon => {
            selectedByFamily[icon.family] = (selectedByFamily[icon.family] || 0) + 1;
        });
        
        console.log('Generated file with icons by family:', selectedByFamily);
        
        // Auto-download the file immediately
        downloadCustomFile();
        
        // Show success notification
        showNotification(`🎉 Custom Font Awesome file downloaded! (${selectedIconsSet.size} icons)`, 'success');
        
        // Reset button
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
        
    } catch (error) {
        console.error('Generation error:', error);
        alert('Error generating custom file: ' + error.message);
        
        // Reset button
        const generateBtn = document.querySelector('button[onclick="generateCustomFile()"]');
        generateBtn.textContent = 'Generate Custom File';
        generateBtn.disabled = false;
    }
}

// Custom Icon Functions
let currentUploadedSvg = null;
let customIconUploadSetup = false; // Prevent duplicate setup

function setupCustomIconUpload() {
    // Prevent duplicate setup
    if (customIconUploadSetup) {
        return;
    }
    
    const uploadArea = document.getElementById('svgUploadArea');
    const fileInput = document.getElementById('svgFileInput');
    
    if (!uploadArea || !fileInput) {
        return;
    }
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleSvgFile(e.target.files[0]);
        }
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].name.toLowerCase().endsWith('.svg')) {
            handleSvgFile(files[0]);
        } else {
            alert('Please upload an SVG file');
        }
    });
    
    customIconUploadSetup = true; // Mark as setup
}

async function handleSvgFile(file) {
    try {
        const svgText = await file.text();
        const parsedSvg = parseSvgFile(svgText);
        
        if (!parsedSvg) {
            alert('Could not parse SVG file. Please check that it\'s a valid SVG.');
            return;
        }
        
        currentUploadedSvg = {
            fileName: file.name,
            ...parsedSvg
        };
        
        showSvgPreview(currentUploadedSvg);
    } catch (error) {
        console.error('Error reading SVG file:', error);
        alert('Error reading SVG file');
    }
}

function parseSvgFile(svgText) {
    try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');
        
        if (!svgElement) {
            return null;
        }
        
        // Get viewBox or width/height
        const viewBox = svgElement.getAttribute('viewBox');
        let width = 512, height = 512;
        
        if (viewBox) {
            const values = viewBox.split(/\s+|,/);
            if (values.length === 4) {
                width = parseInt(values[2]) || 512;
                height = parseInt(values[3]) || 512;
            }
        } else {
            width = parseInt(svgElement.getAttribute('width')) || 512;
            height = parseInt(svgElement.getAttribute('height')) || 512;
        }
        
        // Extract path data - try to find path elements
        const paths = svgElement.querySelectorAll('path');
        let pathData = '';
        
        if (paths.length > 0) {
            // Combine all path data
            pathData = Array.from(paths)
                .map(path => path.getAttribute('d'))
                .filter(d => d)
                .join(' ');
        } else {
            // Try to get entire SVG content as fallback
            const innerSvg = svgElement.innerHTML;
            if (innerSvg.includes('d=')) {
                // Extract d attribute values
                const dMatches = innerSvg.match(/d="([^"]+)"/g);
                if (dMatches) {
                    pathData = dMatches.map(match => match.replace(/d="([^"]+)"/, '$1')).join(' ');
                }
            }
        }
        
        if (!pathData) {
            // Last resort: try to convert other shapes to paths
            pathData = convertSvgToPath(svgElement);
        }
        
        return {
            width,
            height,
            pathData: pathData.trim()
        };
    } catch (error) {
        console.error('Error parsing SVG:', error);
        return null;
    }
}

function convertSvgToPath(svgElement) {
    // Basic conversion for simple shapes - this is a simplified version
    let pathData = '';
    
    // Handle rectangles
    const rects = svgElement.querySelectorAll('rect');
    rects.forEach(rect => {
        const x = parseFloat(rect.getAttribute('x')) || 0;
        const y = parseFloat(rect.getAttribute('y')) || 0;
        const w = parseFloat(rect.getAttribute('width')) || 0;
        const h = parseFloat(rect.getAttribute('height')) || 0;
        pathData += `M${x},${y} L${x+w},${y} L${x+w},${y+h} L${x},${y+h} Z `;
    });
    
    // Handle circles
    const circles = svgElement.querySelectorAll('circle');
    circles.forEach(circle => {
        const cx = parseFloat(circle.getAttribute('cx')) || 0;
        const cy = parseFloat(circle.getAttribute('cy')) || 0;
        const r = parseFloat(circle.getAttribute('r')) || 0;
        // Simple circle approximation
        pathData += `M${cx-r},${cy} A${r},${r} 0 1,0 ${cx+r},${cy} A${r},${r} 0 1,0 ${cx-r},${cy} Z `;
    });
    
    return pathData;
}

function showSvgPreview(svgData) {
    // Show preview section
    document.getElementById('svgPreviewSection').classList.remove('hidden');
    
    // Update preview
    const previewSvg = document.querySelector('#iconPreviewLarge svg');
    const pathElement = previewSvg.querySelector('path');
    
    previewSvg.setAttribute('viewBox', `0 0 ${svgData.width} ${svgData.height}`);
    pathElement.setAttribute('d', svgData.pathData);
    
    // Update details
    document.getElementById('fileName').textContent = svgData.fileName;
    document.getElementById('iconSize').textContent = `${svgData.width} × ${svgData.height}`;
    
    // Generate suggested name from filename
    const suggestedName = svgData.fileName
        .toLowerCase()
        .replace('.svg', '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    document.getElementById('customIconName').value = suggestedName;
}

function cancelUpload() {
    currentUploadedSvg = null;
    document.getElementById('svgPreviewSection').classList.add('hidden');
    document.getElementById('svgFileInput').value = '';
    document.getElementById('customIconName').value = '';
}

function addUploadedIcon() {
    if (!currentUploadedSvg) {
        alert('No SVG file uploaded');
        return;
    }
    
    const name = document.getElementById('customIconName').value.trim();
    const targetFamily = 'fas'; // Custom icons go to fas family
    
    // Validate name
    if (!name) {
        alert('Please enter an icon name');
        return;
    }
    
    const nameError = validateIconName(name, targetFamily);
    if (nameError) {
        alert(nameError);
        return;
    }
    
    // Check if icon already exists in the same family (prevent duplicates)
    const existingIcon = allIcons.find(icon => 
        icon.name === name && icon.family === targetFamily
    );
    if (existingIcon) {
        alert(`An icon with this name already exists in the ${targetFamily} family`);
        return;
    }
    
    // Create custom icon object
    const customIcon = {
        name: name,
        unicode: generateCustomUnicode(),
        displayName: `${name} (${targetFamily} - custom)`,
        width: currentUploadedSvg.width,
        height: currentUploadedSvg.height,
        svgPath: currentUploadedSvg.pathData,
        family: targetFamily,
        isCustom: true
    };
    
    // Add to arrays safely (prevent duplicates)
    const addedToCustom = addIconToArraySafely(customIcons, customIcon);
    const addedToAll = addIconToArraySafely(allIcons, customIcon);
    
    if (!addedToCustom || !addedToAll) {
        alert('Error: Icon already exists in arrays');
        return;
    }
    
    selectedIconsSet.add(customIcon.name);
    
    // Update families - iconFamilies should reference the same objects as allIcons
    if (!iconFamilies[targetFamily]) {
        iconFamilies[targetFamily] = [];
    }
    // Add safely to family array too
    addIconToArraySafely(iconFamilies[targetFamily], customIcon);
    
    // Update filtered icons
    updateFilteredIcons();
    
    // Check for duplicates (debugging)
    const duplicates = checkForDuplicates();
    if (duplicates.length > 0) {
        console.error('Duplicates detected after adding custom icon!', duplicates);
    }
    
    // Re-render and update stats
    renderIcons(currentFilteredIcons);
    updateStats();
    
    // Hide preview and reset
    cancelUpload();
    
    // Success message
    showNotification(`✅ Custom icon "${name}" added successfully to ${targetFamily} family!`, 'success');
    
    console.log('Added custom icon:', customIcon);
    console.log('Total icons now:', allIcons.length);
    console.log('Custom icons now:', customIcons.length);
    console.log(`${targetFamily} family icons now:`, iconFamilies[targetFamily]?.length || 0);
}

function updateFilteredIcons() {
    const searchQuery = document.getElementById('searchBox').value.toLowerCase().trim();
    
    if (!searchQuery) {
        currentFilteredIcons = allIcons;
    } else {
        if (typeof searchIconsBySemantic === 'function') {
            currentFilteredIcons = searchIconsBySemantic(searchQuery, allIcons);
        } else {
            currentFilteredIcons = allIcons.filter(icon => 
                icon.name.toLowerCase().includes(searchQuery) ||
                icon.displayName.toLowerCase().includes(searchQuery)
            );
        }
    }
}

// Helper function to prevent duplicates in arrays
function addIconToArraySafely(array, icon) {
    const exists = array.some(existingIcon => 
        existingIcon.name === icon.name && existingIcon.family === icon.family
    );
    if (!exists) {
        array.push(icon);
        return true;
    }
    console.warn('Attempted to add duplicate icon:', `${icon.family}-${icon.name}`);
    return false;
}

// Debug function to check for duplicates
function checkForDuplicates() {
    const allKeys = allIcons.map(icon => `${icon.family}-${icon.name}`);
    const duplicateKeys = allKeys.filter((key, index) => allKeys.indexOf(key) !== index);
    
    if (duplicateKeys.length > 0) {
        console.error('Duplicate icons found in allIcons (same family+name):', duplicateKeys);
    } else {
        console.log('No duplicate family+name combinations found in allIcons');
    }
    
    // Also check for cross-family duplicates (same name, different families)
    const nameGroups = {};
    allIcons.forEach(icon => {
        if (!nameGroups[icon.name]) {
            nameGroups[icon.name] = [];
        }
        nameGroups[icon.name].push(icon.family);
    });
    
    const crossFamilyDuplicates = Object.entries(nameGroups)
        .filter(([name, families]) => families.length > 1)
        .map(([name, families]) => `${name} (${families.join(', ')})`);
    
    if (crossFamilyDuplicates.length > 0) {
        console.log('Cross-family duplicates (same name, different families):', crossFamilyDuplicates);
    }
    
    return duplicateKeys;
}

function generateCustomUnicode() {
    // Generate a unique unicode in the private use area (E000-F8FF)
    const usedUnicodes = new Set();
    
    // Collect all used unicodes
    allIcons.forEach(icon => {
        if (icon.unicode) {
            usedUnicodes.add(icon.unicode);
        }
    });
    
    customIcons.forEach(icon => {
        if (icon.unicode) {
            usedUnicodes.add(icon.unicode);
        }
    });
    
    // Start from E000 and find the first available unicode
    for (let i = 0xE000; i <= 0xF8FF; i++) {
        const unicode = i.toString(16).toUpperCase();
        if (!usedUnicodes.has(unicode)) {
            console.log('Generated unicode:', unicode);
            return unicode;
        }
    }
    
    // Fallback to random if all are taken (unlikely)
    const fallback = Math.floor(Math.random() * 0x1000 + 0xE000).toString(16).toUpperCase();
    console.warn('Using fallback unicode:', fallback);
    return fallback;
}

function validateIconName(name, targetFamily = 'fas') {
    // Check if name is valid (lowercase, numbers, hyphens only)
    if (!/^[a-z0-9-]+$/.test(name)) {
        return 'Icon name can only contain lowercase letters, numbers, and hyphens';
    }
    
    // Check if name already exists in the same family (not just any family)
    const existingInFamily = allIcons.some(icon => 
        icon.name === name && icon.family === targetFamily
    );
    
    if (existingInFamily) {
        console.log(`Duplicate icon name detected in ${targetFamily} family:`, name);
        return `An icon with this name already exists in the ${targetFamily} family`;
    }
    
    // Also check custom icons for the same family
    const existingInCustom = customIcons.some(icon => 
        icon.name === name && icon.family === targetFamily
    );
    
    if (existingInCustom) {
        console.log(`Duplicate custom icon name detected in ${targetFamily} family:`, name);
        return `A custom icon with this name already exists in the ${targetFamily} family`;
    }
    
    return null;
}

// NEW FUNCTION: Load only custom icons (not selected icons)
function loadCustomIconsOnly() {
    try {
        const savedData = localStorage.getItem('fontawesome-customizer-selections');
        
        if (!savedData) {
            showNotification('📂 No saved data found.', 'info');
            return;
        }
        
        const saveData = JSON.parse(savedData);
        
        // Validate save data structure
        if (!saveData.customIcons || !Array.isArray(saveData.customIcons)) {
            showNotification('📂 No custom icons found in saved data.', 'info');
            return;
        }
        
        if (saveData.customIcons.length === 0) {
            showNotification('📂 No custom icons to load.', 'info');
            return;
        }
        
        // Show confirmation dialog with context info
        const saveDate = saveData.timestamp ? new Date(saveData.timestamp).toLocaleDateString() : 'Unknown date';
        const saveFileName = saveData.fileName || 'Unknown file';
        const currentFileContext = currentFileName || 'Current file';
        
        let confirmMessage = `Load ONLY custom icons from ${saveDate}?\n\n`;
        confirmMessage += `Saved for: "${saveFileName}"\n`;
        confirmMessage += `Current file: "${currentFileContext}"\n\n`;
        confirmMessage += `• ${saveData.selectedIcons?.length || 0} selected icons (will be IGNORED)\n`;
        confirmMessage += `• ${saveData.customIcons.length} custom icons\n\n`;
        
        if (saveFileName !== currentFileName) {
            confirmMessage += `⚠️ Warning: This was saved for a different file. Custom icons may not work correctly.`;
        } else {
            confirmMessage += `⚠️ Selected icons will NOT be loaded - only custom icons.`;
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Load custom icons
        let customLoadedCount = 0;
        let customSkippedCount = 0;
        
        saveData.customIcons.forEach(customIcon => {
            // Check if icon already exists in the same family before adding
            const existsInCustom = customIcons.some(icon => 
                icon.name === customIcon.name && icon.family === customIcon.family
            );
            const existsInAll = allIcons.some(icon => 
                icon.name === customIcon.name && icon.family === customIcon.family
            );
            
            if (!existsInCustom && !existsInAll) {
                // Add to custom icons array
                customIcons.push(customIcon);
                allIcons.push(customIcon);
                
                // Update families
                if (!iconFamilies[customIcon.family]) {
                    iconFamilies[customIcon.family] = [];
                }
                iconFamilies[customIcon.family].push(customIcon);
                
                // Auto-select the custom icon
                selectedIconsSet.add(customIcon.name);
                customLoadedCount++;
            } else {
                console.warn('Skipping duplicate custom icon:', `${customIcon.family}-${customIcon.name}`);
                customSkippedCount++;
            }
        });
        
        if (customLoadedCount > 0) {
            updateFilteredIcons();
        }
        
        // Re-render icons and update stats
        renderIcons(currentFilteredIcons);
        updateStats();
        
        // Show detailed feedback
        let message = `✅ Loaded ${customLoadedCount} custom icons only`;
        if (customSkippedCount > 0) {
            message += ` (${customSkippedCount} skipped - duplicates)`;
        }
        message += ` • Selected icons ignored`;
        
        showNotification(message, 'success');
        
        console.log('Loaded custom icons only:', {
            customLoaded: customLoadedCount,
            customSkipped: customSkippedCount,
            selectionsIgnored: saveData.selectedIcons?.length || 0
        });
        
    } catch (error) {
        console.error('Error loading custom icons only:', error);
        showNotification('❌ Error loading custom icons. Save data may be corrupted.', 'error');
    }
}

// NEW FUNCTION: Load only selected icons (not custom icons)
function loadSelectionsOnly() {
    try {
        const savedData = localStorage.getItem('fontawesome-customizer-selections');
        
        if (!savedData) {
            showNotification('📂 No saved selections found.', 'info');
            return;
        }
        
        const saveData = JSON.parse(savedData);
        
        // Validate save data structure
        if (!saveData.selectedIcons || !Array.isArray(saveData.selectedIcons)) {
            throw new Error('Invalid save data format');
        }
        
        // Show confirmation dialog with context info
        const saveDate = saveData.timestamp ? new Date(saveData.timestamp).toLocaleDateString() : 'Unknown date';
        const saveFileName = saveData.fileName || 'Unknown file';
        const currentFileContext = currentFileName || 'Current file';
        
        let confirmMessage = `Load ONLY selected icons from ${saveDate}?\n\n`;
        confirmMessage += `Saved for: "${saveFileName}"\n`;
        confirmMessage += `Current file: "${currentFileContext}"\n\n`;
        confirmMessage += `• ${saveData.selectedIcons.length} selected icons\n`;
        confirmMessage += `• ${saveData.customIcons?.length || 0} custom icons (will be IGNORED)\n\n`;
        confirmMessage += `⚠️ Custom icons will NOT be loaded - only icon selections.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Clear current selections
        selectedIconsSet.clear();
        
        // Load selected icons (only if they exist in current icon set)
        const availableIconNames = new Set(allIcons.map(icon => icon.name));
        let loadedCount = 0;
        let skippedCount = 0;
        
        saveData.selectedIcons.forEach(iconName => {
            if (availableIconNames.has(iconName)) {
                selectedIconsSet.add(iconName);
                loadedCount++;
            } else {
                skippedCount++;
            }
        });
        
        // Re-render icons and update stats
        renderIcons(currentFilteredIcons);
        updateStats();
        
        // Show detailed feedback
        let message = `✅ Loaded ${loadedCount} selections only`;
        if (skippedCount > 0) {
            message += ` (${skippedCount} skipped - not in current file)`;
        }
        message += ` • Custom icons ignored`;
        
        showNotification(message, 'success');
        
        console.log('Loaded selections only:', {
            loaded: loadedCount,
            skipped: skippedCount,
            customIgnored: saveData.customIcons?.length || 0
        });
        
    } catch (error) {
        console.error('Error loading selections only:', error);
        showNotification('❌ Error loading selections. Save data may be corrupted.', 'error');
    }
}

// Save/Load Functionality - FIXED VERSION
function saveSelections() {
    try {
        const saveData = {
            selectedIcons: Array.from(selectedIconsSet),
            customIcons: customIcons,
            fileName: currentFileName, // Save context of which file this is for
            timestamp: new Date().toISOString(),
            totalIcons: allIcons.length, // Save total for validation
            version: '1.1'
        };
        
        localStorage.setItem('fontawesome-customizer-selections', JSON.stringify(saveData));
        
        // Show success feedback
        showNotification(`✅ Saved ${selectedIconsSet.size} selections + ${customIcons.length} custom icons for "${currentFileName}"`, 'success');
        
        console.log('Saved selections:', saveData);
        
    } catch (error) {
        console.error('Error saving selections:', error);
        showNotification('❌ Error saving selections. Please try again.', 'error');
    }
}

function loadSelections() {
    try {
        const savedData = localStorage.getItem('fontawesome-customizer-selections');
        
        if (!savedData) {
            showNotification('📂 No saved selections found.', 'info');
            return;
        }
        
        const saveData = JSON.parse(savedData);
        
        // Validate save data structure
        if (!saveData.selectedIcons || !Array.isArray(saveData.selectedIcons)) {
            throw new Error('Invalid save data format');
        }
        
        // Show confirmation dialog with context info
        const saveDate = saveData.timestamp ? new Date(saveData.timestamp).toLocaleDateString() : 'Unknown date';
        const saveFileName = saveData.fileName || 'Unknown file';
        const currentFileContext = currentFileName || 'Current file';
        
        let confirmMessage = `Load saved selections & custom icons from ${saveDate}?\n\n`;
        confirmMessage += `Saved for: "${saveFileName}"\n`;
        confirmMessage += `Current file: "${currentFileContext}"\n\n`;
        confirmMessage += `• ${saveData.selectedIcons.length} selected icons\n`;
        confirmMessage += `• ${saveData.customIcons?.length || 0} custom icons\n\n`;
        
        if (saveFileName !== currentFileName) {
            confirmMessage += `⚠️ Warning: This was saved for a different file. Custom icons may not work correctly.`;
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Clear current selections
        selectedIconsSet.clear();
        
        // Load selected icons (only if they exist in current icon set)
        const availableIconNames = new Set(allIcons.map(icon => icon.name));
        let loadedCount = 0;
        let skippedCount = 0;
        
        saveData.selectedIcons.forEach(iconName => {
            if (availableIconNames.has(iconName)) {
                selectedIconsSet.add(iconName);
                loadedCount++;
            } else {
                skippedCount++;
            }
        });
        
        // Load custom icons with user confirmation if from different file
        let customLoadedCount = 0;
        if (saveData.customIcons && Array.isArray(saveData.customIcons) && saveData.customIcons.length > 0) {
            let loadCustoms = true;
            
            if (saveFileName !== currentFileName) {
                loadCustoms = confirm(`Load ${saveData.customIcons.length} custom icons from different file?\n\nThese may not work correctly with the current Font Awesome file.`);
            }
            
            if (loadCustoms) {
                saveData.customIcons.forEach(customIcon => {
                    // Check if icon already exists in the same family before adding
                    const existsInCustom = customIcons.some(icon => 
                        icon.name === customIcon.name && icon.family === customIcon.family
                    );
                    const existsInAll = allIcons.some(icon => 
                        icon.name === customIcon.name && icon.family === customIcon.family
                    );
                    
                    if (!existsInCustom && !existsInAll) {
                        // Add to custom icons array
                        customIcons.push(customIcon);
                        allIcons.push(customIcon);
                        
                        // Update families
                        if (!iconFamilies[customIcon.family]) {
                            iconFamilies[customIcon.family] = [];
                        }
                        iconFamilies[customIcon.family].push(customIcon);
                        
                        // Select the custom icon
                        selectedIconsSet.add(customIcon.name);
                        customLoadedCount++;
                    } else {
                        console.warn('Skipping duplicate custom icon:', `${customIcon.family}-${customIcon.name}`);
                    }
                });
                
                if (customLoadedCount > 0) {
                    updateFilteredIcons();
                }
            }
        }
        
        // Re-render icons and update stats
        renderIcons(currentFilteredIcons);
        updateStats();
        
        // Show detailed feedback
        let message = `✅ Loaded ${loadedCount} selections`;
        if (customLoadedCount > 0) {
            message += ` + ${customLoadedCount} custom icons`;
        }
        if (skippedCount > 0) {
            message += ` (${skippedCount} skipped - not in current file)`;
        }
        
        showNotification(message, 'success');
        
        console.log('Loaded selections:', {
            loaded: loadedCount,
            skipped: skippedCount,
            customLoaded: customLoadedCount,
            saveData
        });
        
    } catch (error) {
        console.error('Error loading selections:', error);
        showNotification('❌ Error loading selections. Save data may be corrupted.', 'error');
    }
}

// NEW RESET MEMORY FUNCTION
function resetMemory() {
    const savedData = localStorage.getItem('fontawesome-customizer-selections');
    
    if (!savedData) {
        showNotification('📂 No saved data found to reset.', 'info');
        return;
    }
    
    try {
        const saveData = JSON.parse(savedData);
        const saveDate = saveData.timestamp ? new Date(saveData.timestamp).toLocaleDateString() : 'Unknown date';
        const saveFileName = saveData.fileName || 'Unknown file';
        
        const confirmMessage = `Are you sure you want to reset all saved memory?\n\nThis will permanently delete:\n• ${saveData.selectedIcons?.length || 0} selected icons\n• ${saveData.customIcons?.length || 0} custom icons\n• Saved for: "${saveFileName}" (${saveDate})\n\nThis action cannot be undone.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        localStorage.removeItem('fontawesome-customizer-selections');
        
        // Also clear current custom icons that came from saved data
        const customIconsToRemove = customIcons.filter(icon => icon.isCustom);
        customIconsToRemove.forEach(customIcon => {
            // Remove from allIcons
            const index = allIcons.findIndex(icon => icon.name === customIcon.name);
            if (index !== -1) {
                allIcons.splice(index, 1);
            }
            
            // Remove from families
            if (iconFamilies[customIcon.family]) {
                const familyIndex = iconFamilies[customIcon.family].findIndex(icon => icon.name === customIcon.name);
                if (familyIndex !== -1) {
                    iconFamilies[customIcon.family].splice(familyIndex, 1);
                }
            }
            
            // Remove from selections
            selectedIconsSet.delete(customIcon.name);
        });
        
        // Clear custom icons array
        customIcons = [];
        
        // Update filtered icons and re-render
        updateFilteredIcons();
        renderIcons(currentFilteredIcons);
        updateStats();
        
        showNotification('🗑️ Memory reset successfully. All saved data cleared.', 'success');
        
    } catch (error) {
        console.error('Error parsing saved data:', error);
        // Still try to clear it
        localStorage.removeItem('fontawesome-customizer-selections');
        showNotification('🗑️ Memory reset (data was corrupted).', 'warning');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        font-size: 0.9rem;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    // Set background based on type
    const backgrounds = {
        success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        error: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        warning: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    };
    
    notification.style.background = backgrounds[type] || backgrounds.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add keyboard shortcuts for save/load
document.addEventListener('keydown', (e) => {
    // Ctrl+S to save (prevent default browser save)
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (allIcons.length > 0) {
            saveSelections();
        }
    }
    
    // Ctrl+L to load (everything)
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        if (allIcons.length > 0) {
            loadSelections();
        }
    }
    
    // Ctrl+Shift+L to load selections only (not custom icons)
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        if (allIcons.length > 0) {
            loadSelectionsOnly();
        }
    }
    
    // Ctrl+Shift+C to load custom icons only (not selections)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (allIcons.length > 0) {
            loadCustomIconsOnly();
        }
    }
});

// Size Slider Functionality
function setupSizeSlider() {
    const sizeSlider = document.getElementById('iconSizeSlider');
    const sizeValue = document.getElementById('sizeValue');
    
    if (!sizeSlider || !sizeValue) return;
    
    // Set initial size
    updateIconSize(sizeSlider.value);
    
    // Handle slider changes
    sizeSlider.addEventListener('input', (e) => {
        const size = e.target.value;
        updateIconSize(size);
        sizeValue.textContent = size + 'px';
    });
    
    // Handle slider release for smooth performance
    sizeSlider.addEventListener('change', (e) => {
        const size = e.target.value;
        updateIconSize(size);
    });
}

function updateIconSize(size) {
    // Update size value display
    const sizeValue = document.getElementById('sizeValue');
    if (sizeValue) {
        sizeValue.textContent = size + 'px';
    }
    
    // Only scale the actual icon elements - nothing else!
    const baseIconSize = 24; // Base SVG size in pixels
    const scaleFactor = size / 280; // 280 is the default slider value
    const newIconSize = Math.round(baseIconSize * scaleFactor);
    
    // Scale only the SVG icons inside previews
    const iconSvgs = document.querySelectorAll('.icon-preview svg');
    iconSvgs.forEach(svg => {
        svg.style.width = newIconSize + 'px';
        svg.style.height = newIconSize + 'px';
    });
    
    // Scale unicode display elements if they exist
    const unicodeDisplays = document.querySelectorAll('.icon-preview .unicode-display');
    unicodeDisplays.forEach(unicode => {
        const newFontSize = Math.round(14 * scaleFactor);
        unicode.style.fontSize = newFontSize + 'px';
    });
}