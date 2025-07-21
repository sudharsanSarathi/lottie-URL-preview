let lottieAnimation = null;
const urlInput = document.getElementById('lottieUrl');
const loadButton = document.getElementById('loadButton');
const fileInput = document.getElementById('fileInput');
const playPauseButton = document.getElementById('playPause');
const errorDiv = document.getElementById('error');
const playerContainer = document.getElementById('lottiePlayer');
const tabButtons = document.querySelectorAll('.tab-button');
const inputSections = document.querySelectorAll('.input-section');
const loadingMessage = document.querySelector('.loading-message');
const uploadLabel = document.getElementById('uploadLabel');
const loadButtonText = loadButton.querySelector('.button-text');
const loadButtonSpinner = loadButton.querySelector('.loading-spinner');
const uploadLabelText = uploadLabel.querySelector('.upload-text');
const uploadSpinner = uploadLabel.querySelector('.loading-spinner');
const filePreview = document.getElementById('filePreview');
const fileName = filePreview.querySelector('.file-name');
const clearUploadButton = document.getElementById('clearUpload');
const clearUrlButton = document.getElementById('clearUrl');
const seekbar = document.getElementById('seekbar');
const currentTimeDisplay = document.getElementById('currentTime');
const totalDurationDisplay = document.getElementById('totalDuration');

// Tab switching functionality
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const tabId = button.getAttribute('data-tab');
        inputSections.forEach(section => {
            section.classList.add('hidden');
            if (section.id === `${tabId}-section`) {
                section.classList.remove('hidden');
            }
        });

        clearError();
    });
});

// Function to show loading state
function showLoading(element) {
    if (element === loadButton) {
        loadButtonText.textContent = 'Loading...';
        loadButtonSpinner.classList.remove('hidden');
        loadButton.disabled = true;
    } else if (element === uploadLabel) {
        uploadLabelText.textContent = 'Uploading...';
        uploadSpinner.classList.remove('hidden');
    }
    loadingMessage.classList.remove('hidden');
}

// Function to hide loading state
function hideLoading(element) {
    if (element === loadButton) {
        loadButtonText.textContent = 'Load Animation';
        loadButtonSpinner.classList.add('hidden');
        loadButton.disabled = false;
    } else if (element === uploadLabel) {
        uploadLabelText.textContent = 'Choose Lottie File or Drop Here';
        uploadSpinner.classList.add('hidden');
    }
    loadingMessage.classList.add('hidden');
}

// Function to validate file extension
function isValidLottieFile(filename) {
    return filename.toLowerCase().endsWith('.json') || filename.toLowerCase().endsWith('.lottie');
}

// Function to show error message
function showError(message) {
    errorDiv.textContent = message;
}

// Function to clear error message
function clearError() {
    errorDiv.textContent = '';
}

// Function to calculate animation duration from Lottie JSON
function calculateAnimationDuration(jsonData) {
    try {
        // Check if jsonData is valid
        if (!jsonData || typeof jsonData !== 'object') {
            console.warn('Invalid Lottie JSON data');
            return 0;
        }

        // Get frame rate (fr), default to 30fps if missing or invalid
        const frameRate = typeof jsonData.fr === 'number' && jsonData.fr > 0 ? jsonData.fr : 30;

        // Get in point (ip), default to 0 if missing or invalid
        const inPoint = typeof jsonData.ip === 'number' ? jsonData.ip : 0;

        // Get out point (op), try to get from totalFrames if op is missing
        let outPoint;
        if (typeof jsonData.op === 'number') {
            outPoint = jsonData.op;
        } else if (typeof jsonData.totalFrames === 'number') {
            outPoint = jsonData.totalFrames;
        } else {
            // If both op and totalFrames are missing, try to calculate from animation data
            outPoint = jsonData.animation_id ? jsonData.animation_id.frames : inPoint;
        }

        // Validate points
        if (outPoint <= inPoint) {
            console.warn('Invalid animation points: out point <= in point');
            return 0;
        }

        // Calculate duration using the formula: duration = (op - ip) / fr
        const duration = (outPoint - inPoint) / frameRate;
        
        // Ensure non-negative duration and round to 3 decimal places for precision
        return Math.max(0, Math.round(duration * 1000) / 1000);
    } catch (error) {
        console.error('Error calculating duration:', error);
        return 0;
    }
}

