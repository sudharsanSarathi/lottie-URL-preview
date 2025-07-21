# Lottie URL Preview

A web-based Lottie animation viewer that allows you to:
- Load Lottie animations from URLs
- Upload local Lottie files
- Preview animations with playback controls
- Seek through animations using a timeline
- View animation duration and current time

## Features

- URL and File upload support
- Drag and drop file upload
- Automatic playback
- Playback controls (play/pause)
- Timeline scrubbing
- Time display (current/total)
- Loading states
- Error handling
- CORS proxy for URL loading

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lottie-URL-preview.git
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open http://localhost:3000 in your browser

## Usage

### Loading from URL
1. Click the "Load from URL" tab
2. Enter a Lottie animation URL (must end with .json or .lottie)
3. Click "Load Animation" or press Enter

### Uploading a File
1. Click the "Upload File" tab
2. Drag and drop a Lottie file or click to choose file
3. The animation will load automatically

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- Lottie Web 