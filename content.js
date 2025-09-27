const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.type = 'text/css';
styleLink.href = chrome.runtime.getURL('content.css');
(document.head || document.documentElement).appendChild(styleLink);

window.addEventListener('load', () => {
    const h1 = document.querySelector('h1');
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');

    if (!h1 || !video || !canvas) {
        console.error("Posture Guardian elements not found!");
        return;
    }

    // Main container
    const appContainer = document.createElement('div');
    appContainer.className = 'app-container';

    // Wrapper for the video feed 
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper';

    // HTML element for the status message
    const statusMessage = document.createElement('div');
    statusMessage.className = 'status-message';
    statusMessage.id = 'status-message-element';

    videoWrapper.appendChild(video);
    videoWrapper.appendChild(canvas);
    videoWrapper.appendChild(statusMessage);

    appContainer.appendChild(h1);
    appContainer.appendChild(videoWrapper);

    document.body.appendChild(appContainer);


    // Update status message in real-time
    setInterval(() => {
        const messageElement = document.getElementById('status-message-element');
        // `window.lastSlouchState` is set by the page's original script
        const isSlouching = window.lastSlouchState;

        if (isSlouching) {
            messageElement.textContent = "Sit up straight!";
            messageElement.classList.add('slouching');
            messageElement.classList.remove('good-posture');
        } else {
            messageElement.textContent = "Good Posture 👍";
            messageElement.classList.remove('slouching');
            messageElement.classList.add('good-posture');
        }
    }, 100);
});
