let currentVolume = 0.8;
let audioBuffer = null;

// Preload the audio file
fetch(chrome.runtime.getURL('audio/notification.mp3'))
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
        audioBuffer = arrayBuffer;
    })
    .catch(error => console.error('Error loading audio file:', error));

// Function to play notification sound
function playNotificationSound(isTest = false) {
    console.log(`Attempting to play notification sound (${isTest ? 'test' : 'actual'})`);
    try {
        const audioContext = new AudioContext();
        audioContext.decodeAudioData(audioBuffer.slice(0), (buffer) => {
            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();
            
            source.buffer = buffer;
            gainNode.gain.value = currentVolume;
            
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            source.start(0);
            console.log('Sound played successfully');
        });
    } catch (error) {
        console.error('Error playing sound:', error);
    }
}

let stopButtonPresent = false;

// Monitor for ChatGPT responses
const observer = new MutationObserver((mutations) => {
    // Check current state of stop button using the correct data-testid
    const stopButton = document.querySelector('[data-testid="stop-button"]');
    const currentStopButtonPresent = !!stopButton;
    
    // If stop button was present before but now is gone, play sound
    if (stopButtonPresent && !currentStopButtonPresent) {
        console.log('Stop button disappeared - response complete');
        playNotificationSound();
    }
    
    // Update state
    stopButtonPresent = currentStopButtonPresent;
});

// Start observing the chat container
function startObserving() {
    console.log('Content script starting observation...');
    
    // Observe the entire body for maximum coverage
    observer.observe(document.body, { 
        childList: true, 
        subtree: true
    });
}

// Initialize when the page loads
console.log('Content script loaded');
startObserving();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_VOLUME') {
        currentVolume = message.volume / 100;
    } else if (message.type === 'TEST_SOUND') {
        playNotificationSound(true);
    }
});

// Re-initialize when navigation occurs (for single-page app)
document.addEventListener('navigationend', () => {
    console.log('Navigation detected, restarting observation');
    startObserving();
});
