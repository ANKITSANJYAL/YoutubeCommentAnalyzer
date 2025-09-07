document.addEventListener('DOMContentLoaded', async function() {
    const statusElement = document.getElementById('status');
    const analyzeButton = document.getElementById('analyze');
    const loadingElement = document.getElementById('loading');
    const resultsElement = document.getElementById('results');
    const manualSetupButton = document.getElementById('manual-setup');
    const instructionsElement = document.getElementById('instructions');

    // Show manual instructions immediately for simpler user experience
    showManualInstructions();

    // Check if we're on a YouTube video page
    let currentTab;
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTab = tabs[0];
        
        if (!currentTab?.url?.includes('youtube.com/watch')) {
            statusElement.textContent = '⚠️ Please navigate to a YouTube video page first';
            analyzeButton.disabled = true;
            return;
        }
        
        statusElement.textContent = 'YouTube video detected ✅';
    } catch (error) {
        console.error('Error getting current tab:', error);
        statusElement.textContent = '❌ Unable to access current tab';
        return;
    }

    // Skip backend status check due to Chrome extension security restrictions
    // The backend status will be checked when the user actually tries to analyze
    statusElement.textContent = '✅ Ready to analyze! (Backend should be running)';
    statusElement.style.color = '#4CAF50';

    function showManualInstructions() {
        instructionsElement.style.display = 'block';
        instructionsElement.innerHTML = `
            <div style="background: #e8f5e8; padding: 15px; border-radius: 4px; margin-top: 10px; border-left: 4px solid #4CAF50;">
                <h4 style="margin: 0 0 10px 0; color: #2e7d32;">🎯 How to Use (Recommended)</h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.4;">
                    <li><strong>Go to any YouTube video</strong> (e.g., music videos work great)</li>
                    <li><strong>Refresh the page</strong> to load the analyzer</li>
                    <li><strong>Look for "Comment Analysis" panel</strong> on the right side</li>
                    <li><strong>Click "Analyze Comments"</strong> in that panel</li>
                    <li><strong>Wait 10-30 seconds</strong> for AI analysis results</li>
                </ol>
                <div style="margin-top: 12px; padding: 10px; background: #fff3cd; border-radius: 3px; font-size: 11px;">
                    <strong>💡 Pro Tip:</strong> The dashboard loads automatically on YouTube video pages. If you don't see it immediately, refresh the page and wait 2-3 seconds.
                </div>
                <div style="margin-top: 8px; padding: 8px; background: #ffeaa7; border-radius: 3px; font-size: 11px;">
                    <strong>🔍 What You'll See:</strong> Sentiment %, toxicity levels, top keywords, emotional analysis, and comment patterns!
                </div>
            </div>
        `;
    }

    // Simplified analyze function that focuses on user instruction
    async function analyzeCurrentVideo() {
        if (!currentTab) {
            statusElement.textContent = '❌ No active tab found';
            return;
        }

        // Simple approach: Just show instructions
        statusElement.textContent = '📋 Please use the dashboard method below';
        statusElement.style.color = '#1976d2';
        showManualInstructions();
        
        // Also try to refresh the current tab to reload the content script
        try {
            await chrome.tabs.reload(currentTab.id);
            statusElement.textContent = '🔄 Page refreshed - Look for the dashboard on the right!';
        } catch (error) {
            console.log('Could not refresh tab:', error);
        }
    }

    // Event listeners
    analyzeButton.addEventListener('click', analyzeCurrentVideo);
    
    manualSetupButton.addEventListener('click', function() {
        showManualInstructions();
    });
});
