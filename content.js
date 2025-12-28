let isBlurModeActive = false;
let hoveredElement = null;
let blurredElements = new Set();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'activate') {
    isBlurModeActive = true;
    document.body.style.cursor = 'crosshair';
    sendResponse({ success: true, isActive: true });
  } else if (request.action === 'deactivate') {
    isBlurModeActive = false;
    document.body.style.cursor = 'default';
    if (hoveredElement) {
      hoveredElement.classList.remove('blur-hover');
    }
    sendResponse({ success: true, isActive: false });
  } else if (request.action === 'clear') {
    clearAllBlurs();
    sendResponse({ success: true });
  } else if (request.action === 'getState') {
    // Return current state
    sendResponse({ 
      isActive: isBlurModeActive,
      blurredCount: blurredElements.size 
    });
  }
  
  return true; // Keep message channel open for async response
});

// Mousemove - highlight element on hover
document.addEventListener('mousemove', (e) => {
  if (!isBlurModeActive) return;
  
  const element = e.target;
  
  if (hoveredElement && hoveredElement !== element) {
    hoveredElement.classList.remove('blur-hover');
  }
  
  if (!element.classList.contains('blur-active')) {
    element.classList.add('blur-hover');
    hoveredElement = element;
  }
});

// Click - blur the element
document.addEventListener('click', (e) => {
  if (!isBlurModeActive) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const element = e.target;
  
  if (element.classList.contains('blur-active')) {
    // Unblur if already blurred
    element.classList.remove('blur-active');
    blurredElements.delete(element);
  } else {
    // Blur the element
    element.classList.remove('blur-hover');
    element.classList.add('blur-active');
    blurredElements.add(element);
  }
}, true);

// Clear all blurs
function clearAllBlurs() {
  blurredElements.forEach(el => {
    el.classList.remove('blur-active');
  });
  blurredElements.clear();
}

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
  clearAllBlurs();
});