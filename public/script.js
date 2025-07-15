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

        allIcons = result.icons;
        originalContent = result.originalContent;
        iconFamilies = result.families || {};
        selectedIconsSet.clear();
        currentFilteredIcons = allIcons;

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
    loadSelectionsOnStartup(); // Auto-load saved selections
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
    filteredIcons.forEach(icon => {
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
                customIcons: customIcons // Include custom icons
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

function setupCustomIconUpload() {
    const uploadArea = document.getElementById('svgUploadArea');
    const fileInput = document.getElementById('svgFileInput');
    
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
    
    // Validate name
    if (!name) {
        alert('Please enter an icon name');
        return;
    }
    
    const nameError = validateIconName(name);
    if (nameError) {
        alert(nameError);
        return;
    }
    
    // Create custom icon object
    const customIcon = {
        name: name,
        unicode: generateCustomUnicode(),
        displayName: `${name} (fas - custom)`,
        width: currentUploadedSvg.width,
        height: currentUploadedSvg.height,
        svgPath: currentUploadedSvg.pathData,
        family: 'fas',
        isCustom: true
    };
    
    // Add to arrays
    customIcons.push(customIcon);
    allIcons.push(customIcon);
    selectedIconsSet.add(customIcon.name);
    
    // Update families
    if (!iconFamilies['fas']) {
        iconFamilies['fas'] = [];
    }
    iconFamilies['fas'].push(customIcon);
    
    // Update filtered icons
    updateFilteredIcons();
    
    // Re-render and update stats
    renderIcons(currentFilteredIcons);
    updateStats();
    
    // Hide preview and reset
    cancelUpload();
    
    // Success message
    alert(`Custom icon "${name}" added successfully!`);
    
    console.log('Added custom icon:', customIcon);
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

function generateCustomUnicode() {
    // Generate a unique unicode in the private use area (E000-F8FF)
    const usedUnicodes = new Set([
        ...allIcons.map(icon => icon.unicode),
        ...customIcons.map(icon => icon.unicode)
    ]);
    
    // Start from E000 and find the first available unicode
    for (let i = 0xE000; i <= 0xF8FF; i++) {
        const unicode = i.toString(16).toUpperCase();
        if (!usedUnicodes.has(unicode)) {
            return unicode;
        }
    }
    
    // Fallback to random if all are taken (unlikely)
    return Math.floor(Math.random() * 0x1000 + 0xE000).toString(16).toUpperCase();
}

function validateIconName(name) {
    // Check if name is valid (lowercase, numbers, hyphens only)
    if (!/^[a-z0-9-]+$/.test(name)) {
        return 'Icon name can only contain lowercase letters, numbers, and hyphens';
    }
    
    // Check if name already exists
    const existingNames = [
        ...allIcons.map(icon => icon.name),
        ...customIcons.map(icon => icon.name)
    ];
    
    if (existingNames.includes(name)) {
        return 'An icon with this name already exists';
    }
    
    return null;
}

// Save/Load Functionality
function saveSelections() {
    try {
        const saveData = {
            selectedIcons: Array.from(selectedIconsSet),
            customIcons: customIcons,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        localStorage.setItem('fontawesome-customizer-selections', JSON.stringify(saveData));
        
        // Show success feedback
        showNotification('✅ Selections saved successfully!', 'success');
        
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
        
        // Clear current selections
        selectedIconsSet.clear();
        
        // Load selected icons (only if they exist in current icon set)
        const availableIconNames = new Set(allIcons.map(icon => icon.name));
        let loadedCount = 0;
        
        saveData.selectedIcons.forEach(iconName => {
            if (availableIconNames.has(iconName)) {
                selectedIconsSet.add(iconName);
                loadedCount++;
            }
        });
        
        // Load custom icons if they exist and aren't already loaded
        if (saveData.customIcons && Array.isArray(saveData.customIcons)) {
            const existingCustomNames = new Set(customIcons.map(icon => icon.name));
            let customLoadedCount = 0;
            
            saveData.customIcons.forEach(customIcon => {
                if (!existingCustomNames.has(customIcon.name)) {
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
                }
            });
            
            if (customLoadedCount > 0) {
                updateFilteredIcons();
            }
        }
        
        // Re-render icons and update stats
        renderIcons(currentFilteredIcons);
        updateStats();
        
        // Show success feedback
        const saveDate = saveData.timestamp ? new Date(saveData.timestamp).toLocaleDateString() : 'Unknown date';
        showNotification(`✅ Loaded ${loadedCount} selections from ${saveDate}`, 'success');
        
        console.log('Loaded selections:', saveData);
        
    } catch (error) {
        console.error('Error loading selections:', error);
        showNotification('❌ Error loading selections. Save data may be corrupted.', 'error');
    }
}

function loadSelectionsOnStartup() {
    // Auto-load selections when icons are first displayed
    try {
        const savedData = localStorage.getItem('fontawesome-customizer-selections');
        if (savedData && allIcons.length > 0) {
            // Small delay to ensure everything is rendered
            setTimeout(() => {
                loadSelections();
            }, 100);
        }
    } catch (error) {
        console.error('Error auto-loading selections:', error);
    }
}

function clearSavedSelections() {
    if (confirm('Are you sure you want to clear all saved selections? This cannot be undone.')) {
        try {
            localStorage.removeItem('fontawesome-customizer-selections');
            showNotification('🗑️ Saved selections cleared.', 'info');
        } catch (error) {
            console.error('Error clearing saved selections:', error);
            showNotification('❌ Error clearing saved selections.', 'error');
        }
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
    
    // Ctrl+L to load
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        if (allIcons.length > 0) {
            loadSelections();
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