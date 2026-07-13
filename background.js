const DRANK_INTERVAL = 30; 
const SNOOZE_INTERVAL = 5;  

let nextVideoToPlay = 1; 

// Set up initial alarm on installation
chrome.runtime.onInstalled.addListener(() => {
  setupAlarm(DRANK_INTERVAL);
});

// Handle messages from content.js buttons
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "drankAction") {
    setupAlarm(DRANK_INTERVAL);
    sendResponse({ status: "alarm_reset_30m" });
  } else if (message.action === "snoozeAction") {
    setupAlarm(SNOOZE_INTERVAL);
    sendResponse({ status: "alarm_reset_5m" });
  }
  return true; 
});

// Helper function to reset alarms safely
function setupAlarm(minutes) {
  chrome.alarms.clear("drinkWaterAlarm", () => {
    chrome.alarms.create("drinkWaterAlarm", { delayInMinutes: minutes, periodInMinutes: DRANK_INTERVAL });
  });
}

// Handle alarm event triggering
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "drinkWaterAlarm") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0 || !tabs[0].id) return;
      
      const activeTab = tabs[0];
      
      // Don't inject on restricted browser internal URLs
      if (activeTab.url && (activeTab.url.startsWith("chrome://") || activeTab.url.startsWith("edge://") || activeTab.url.startsWith("about:"))) {
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { 
        action: "triggerRemind", 
        videoNumber: nextVideoToPlay 
      }, () => {
        if (chrome.runtime.lastError) {
          // Tab closed or not loaded yet, ignore silently
        } else {
          // Successfully toggled, alternate to the other video state for next loop
          nextVideoToPlay = (nextVideoToPlay === 1) ? 2 : 1;
        }
      });
    });
  }
});