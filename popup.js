let isActive = false;

// Initialize state when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
});

document.getElementById('toggleBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we can access this tab
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showError('Cannot run on Chrome internal pages');
      return;
    }
    
    isActive = !isActive;
    
    // Save state
    await chrome.storage.local.set({ 
      [`blurActive_${tab.id}`]: isActive 
    });
    
    // Try to send message with error handling
    chrome.tabs.sendMessage(tab.id, { 
      action: isActive ? 'activate' : 'deactivate' 
    }, (response) => {
      // Check if there was an error (content script not loaded)
      if (chrome.runtime.lastError) {
        console.log('Content script not ready, injecting...');
        
        // Inject content script manually
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }, () => {
          // Inject CSS
          chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content.css']
          }, () => {
            // Now send the message again
            chrome.tabs.sendMessage(tab.id, { 
              action: isActive ? 'activate' : 'deactivate' 
            });
          });
        });
      }
    });
    
    updateUI();
  } catch (error) {
    showError('Please refresh the page and try again');
    console.error(error);
  }
});

document.getElementById('clearBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'clear' }, (response) => {
      if (chrome.runtime.lastError) {
        showError('Please activate blur mode first');
      }
    });
  } catch (error) {
    console.error(error);
  }
});

async function loadState() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get stored state for this tab
    const result = await chrome.storage.local.get([`blurActive_${tab.id}`]);
    isActive = result[`blurActive_${tab.id}`] || false;
    
    // Also check with content script if it exists
    chrome.tabs.sendMessage(tab.id, { action: 'getState' }, (response) => {
      if (!chrome.runtime.lastError && response) {
        isActive = response.isActive;
        updateUI();
      } else {
        updateUI();
      }
    });
  } catch (error) {
    console.error('Error loading state:', error);
    updateUI();
  }
}

function updateUI() {
  const btn = document.getElementById('toggleBtn');
  const status = document.getElementById('status');
  
  if (isActive) {
    btn.textContent = 'Stop Blur Mode';
    btn.classList.add('active');
    status.textContent = 'Active - Click elements to blur';
    status.style.background = 'rgba(46, 213, 115, 0.3)';
  } else {
    btn.textContent = 'Start Blur Mode';
    btn.classList.remove('active');
    status.textContent = 'Inactive';
    status.style.background = 'rgba(255, 255, 255, 0.1)';
  }
}

function showError(message) {
  const status = document.getElementById('status');
  status.textContent = '⚠️ ' + message;
  status.style.background = 'rgba(255, 71, 87, 0.3)';
  
  setTimeout(() => {
    updateUI();
  }, 3000);
}