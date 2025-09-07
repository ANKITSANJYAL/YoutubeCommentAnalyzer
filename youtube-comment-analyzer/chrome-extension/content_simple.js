// YouTube Comment Analyzer Content Script
console.log('YOUTUBE COMMENT ANALYZER: Content script loaded');

// Test element to confirm script injection
function createTestElement() {
    const testDiv = document.createElement('div');
    testDiv.id = 'yt-analyzer-test';
    testDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1976d2;
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial;
        font-size: 14px;
    `;
    testDiv.textContent = 'YouTube Analyzer: Active';
    
    document.body.appendChild(testDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        testDiv.remove();
    }, 5000);
    
    console.log('Test element injected');
}

// Test backend connection
async function testBackend() {
    try {
        const response = await fetch('http://localhost:8000/health');
        if (response.ok) {
            const data = await response.json();
            console.log('Backend connected:', data);
            return true;
        }
    } catch (error) {
        console.error('Backend connection failed:', error);
        return false;
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    console.log('Initializing YouTube Comment Analyzer...');
    
    // Only run on YouTube video pages
    if (window.location.hostname === 'www.youtube.com' && window.location.pathname === '/watch') {
        console.log('On YouTube video page');
        createTestElement();
        testBackend();
        
        // Try to inject a simple dashboard after 3 seconds
        setTimeout(injectSimpleDashboard, 3000);
    } else {
        console.log('Not on YouTube video page');
    }
}

function injectSimpleDashboard() {
    // Remove any existing dashboard
    const existing = document.getElementById('simple-analyzer-dashboard');
    if (existing) existing.remove();
    
    // Create simple dashboard
    const dashboard = document.createElement('div');
    dashboard.id = 'simple-analyzer-dashboard';
    dashboard.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        width: 350px;
        max-height: 70vh;
        background: white;
        border: 2px solid #4CAF50;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: Arial, sans-serif;
        overflow-y: auto;
    `;
    
    dashboard.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #4CAF50;">Comment Analyzer</h3>
        <button id="simple-analyze-btn" style="
            width: 100%;
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        ">Analyze Comments</button>
        <div id="simple-results" style="margin-top: 15px; font-size: 12px;"></div>
        <button onclick="this.parentElement.remove()" style="
            position: absolute;
            top: 5px;
            right: 10px;
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
        ">×</button>
    `;
    
    document.body.appendChild(dashboard);
    
    // Add click handler
    const analyzeBtn = document.getElementById('simple-analyze-btn');
    const resultsDiv = document.getElementById('simple-results');
    
    analyzeBtn.addEventListener('click', async () => {
        analyzeBtn.textContent = 'Analyzing...';
        analyzeBtn.disabled = true;
        resultsDiv.innerHTML = '<p style="color: blue;">Extracting comments...</p>';
        
        try {
            // Extract comments
            const comments = extractComments();
            resultsDiv.innerHTML = `<p style="color: green;">Found ${comments.length} comments</p>`;
            
            if (comments.length > 0) {
                // Analyze ALL comments
                console.log('Sending comments to API:', comments.length);
                const response = await fetch('http://localhost:8000/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        comments: comments, // ALL comments, not just 10
                        video_id: getCurrentVideoId(),
                        video_title: document.title
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('API Response:', result); // Debug log
                    
                    if (result.success && result.data) {
                        const data = result.data;
                        displayFullDashboard(data, resultsDiv);
                    } else if (result.sentiment_summary) {
                        // Handle sentiment-only response
                        const percentages = result.sentiment_summary;
                        displaySentimentOnly(percentages, result.total_comments, resultsDiv);
                    } else {
                        throw new Error(result.error || 'Unknown API error');
                    }
                } else {
                    throw new Error(`API Error: ${response.status}`);
                }
            } else {
                resultsDiv.innerHTML = '<p style="color: orange;">No comments found. Try scrolling to load more comments first.</p>';
            }
        } catch (error) {
            console.error('Analysis error:', error);
            resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
        
        analyzeBtn.textContent = 'Analyze Comments';
        analyzeBtn.disabled = false;
    });
    
    console.log('Simple dashboard injected');
}

function extractComments() {
    // Try multiple selectors for comments
    const selectors = [
        '#contents ytd-comment-thread-renderer #content-text',
        'ytd-comment-thread-renderer #content-text',
        '.comment-text',
        '[id="content-text"]'
    ];
    
    let commentElements = [];
    for (const selector of selectors) {
        commentElements = document.querySelectorAll(selector);
        if (commentElements.length > 0) {
            console.log(`📝 Found comments using selector: ${selector}`);
            break;
        }
    }
    
    const comments = [];
    commentElements.forEach(element => {
        const text = element.textContent.trim();
        if (text && text.length > 0) {
            comments.push(text);
        }
    });
    
    console.log(`📝 Extracted ${comments.length} comments from ${commentElements.length} elements`);
    return comments;
}

function getCurrentVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
}

function displayFullDashboard(data, resultsDiv) {
    console.log('🎨 Displaying full dashboard with data:', data);
    
    const sentiment = data.sentiment_analysis || {};
    const toxicity = data.toxicity_analysis || {};
    const keywords = data.keywords || [];
    const emotions = data.emotion_analysis || {};
    const patterns = data.comment_patterns || {};
    const metadata = data.metadata || {};
    
    // Extract percentages correctly
    const sentimentPercentages = sentiment.sentiment_percentages || {};
    const positivePercent = sentimentPercentages.POSITIVE || 0;
    const negativePercent = sentimentPercentages.NEGATIVE || 0;
    const neutralPercent = sentimentPercentages.NEUTRAL || 0;
    
    resultsDiv.innerHTML = `
        <div style="max-height: 400px; overflow-y: auto;">
            <p style="color: green; font-weight: bold; margin: 10px 0;">Complete Analysis</p>
            
            <!-- Sentiment Analysis -->
            <div style="background: #f0f8ff; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <h4 style="margin: 0 0 8px 0; color: #1976d2;">Sentiment</h4>
                <p style="margin: 3px 0;">Positive: ${positivePercent.toFixed(1)}%</p>
                <p style="margin: 3px 0;">Negative: ${negativePercent.toFixed(1)}%</p>
                <p style="margin: 3px 0;">Neutral: ${neutralPercent.toFixed(1)}%</p>
                <p style="margin: 3px 0; font-size: 10px; color: #666;">Overall: ${sentiment.overall_sentiment || 'N/A'}</p>
            </div>
            
            <!-- Safety Metrics -->
            <div style="background: #fff3e0; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <h4 style="margin: 0 0 8px 0; color: #f57c00;">Safety</h4>
                <p style="margin: 3px 0;">Toxic: ${(toxicity.toxic_percentage || 0).toFixed(1)}%</p>
                <p style="margin: 3px 0;">Spam: ${(toxicity.spam_percentage || 0).toFixed(1)}%</p>
            </div>
            
            <!-- Top Keywords -->
            <div style="background: #f3e5f5; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <h4 style="margin: 0 0 8px 0; color: #7b1fa2;">Keywords</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                    ${keywords.slice(0, 8).map(kw => 
                        `<span style="background: #e1bee7; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${kw.word || kw}</span>`
                    ).join('')}
                </div>
            </div>
            
            <!-- Emotion Analysis -->
            ${emotions.dominant_emotion ? `
            <div style="background: #e8f5e8; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <h4 style="margin: 0 0 8px 0; color: #2e7d32;">Emotions</h4>
                <p style="margin: 3px 0;">Dominant: ${emotions.dominant_emotion}</p>
                ${emotions.emotion_percentages ? Object.entries(emotions.emotion_percentages).slice(0, 3).map(([emotion, percent]) => 
                    `<p style="margin: 2px 0; font-size: 10px;">• ${emotion}: ${percent.toFixed(1)}%</p>`
                ).join('') : ''}
            </div>
            ` : ''}
            
            <!-- Word Cloud -->
            ${data.wordcloud ? `
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <h4 style="margin: 0 0 8px 0; color: #6c757d;">Word Cloud</h4>
                <img src="${data.wordcloud}" alt="Word Cloud" style="width: 100%; max-height: 150px; object-fit: contain; border-radius: 4px;">
            </div>
            ` : ''}
            
            <!-- Statistics -->
            <div style="background: #fafafa; padding: 10px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #4caf50;">
                <h4 style="margin: 0 0 8px 0; color: #388e3c;">Statistics</h4>
                <p style="margin: 3px 0; font-size: 11px;">Comments: ${sentiment.total_comments || metadata.comments_analyzed || 0}</p>
                <p style="margin: 3px 0; font-size: 11px;">Avg Length: ${patterns.average_length ? patterns.average_length.toFixed(1) : 'N/A'}</p>
                <p style="margin: 3px 0; font-size: 11px;">Exclamations: ${patterns.exclamation_percentage ? patterns.exclamation_percentage.toFixed(1) + '%' : 'N/A'}</p>
                <p style="margin: 3px 0; font-size: 11px;">Questions: ${patterns.question_percentage ? patterns.question_percentage.toFixed(1) + '%' : 'N/A'}</p>
            </div>
        </div>
    `;
}

function displaySentimentOnly(sentiment, totalComments, resultsDiv) {
    resultsDiv.innerHTML = `
        <p style="color: green;">Analysis Complete</p>
        <p>Positive: ${(sentiment.positive_percentage || 0).toFixed(1)}%</p>
        <p>Negative: ${(sentiment.negative_percentage || 0).toFixed(1)}%</p>
        <p>Neutral: ${(sentiment.neutral_percentage || 0).toFixed(1)}%</p>
        <p style="color: #666; font-size: 10px;">Total: ${totalComments} comments</p>
    `;
}

console.log('🔧 Enhanced YouTube Comment Analyzer script ready!');
