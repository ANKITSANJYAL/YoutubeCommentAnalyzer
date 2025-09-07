// Background service worker for the YouTube Comment Analyzer extension

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Storage helper functions
async function setStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

async function getStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

// Install/Update event
chrome.runtime.onInstalled.addListener((details) => {
  console.log('YouTube Comment Analyzer installed/updated');
  
  if (details.reason === 'install') {
    // Set default settings
    setStorage('settings', {
      autoAnalyze: true,
      maxComments: 500,
      showWordCloud: true,
      apiUrl: API_BASE_URL
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.type);
  
  // Handle the message asynchronously
  handleMessage(request, sender, sendResponse);
  
  // Return true to indicate we will respond asynchronously
  return true;
});

async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.type) {
      case 'ANALYZE_COMMENTS':
        await analyzeComments(request.data, sendResponse);
        break;
        
      case 'GET_SETTINGS':
        await getSettings(sendResponse);
        break;
        
      case 'UPDATE_SETTINGS':
        await updateSettings(request.data, sendResponse);
        break;
        
      case 'HEALTH_CHECK':
        await checkAPIHealth(sendResponse);
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function analyzeComments(data, sendResponse) {
  try {
    const settings = await getStorage('settings') || {};
    const apiUrl = settings.apiUrl || API_BASE_URL;
    
    console.log(`Analyzing ${data.comments.length} comments for video: ${data.videoTitle}`);
    
    const response = await fetch(`${apiUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comments: data.comments.slice(0, settings.maxComments || 500),
        video_id: data.videoId,
        video_title: data.videoTitle
      })
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      // Store the analysis result
      await setStorage(`analysis_${data.videoId}`, {
        ...result.data,
        timestamp: Date.now()
      });
      
      console.log('Analysis completed successfully');
      sendResponse({ success: true, data: result.data });
    } else {
      throw new Error(result.error || 'Analysis failed');
    }
    
  } catch (error) {
    console.error('Error analyzing comments:', error);
    sendResponse({
      success: false,
      error: error.message || 'Failed to analyze comments'
    });
  }
}

async function getSettings(sendResponse) {
  try {
    const settings = await getStorage('settings') || {
      autoAnalyze: true,
      maxComments: 500,
      showWordCloud: true,
      apiUrl: API_BASE_URL
    };
    
    sendResponse({ success: true, data: settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function updateSettings(newSettings, sendResponse) {
  try {
    const currentSettings = await getStorage('settings') || {};
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    await setStorage('settings', updatedSettings);
    
    sendResponse({ success: true, data: updatedSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function checkAPIHealth(sendResponse) {
  try {
    const settings = await getStorage('settings') || {};
    const apiUrl = settings.apiUrl || API_BASE_URL;
    
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      sendResponse({ success: true, data: result });
    } else {
      throw new Error(`API health check failed: ${response.status}`);
    }
    
  } catch (error) {
    console.error('API health check failed:', error);
    sendResponse({
      success: false,
      error: 'Backend API is not running. Please start the Python backend server.'
    });
  }
}
