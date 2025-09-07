# YouTube Comment Analyzer

A professional AI-powered Chrome extension that analyzes YouTube video comments to provide comprehensive insights about sentiment, emotions, toxicity detection, and content patterns.

## Overview

This system provides real-time analysis of YouTube comments using advanced machine learning models to deliver actionable insights for content creators, researchers, and marketers.

## Key Features

- **Sentiment Analysis**: Advanced classification of comments as positive, negative, or neutral using RoBERTa models
- **Emotion Detection**: Multi-label emotion classification identifying joy, anger, sadness, fear, surprise, and disgust
- **Toxicity Detection**: Real-time identification of potentially harmful, toxic, or spam content
- **Keyword Extraction**: Automated extraction and ranking of the most significant terms and topics
- **Comment Pattern Analysis**: Statistical analysis of comment structure, length, questions, and exclamations
- **Word Cloud Generation**: Visual representation of comment themes and topics
- **Integrated Dashboard**: Seamless integration with YouTube's interface for immediate insights

## Technical Architecture

### Backend Components
- **FastAPI Server**: High-performance REST API built with Python
- **Machine Learning Pipeline**: 
  - Sentiment: `cardiffnlp/twitter-roberta-base-sentiment-latest`
  - Toxicity: `unitary/toxic-bert`
  - Emotion: `j-hartmann/emotion-english-distilroberta-base`
- **Data Processing**: Advanced text preprocessing and feature extraction
- **Visualization**: Dynamic word cloud generation with base64 encoding

### Frontend Components
- **Chrome Extension**: Manifest V3 compliant browser extension
- **Content Scripts**: Non-intrusive comment extraction and analysis triggering
- **Real-time Dashboard**: Responsive interface with comprehensive analytics display
- **Cross-Origin Resource Sharing**: Secure communication between extension and backend

## Installation and Setup

### Prerequisites
- Python 3.8 or higher
- Google Chrome browser
- Internet connection for model downloads (first run only)

### Backend Installation

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the API server**:
   ```bash
   python main.py
   ```

4. **Verify installation**:
   - Access `http://localhost:8000` to confirm server status
   - Expected response: `{"message": "YouTube Comment Analyzer API is running"}`

### Chrome Extension Installation

1. **Access Chrome Extensions**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner

2. **Load the extension**:
   - Click "Load unpacked extension"
   - Select the `chrome-extension` directory from this project
   - Confirm the extension appears in your extensions list with "YouTube Comment Analyzer" title

3. **Extension Configuration**:
   - Pin the extension to toolbar for easy access (optional)
   - Ensure the extension has active permissions for YouTube domains

## Usage Guide

### Operation Workflow

1. **Backend Service**:
   ```bash
   cd backend
   python main.py
   ```
   Ensure the API server is running before using the extension.

2. **YouTube Integration**:
   - Navigate to any YouTube video (`https://youtube.com/watch?v=...`)
   - Allow the page to fully load and render comments
   - The analysis dashboard will automatically inject into the page interface

3. **Comment Analysis**:
   - Click "Analyze Comments" in the integrated dashboard
   - The system will extract visible comments and perform comprehensive analysis
   - Results include sentiment distribution, safety metrics, keyword extraction, and pattern analysis

4. **Results Interpretation**:
   - **Sentiment Analysis**: Percentage breakdown of positive, negative, and neutral comments
   - **Safety Metrics**: Toxicity and spam detection percentages
   - **Keyword Analysis**: Most frequently mentioned terms with visual representation
   - **Comment Patterns**: Statistical analysis of comment characteristics
   - **Word Cloud**: Visual representation of comment themes and topics

## API Endpoints

### Health Check
```
GET /health
Response: {"status": "healthy", "message": "YouTube Comment Analyzer API is running"}
```

### Comment Analysis
```
POST /analyze
Content-Type: application/json

Request Body:
{
  "comments": ["array", "of", "comment", "strings"],
  "video_id": "youtube_video_id",
  "video_title": "Video Title"
}

Response:
{
  "success": true,
  "data": {
    "sentiment_analysis": {...},
    "toxicity_analysis": {...},
    "emotion_analysis": {...},
    "keywords": [...],
    "wordcloud": "base64_encoded_image",
    "comment_patterns": {...},
    "metadata": {...}
  }
}
```

## Technical Specifications

### Dependencies
- **Backend**: FastAPI, transformers, torch, wordcloud, pandas, numpy
- **Frontend**: Vanilla JavaScript (ES6+), Chrome Extension APIs
- **Models**: Pre-trained Hugging Face transformer models for NLP tasks

### Performance Characteristics
- **Processing Speed**: ~100-500 comments per second (depending on hardware)
- **Memory Usage**: ~2-4GB for model loading (first run)
- **Network**: Minimal bandwidth usage after initial model download

