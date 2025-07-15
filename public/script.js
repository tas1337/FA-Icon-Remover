let allIcons = [];
let selectedIconsSet = new Set();
let originalContent = '';
let customContent = '';
let currentFilteredIcons = [];
let iconFamilies = {};

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
    renderIcons(allIcons);
    updateStats();
    setupSearch();
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

function getFamilyBadgeColor(family) {
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

    // Render icons grouped by family
    Object.keys(iconsByFamily).sort().forEach(family => {
        // Create family header if there are multiple families
        if (Object.keys(iconsByFamily).length > 1) {
            const familyHeader = document.createElement('div');
            familyHeader.className = 'family-header';
            familyHeader.style.cssText = `
                grid-column: 1 / -1;
                padding: 15px 0 10px 0;
                font-weight: bold;
                color: #333;
                border-bottom: 2px solid #f0f0f0;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            const familyBadge = document.createElement('span');
            familyBadge.style.cssText = `
                background: ${getFamilyBadgeColor(family)};
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: normal;
            `;
            familyBadge.textContent = family.toUpperCase();
            
            familyHeader.innerHTML = `
                Family: ${family} 
                <span style="color: #666; font-weight: normal;">(${iconsByFamily[family].length} icons)</span>
            `;
            familyHeader.insertBefore(familyBadge, familyHeader.firstChild);
            
            grid.appendChild(familyHeader);
        }

        // Render icons in this family
        iconsByFamily[family].forEach(icon => {
            const iconItem = document.createElement('div');
            iconItem.className = `icon-item ${selectedIconsSet.has(icon.name) ? 'selected' : ''}`;
            
            const iconPreview = createIconSVG(icon);
            
            // Create family badge
            const familyBadge = `<span style="
                background: ${getFamilyBadgeColor(icon.family)};
                color: white;
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 0.7rem;
                margin-left: auto;
                flex-shrink: 0;
            ">${icon.family}</span>`;
            
            iconItem.innerHTML = `
                <input type="checkbox" class="icon-checkbox" ${selectedIconsSet.has(icon.name) ? 'checked' : ''} 
                       onchange="toggleIcon('${icon.name}')">
                <div class="icon-preview">
                    ${iconPreview}
                </div>
                <span class="icon-name" style="flex: 1;">${icon.name}</span>
                ${familyBadge}
            `;
            
            iconItem.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    toggleIcon(icon.name);
                    const checkbox = iconItem.querySelector('.icon-checkbox');
                    checkbox.checked = selectedIconsSet.has(icon.name);
                    iconItem.classList.toggle('selected', selectedIconsSet.has(icon.name));
                }
            });

            grid.appendChild(iconItem);
        });
    });
}

function toggleIcon(iconName) {
    if (selectedIconsSet.has(iconName)) {
        selectedIconsSet.delete(iconName);
    } else {
        selectedIconsSet.add(iconName);
    }
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
                selectedIcons: selectedIcons
            })
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response result keys:', Object.keys(result));
        
        if (result.error) {
            throw new Error(result.error);
        }

        customContent = result.content;
        document.getElementById('downloadSection').classList.remove('hidden');
        
        // Show generation summary
        const selectedByFamily = {};
        selectedIcons.forEach(icon => {
            selectedByFamily[icon.family] = (selectedByFamily[icon.family] || 0) + 1;
        });
        
        console.log('Generated file with icons by family:', selectedByFamily);
        
        // Scroll to download section
        document.getElementById('downloadSection').scrollIntoView({ behavior: 'smooth' });
        
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