// Function to format time in MM:SS format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Function to update duration display
function updateDurationDisplay(totalDuration) {
    if (totalDurationDisplay) {
        totalDurationDisplay.textContent = formatTime(totalDuration);
    }
}

// Function to update current time display
function updateCurrentTimeDisplay(currentSeconds) {
    if (currentTimeDisplay) {
        currentTimeDisplay.textContent = formatTime(currentSeconds);
    }
}

// Function to load animation from JSON data
function loadAnimationFromData(jsonData) {
    try {
        // Destroy existing animation if any
        if (lottieAnimation) {
            lottieAnimation.destroy();
        }

        // Clear the player container
        playerContainer.innerHTML = `
            <div class="loading-message hidden">
                <div class="loading-spinner"></div>
                <p>Loading animation...</p>
            </div>
        `;

        // Calculate animation duration
        const animationDuration = calculateAnimationDuration(jsonData);
        console.log(`Animation duration: ${animationDuration} seconds`);

        // Load the animation
        lottieAnimation = lottie.loadAnimation({
            container: playerContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: jsonData
        });

        // Store duration for later use
        lottieAnimation.animationDuration = animationDuration;

        // Enable controls once animation is loaded
        lottieAnimation.addEventListener('DOMLoaded', () => {
            playPauseButton.disabled = false;
            playPauseButton.textContent = 'Pause';
            clearError();
            hideLoading(loadButton);
            hideLoading(uploadLabel);
            updateSeekbar();
            
            // Update duration display
            updateDurationDisplay(animationDuration);
            updateCurrentTimeDisplay(0);
        });

        // Handle loading error
        lottieAnimation.addEventListener('error', () => {
            showError('Failed to load animation. Please check the file and try again.');
            playPauseButton.disabled = true;
            hideLoading(loadButton);
            hideLoading(uploadLabel);
        });

    } catch (error) {
        showError('Failed to load animation. Please check the file and try again.');
        console.error('Error loading animation:', error);
        hideLoading(loadButton);
        hideLoading(uploadLabel);
    }
}

// Function to handle file upload
async function handleFileUpload(file) {
    if (!file) {
        showError('Please select a file');
        return;
    }

    if (!isValidLottieFile(file.name)) {
        showError('Please upload a .json or .lottie file');
        return;
    }

    showLoading(uploadLabel);
    
    // Show file preview
    fileName.textContent = file.name;
    filePreview.classList.remove('hidden');

    try {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                loadAnimationFromData(jsonData);
            } catch (error) {
                showError('Invalid JSON file. Please check the file and try again.');
                console.error('Error parsing JSON:', error);
                hideLoading(uploadLabel);
            }
        };
        reader.onerror = () => {
            showError('Error reading file. Please try again.');
            hideLoading(uploadLabel);
        };
        reader.readAsText(file);
    } catch (error) {
        showError('Error processing file. Please try again.');
        console.error('Error processing file:', error);
        hideLoading(uploadLabel);
    }
}