### Browser Compatibility
- Google Chrome (recommended)
- Chromium-based browsers with Manifest V3 support

## Development and Customization

### Project Structure
```
youtube-comment-analyzer/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── comment_analyzer.py  # Core analysis logic and ML models
│   └── requirements.txt     # Python dependencies
├── chrome-extension/
│   ├── manifest.json       # Extension configuration
│   ├── content_simple.js   # Content script for YouTube integration
│   ├── popup.html          # Extension popup interface
│   ├── popup.js            # Popup functionality
│   ├── background.js       # Service worker
│   ├── dashboard.css       # Styling for analysis dashboard
│   └── icons/              # Extension icons
└── README.md
```

### Configuration Options
- **Model Selection**: Modify `comment_analyzer.py` to use different pre-trained models
- **Analysis Parameters**: Adjust thresholds and parameters in the analyzer configuration
- **UI Customization**: Update `dashboard.css` and content script styling

## Troubleshooting

### Common Issues

**Backend Connection Errors**:
- Verify the backend server is running on `http://localhost:8000`
- Check firewall settings and port availability
- Ensure all Python dependencies are correctly installed

**Extension Not Loading**:
- Confirm Developer Mode is enabled in Chrome Extensions
- Reload the extension after making changes
- Check browser console for JavaScript errors

**Analysis Not Displaying**:
- Ensure you're on a YouTube video page with comments enabled
- Try scrolling down to load more comments before analysis
- Check browser network tab for API request failures

**Performance Issues**:
- Consider reducing the number of comments analyzed for large videos
- Ensure adequate system memory for model loading
- Monitor CPU usage during analysis

## License and Attribution

This project utilizes several open-source models and libraries. Please refer to individual component licenses for specific terms and attribution requirements.

## Support and Contributions

For technical support, feature requests, or contributions, please refer to the project repository documentation and contribution guidelines.
   - Word cloud (if enabled)

## API Endpoints

The backend provides several API endpoints:

- `GET /` - Health check
- `GET /health` - Service health status
- `POST /analyze` - Complete comment analysis
- `POST /analyze/sentiment` - Sentiment analysis only
- `POST /analyze/toxicity` - Toxicity detection only
- `POST /analyze/keywords` - Keyword extraction only

## Configuration

### Extension Settings

Access settings through the extension popup:

- **Auto-analyze videos**: Automatically analyze comments when visiting videos
- **Max comments**: Limit number of comments analyzed (100-1000)
- **Show word cloud**: Enable/disable word cloud generation

### Backend Configuration

Modify `backend/main.py` to change:

- Server port (default: 8000)
- CORS settings
- Analysis parameters

## AI Models Used

1. **Sentiment Analysis**: `distilbert-base-uncased-finetuned-sst-2-english`
2. **Emotion Detection**: `j-hartmann/emotion-english-distilroberta-base`
3. **Toxicity Detection**: Rule-based approach with keyword filtering
4. **Keyword Extraction**: NLTK with stopword filtering

## Troubleshooting

### Common Issues

1. **"Backend Offline" error**:
   - Make sure Python backend is running on `localhost:8000`
   - Check console for error messages
   - Verify all dependencies are installed

2. **No comments found**:
   - Video may have comments disabled
   - Try scrolling down to load more comments
   - Wait for YouTube to fully load

3. **Analysis fails**:
   - Check browser console (F12) for errors
   - Verify backend server logs
   - Try with fewer comments (adjust max comments setting)

4. **Extension not working**:
   - Reload the extension in `chrome://extensions/`
   - Check that you're on a YouTube video page
   - Clear browser cache and reload

### Performance Tips

- Limit max comments to 500 for faster analysis
- Use sentiment-only analysis for quicker results
- Disable word cloud generation to improve speed

## Development

### Project Structure

```
youtube-comment-analyzer/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── comment_analyzer.py  # AI analysis logic
│   └── requirements.txt     # Python dependencies
├── chrome-extension/
│   ├── manifest.json        # Extension configuration
│   ├── background.js        # Service worker
│   ├── content.js          # YouTube page integration
│   ├── popup.html          # Extension popup UI
│   ├── popup.js            # Popup logic
│   ├── dashboard.css       # Dashboard styling
│   └── icons/              # Extension icons
└── README.md
```

### Adding New Analysis Features

1. **Backend**: Add new analysis functions to `comment_analyzer.py`
2. **API**: Create new endpoints in `main.py`
3. **Frontend**: Update `content.js` to display new results
4. **Styling**: Add CSS to `dashboard.css`

## Privacy & Security

- All analysis happens locally (no external APIs)
- Comments are not stored permanently
- No personal data is collected or transmitted
- Open source and fully auditable

## License

MIT License - Feel free to modify and distribute

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Check backend server logs
4. Open an issue on GitHub
