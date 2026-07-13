let container, video, canvas, ctx, btnContainer, drankBtn, snoozeBtn;
let animationFrameId;

function initCompanion() {
    if (document.getElementById('companion-container')) return;

    container = document.createElement('div');
    container.id = 'companion-container';
    container.style.display = 'none'; 

    video = document.createElement('video');
    video.id = 'companion-video-source';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.style.display = 'none'; 
    
    canvas = document.createElement('canvas');
    canvas.id = 'companion-canvas';
    canvas.width = 1000;  
    canvas.height = 1000; 
    
    ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Fallback source initialization
    video.src = chrome.runtime.getURL('companion1.mp4');

    btnContainer = document.createElement('div');
    btnContainer.className = 'desktop-btn-layout';

    // Glossy Blue "I Drank" Button
    drankBtn = document.createElement('button');
    drankBtn.className = 'bubble-btn drank-btn';
    drankBtn.innerText = 'I Drank';
    drankBtn.onclick = () => { 
        hideCompanionFromScreen();
        chrome.runtime.sendMessage({ action: "drankAction" }, () => {
            if (chrome.runtime.lastError) {}
        });
    };

    // Glossy Purple "Snooze" Button
    snoozeBtn = document.createElement('button');
    snoozeBtn.className = 'bubble-btn snooze-btn';
    snoozeBtn.innerText = 'Snooze';
    snoozeBtn.onclick = () => { 
        hideCompanionFromScreen();
        chrome.runtime.sendMessage({ action: "snoozeAction" }, () => {
            if (chrome.runtime.lastError) {}
        });
    };

    btnContainer.appendChild(drankBtn);
    btnContainer.appendChild(snoozeBtn);
    container.appendChild(video);
    container.appendChild(canvas);
    container.appendChild(btnContainer);
    document.body.appendChild(container);

    video.addEventListener('play', () => {
        renderChromaKey();
    });

    // For initial startup check, show video 1
    triggerReminderState(1);
}

function renderChromaKey() {
    if (video.paused || video.ended || video.readyState < 2) {
        animationFrameId = requestAnimationFrame(renderChromaKey);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
        let frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let l = frame.data.length / 4;

        for (let i = 0; i < l; i++) {
            let r = frame.data[i * 4 + 0];
            let g = frame.data[i * 4 + 1];
            let b = frame.data[i * 4 + 2];

            if (g > 85 && g > r * 1.05 && g > b * 1.05) {
                frame.data[i * 4 + 3] = 0; 
            }
        }
        
        ctx.putImageData(frame, 0, 0);
    } catch (e) {
        console.log("Waiting for video frames to synchronize...");
    }

    animationFrameId = requestAnimationFrame(renderChromaKey);
}

// Accepts a dynamic video number to play alternatively
function triggerReminderState(videoNum) {
    if (container && video) {
        container.style.display = 'flex'; 
        
        // Dynamically chooses companion1.mp4 or companion2.mp4 based on background's track
        video.src = chrome.runtime.getURL(`companion${videoNum}.mp4`);
        video.play().catch(() => {});
    }
}

function hideCompanionFromScreen() {
    if (container && video) {
        container.style.display = 'none'; 
        video.pause();
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "triggerRemind") {
        // Read the target alternating video number sent by background.js
        triggerReminderState(request.videoNumber || 1);
        sendResponse({ status: "displayed" });
    }
    return true;
});

initCompanion();