// Function to detect if we're running locally with server
function isLocalWithServer() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// Function to load animation from URL
async function loadAnimationFromUrl(url) {
    showLoading(loadButton);

    try {
        // Clean the URL
        const cleanUrl = url.startsWith('@') ? url.substring(1) : url;
        
        // Clear existing animation
        if (lottieAnimation) {
            lottieAnimation.destroy();
        }
        
        // Clear the player container
        playerContainer.innerHTML = `
            <div class="loading-message hidden">
                <div class="loading-spinner"></div>
                <p>Loading animation...</p>
            </div>
        `;

        // Check if we're running locally with server support
        if (isLocalWithServer()) {
            // Local development - try direct loading first, then proxy if needed
            try {
                // Try direct loading first
                lottieAnimation = lottie.loadAnimation({
                    container: playerContainer,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    path: cleanUrl
                });

                // Enable controls once animation is loaded
                lottieAnimation.addEventListener('DOMLoaded', () => {
                    playPauseButton.disabled = false;
                    playPauseButton.textContent = 'Pause';
                    clearError();
                    hideLoading(loadButton);
                    updateSeekbar();
                });

                // Handle loading error - fallback to proxy
                lottieAnimation.addEventListener('error', async () => {
                    console.log('Direct loading failed, trying proxy...');
                    try {
                        const proxyUrl = `/proxy?url=${encodeURIComponent(cleanUrl)}`;
                        const response = await fetch(proxyUrl);
                        if (!response.ok) throw new Error(`Proxy error! status: ${response.status}`);
                        const jsonData = await response.json();
                        loadAnimationFromData(jsonData);
                    } catch (proxyError) {
                        showError('Failed to load animation. Please check the URL and try again.');
                        console.error('Proxy loading failed:', proxyError);
                        hideLoading(loadButton);
                    }
                });

            } catch (error) {
                console.error('Error setting up direct loading:', error);
                // Fallback to proxy immediately
                try {
                    const proxyUrl = `/proxy?url=${encodeURIComponent(cleanUrl)}`;
                    const response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error(`Proxy error! status: ${response.status}`);
                    const jsonData = await response.json();
                    loadAnimationFromData(jsonData);
                } catch (proxyError) {
                    showError('Failed to load animation. Please check the URL and try again.');
                    console.error('Proxy loading failed:', proxyError);
                    hideLoading(loadButton);
                }
            }
        } else {
            // Deployed environment - use enhanced CORS handling approach
            const corsProxies = [
                // Direct fetch (works for CORS-enabled URLs)
                { name: 'Direct', url: cleanUrl },
                // Multiple CORS proxy services for better reliability
                { name: 'ThingProxy', url: `https://thingproxy.freeboard.io/fetch/${cleanUrl}` },
                { name: 'CorsProxy.io', url: `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}` },
                { name: 'AllOrigins', url: `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`, parseContents: true },
                { name: 'CorsAnywhere', url: `https://cors-anywhere.herokuapp.com/${cleanUrl}` },
                { name: 'ProxyMi', url: `https://proxy.cors.sh/${cleanUrl}` },
                { name: 'CorsFlare', url: `https://corsflare.com/?${cleanUrl}` }
            ];

            let jsonData = null;
            let lastError = null;

            // Try each proxy in sequence
            for (const proxy of corsProxies) {
                try {
                    console.log(`Trying ${proxy.name}...`);
                    const response = await fetch(proxy.url);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    if (proxy.parseContents) {
                        // For AllOrigins, parse the contents field
                        const data = await response.json();
                        if (data.contents) {
                            jsonData = JSON.parse(data.contents);
                        } else {
                            throw new Error('No contents field in response');
                        }
                    } else {
                        // Direct JSON response
                        jsonData = await response.json();
                    }

                    // Validate that we got valid Lottie data
                    if (jsonData && (jsonData.v || jsonData.assets || jsonData.layers)) {
                        console.log(`Successfully loaded via ${proxy.name}`);
                        break;
                    } else {
                        throw new Error('Invalid Lottie JSON format');
                    }

                } catch (error) {
                    console.log(`${proxy.name} failed:`, error.message);
                    lastError = error;
                    continue;
                }
            }

            if (!jsonData) {
                throw new Error(`All proxy methods failed. Last error: ${lastError?.message || 'Unknown error'}`);
            }

            // Load the animation with the fetched data
            loadAnimationFromData(jsonData);
        }

    } catch (error) {
        let errorMessage = 'Failed to load animation from URL. ';
        
        if (error.message.includes('CORS')) {
            errorMessage += 'CORS restrictions prevent loading from this domain. ';
        } else if (error.message.includes('HTTP 404')) {
            errorMessage += 'File not found (404). Please check the URL. ';
        } else if (error.message.includes('HTTP 403')) {
            errorMessage += 'Access forbidden (403). The file may be private. ';
        } else if (error.message.includes('Invalid Lottie JSON')) {
            errorMessage += 'The file is not a valid Lottie animation. ';
        } else if (error.message.includes('All proxy methods failed')) {
            errorMessage += 'All CORS proxy services are currently unavailable. Please try again later. ';
        }
        
        errorMessage += 'Please ensure the URL is publicly accessible and points to a valid Lottie JSON file.';
        
        showError(errorMessage);
        console.error('Error loading animation from URL:', error);
        hideLoading(loadButton);
    }
}

