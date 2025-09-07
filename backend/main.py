from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import logging
import json
from comment_analyzer import CommentAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="YouTube Comment Analyzer API", version="1.0.0")

# Configure CORS to allow requests from Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the extension's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the comment analyzer
comment_analyzer = CommentAnalyzer()

class CommentRequest(BaseModel):
    comments: List[str]
    video_id: str = ""
    video_title: str = ""

class AnalysisResponse(BaseModel):
    success: bool
    data: Dict[str, Any] = None
    error: str = None

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "YouTube Comment Analyzer API is running!"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "youtube-comment-analyzer"}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_comments(request: CommentRequest):
    """
    Analyze YouTube comments for sentiment, emotions, toxicity, and patterns.
    """
    try:
        if not request.comments:
            raise HTTPException(status_code=400, detail="No comments provided")
        
        if len(request.comments) > 1000:
            # Limit to first 1000 comments for performance
            comments_to_analyze = request.comments[:1000]
            logger.info(f"Limiting analysis to first 1000 comments out of {len(request.comments)}")
        else:
            comments_to_analyze = request.comments
        
        logger.info(f"Starting analysis of {len(comments_to_analyze)} comments")
        
        # Get comprehensive analysis
        analysis_result = comment_analyzer.get_comprehensive_analysis(comments_to_analyze)
        
        # Add metadata
        analysis_result["metadata"] = {
            "video_id": request.video_id,
            "video_title": request.video_title,
            "total_comments_received": len(request.comments),
            "comments_analyzed": len(comments_to_analyze),
            "analysis_version": "1.0.0"
        }
        
        logger.info("Analysis completed successfully")
        
        return AnalysisResponse(success=True, data=analysis_result)
        
    except Exception as e:
        logger.error(f"Error analyzing comments: {str(e)}")
        return AnalysisResponse(
            success=False,
            error=f"Analysis failed: {str(e)}"
        )

@app.post("/analyze/sentiment", response_model=AnalysisResponse)
async def analyze_sentiment_only(request: CommentRequest):
    """
    Analyze only sentiment of comments (faster endpoint).
    """
    try:
        if not request.comments:
            raise HTTPException(status_code=400, detail="No comments provided")
        
        cleaned_comments = [
            comment_analyzer.clean_text(comment) 
            for comment in request.comments[:500]  # Limit to 500 for speed
            if comment.strip()
        ]
        
        if not cleaned_comments:
            raise HTTPException(status_code=400, detail="No valid comments after cleaning")
        
        sentiment_result = comment_analyzer.analyze_sentiment(cleaned_comments)
        
        return AnalysisResponse(success=True, data=sentiment_result)
        
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        return AnalysisResponse(
            success=False,
            error=f"Sentiment analysis failed: {str(e)}"
        )

@app.post("/analyze/toxicity", response_model=AnalysisResponse)
async def analyze_toxicity_only(request: CommentRequest):
    """
    Analyze only toxicity of comments.
    """
    try:
        if not request.comments:
            raise HTTPException(status_code=400, detail="No comments provided")
        
        cleaned_comments = [
            comment_analyzer.clean_text(comment) 
            for comment in request.comments
            if comment.strip()
        ]
        
        if not cleaned_comments:
            raise HTTPException(status_code=400, detail="No valid comments after cleaning")
        
        toxicity_result = comment_analyzer.detect_toxicity(cleaned_comments)
        
        return AnalysisResponse(success=True, data=toxicity_result)
        
    except Exception as e:
        logger.error(f"Error analyzing toxicity: {str(e)}")
        return AnalysisResponse(
            success=False,
            error=f"Toxicity analysis failed: {str(e)}"
        )

@app.post("/analyze/keywords", response_model=AnalysisResponse)
async def extract_keywords_only(request: CommentRequest):
    """
    Extract keywords from comments.
    """
    try:
        if not request.comments:
            raise HTTPException(status_code=400, detail="No comments provided")
        
        cleaned_comments = [
            comment_analyzer.clean_text(comment) 
            for comment in request.comments
            if comment.strip()
        ]
        
        if not cleaned_comments:
            raise HTTPException(status_code=400, detail="No valid comments after cleaning")
        
        keywords = comment_analyzer.extract_keywords(cleaned_comments, top_n=30)
        
        return AnalysisResponse(success=True, data={"keywords": keywords})
        
    except Exception as e:
        logger.error(f"Error extracting keywords: {str(e)}")
        return AnalysisResponse(
            success=False,
            error=f"Keyword extraction failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
