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
const durationDisplay = document.getElementById('duration');

let isPlaying = false;
let animationDuration = 0;
let seekbarUpdateInterval;

// Format time in seconds to MM:SS format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Update seekbar
function updateSeekbar() {
    if (!lottieAnimation) return;
    
    const currentFrame = lottieAnimation.currentFrame;
    const totalFrames = lottieAnimation.totalFrames;
    
    // Update seekbar
    seekbar.value = (currentFrame / totalFrames) * 100;
}

// Clear animation and reset UI
function clearAnimation() {
    if (lottieAnimation) {
        lottieAnimation.destroy();
        lottieAnimation = null;
    }
    playerContainer.innerHTML = `
        <div class="loading-message hidden">
            <div class="loading-spinner"></div>
            <p>Loading animation...</p>
        </div>
    `;
    playPauseButton.textContent = 'Play';
    playPauseButton.disabled = true;
    seekbar.value = 0;
    currentTimeDisplay.textContent = '0:00';
    durationDisplay.textContent = '0:00';
    isPlaying = false;
    clearInterval(seekbarUpdateInterval);
}

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
        clearAnimation();

        // Load the animation
        lottieAnimation = lottie.loadAnimation({
            container: playerContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: jsonData
        });

        // Enable controls and start playing once animation is loaded
        lottieAnimation.addEventListener('DOMLoaded', () => {
            playPauseButton.disabled = false;
            playPauseButton.textContent = 'Pause';
            clearError();
            hideLoading(loadButton);
            hideLoading(uploadLabel);
            
            isPlaying = true;
            updateSeekbar(); // Initial update
            seekbarUpdateInterval = setInterval(updateSeekbar, 50);
        });

        // Handle animation complete
        lottieAnimation.addEventListener('complete', () => {
            if (!lottieAnimation.loop) {
                isPlaying = false;
                playPauseButton.textContent = 'Play';
                clearInterval(seekbarUpdateInterval);
            }
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

// Function to load animation from URL
async function loadAnimationFromUrl(url) {
    showLoading(loadButton);

    try {
        let jsonData;
        
        try {
            // First try direct fetch (for URLs that support CORS)
            const response = await fetch(url);
            if (!response.ok) throw new Error('Direct fetch failed');
            jsonData = await response.json();
        } catch (directError) {
            // If direct fetch fails, try using proxy
            const proxyUrl = `${window.location.protocol}//${window.location.hostname}:3000/proxy?url=${encodeURIComponent(url)}`;
            const proxyResponse = await fetch(proxyUrl);
            if (!proxyResponse.ok) throw new Error('Proxy fetch failed');
            jsonData = await proxyResponse.json();
        }
        
        loadAnimationFromData(jsonData);
    } catch (error) {
        showError('Failed to load animation. Please check the URL and try again.');
        console.error('Error loading animation from URL:', error);
        hideLoading(loadButton);
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
    clearAnimation();
    clearError();
});

// Clear URL button handler
clearUrlButton.addEventListener('click', () => {
    urlInput.value = '';
    clearUrlButton.classList.add('hidden');
    clearAnimation();
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
    updateSeekbar(); // Update time display immediately
});

seekbar.addEventListener('change', () => {
    if (!lottieAnimation || !isPlaying) return;
    
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

    isPlaying = !isPlaying;
    
    if (isPlaying) {
        lottieAnimation.play();
        playPauseButton.textContent = 'Pause';
        seekbarUpdateInterval = setInterval(updateSeekbar, 50);
    } else {
        lottieAnimation.pause();
        playPauseButton.textContent = 'Play';
        clearInterval(seekbarUpdateInterval);
    }
});

// Initially disable control buttons
playPauseButton.disabled = true; 