// Update seekbar
function updateSeekbar() {
    if (!lottieAnimation) return;
    const progress = (lottieAnimation.currentFrame / lottieAnimation.totalFrames) * 100;
    seekbar.value = progress;
    
    // Update current time display
    if (lottieAnimation.animationDuration) {
        const currentTime = (progress / 100) * lottieAnimation.animationDuration;
        updateCurrentTimeDisplay(currentTime);
    }
}

// Event listener for file input
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    handleFileUpload(file);
});

// Clear upload button handler
clearUploadButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.value = '';
    filePreview.classList.add('hidden');
    fileName.textContent = '';
    if (lottieAnimation) {
        lottieAnimation.destroy();
        lottieAnimation = null;
    }
    clearError();
});

// Clear URL button handler
clearUrlButton.addEventListener('click', () => {
    urlInput.value = '';
    clearUrlButton.classList.add('hidden');
    if (lottieAnimation) {
        lottieAnimation.destroy();
        lottieAnimation = null;
    }
    clearError();
});

// URL input handler for showing/hiding clear button
urlInput.addEventListener('input', () => {
    if (urlInput.value.trim()) {
        clearUrlButton.classList.remove('hidden');
    } else {
        clearUrlButton.classList.add('hidden');
    }
});

// Drag and drop functionality
const fileUpload = document.querySelector('.file-upload');

fileUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUpload.style.borderColor = '#4299e1';
});

fileUpload.addEventListener('dragleave', () => {
    fileUpload.style.borderColor = '#e2e8f0';
});

fileUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUpload.style.borderColor = '#e2e8f0';
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
});

// Seekbar event listener
seekbar.addEventListener('input', () => {
    if (!lottieAnimation) return;
    const frame = (seekbar.value / 100) * lottieAnimation.totalFrames;
    lottieAnimation.goToAndStop(frame, true);
});

seekbar.addEventListener('change', () => {
    if (!lottieAnimation) return;
    const frame = (seekbar.value / 100) * lottieAnimation.totalFrames;
    lottieAnimation.goToAndPlay(frame, true);
});

// Event listener for URL input (Enter key)
urlInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        loadButton.click();
    }
});

// Event listener for Load button
loadButton.addEventListener('click', () => {
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('Please enter a URL');
        return;
    }

    if (!isValidLottieFile(url)) {
        showError('URL must end with .json or .lottie');
        return;
    }

    clearError();
    loadAnimationFromUrl(url);
});

// Event listener for Play/Pause button
playPauseButton.addEventListener('click', () => {
    if (!lottieAnimation) return;

    if (lottieAnimation.isPaused) {
        lottieAnimation.play();
        playPauseButton.textContent = 'Pause';
    } else {
        lottieAnimation.pause();
        playPauseButton.textContent = 'Play';
    }
});

// Initially disable control buttons
playPauseButton.disabled = true;

// Start seekbar updates
setInterval(() => {
    if (lottieAnimation && !lottieAnimation.isPaused) {
        updateSeekbar();
    }
}, 50); 