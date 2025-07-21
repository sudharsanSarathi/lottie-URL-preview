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

        // Load the animation
        lottieAnimation = lottie.loadAnimation({
            container: playerContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: jsonData
        });

        // Enable controls once animation is loaded
        lottieAnimation.addEventListener('DOMLoaded', () => {
            playPauseButton.disabled = false;
            playPauseButton.textContent = 'Pause';
            clearError();
            hideLoading(loadButton);
            hideLoading(uploadLabel);
            updateSeekbar();
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

// Function to load animation from URL
async function loadAnimationFromUrl(url) {
    showLoading(loadButton);

    try {
        let jsonData;
        
        // Check if we're running locally or on GitHub Pages
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Use local proxy when running locally
            const proxyUrl = `/proxy?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            jsonData = await response.json();
        } else {
            // Use public CORS proxy when on GitHub Pages
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            jsonData = await response.json();
        }

        loadAnimationFromData(jsonData);
    } catch (error) {
        showError('Failed to load animation. Please check the URL and try again.');
        console.error('Error loading animation from URL:', error);
        hideLoading(loadButton);
    }
}

// Update seekbar
function updateSeekbar() {
    if (!lottieAnimation) return;
    const progress = (lottieAnimation.currentFrame / lottieAnimation.totalFrames) * 100;
    seekbar.value = progress;
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