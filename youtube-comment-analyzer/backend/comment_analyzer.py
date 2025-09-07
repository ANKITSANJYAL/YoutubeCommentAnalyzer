import os
import re
import json
import logging
from typing import List, Dict, Any
from collections import Counter

# Try to import optional dependencies
try:
    import pandas as pd
    import numpy as np
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    print("Warning: pandas/numpy not available. Some features may be limited.")

try:
    from textblob import TextBlob
    HAS_TEXTBLOB = True
except ImportError:
    HAS_TEXTBLOB = False
    print("Warning: TextBlob not available. Fallback sentiment analysis will be used.")

try:
    from transformers import pipeline
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    print("Warning: Transformers not available. Basic sentiment analysis will be used.")

try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
    HAS_NLTK = True
except ImportError:
    HAS_NLTK = False
    print("Warning: NLTK not available. Basic keyword extraction will be used.")

try:
    from wordcloud import WordCloud
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    import base64
    from io import BytesIO
    HAS_WORDCLOUD = True
except ImportError:
    HAS_WORDCLOUD = False
    print("Warning: WordCloud/Matplotlib not available. Word cloud generation disabled.")

# Download required NLTK data
if HAS_NLTK:
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt')

    try:
        nltk.data.find('corpora/stopwords')
    except LookupError:
        nltk.download('stopwords')

class CommentAnalyzer:
    def __init__(self):
        """Initialize the comment analyzer with pre-trained models."""
        self.logger = logging.getLogger(__name__)
        
        # Initialize sentiment analysis pipeline
        self.sentiment_analyzer = None
        if HAS_TRANSFORMERS:
            try:
                self.sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model="distilbert-base-uncased-finetuned-sst-2-english",
                    device=-1  # Use CPU
                )
            except Exception as e:
                self.logger.error(f"Error loading sentiment model: {e}")
        
        # Initialize emotion analysis pipeline
        self.emotion_analyzer = None
        if HAS_TRANSFORMERS:
            try:
                self.emotion_analyzer = pipeline(
                    "text-classification",
                    model="j-hartmann/emotion-english-distilroberta-base",
                    device=-1
                )
            except Exception as e:
                self.logger.error(f"Error loading emotion model: {e}")
        
        # Initialize toxicity detection (using a simple rule-based approach for now)
        self.toxic_keywords = [
            'hate', 'stupid', 'idiot', 'dumb', 'trash', 'garbage', 'terrible',
            'awful', 'worst', 'suck', 'sucks', 'damn', 'hell', 'shut up'
        ]
        
        # Get English stopwords
        if HAS_NLTK:
            try:
                self.stop_words = set(stopwords.words('english'))
            except:
                self.stop_words = set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
        else:
            self.stop_words = set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
    
    def clean_text(self, text: str) -> str:
        """Clean and preprocess text."""
        if not text:
            return ""
        
        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s!?.,]', '', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text.strip()
    
    def analyze_sentiment(self, comments: List[str]) -> Dict[str, Any]:
        """Analyze sentiment of comments."""
        if not comments:
            return {"error": "No comments provided"}
        
        sentiments = []
        sentiment_scores = []
        
        for comment in comments:
            if len(comment.strip()) < 3:  # Skip very short comments
                continue
                
            if self.sentiment_analyzer:
                try:
                    # Use transformers pipeline
                    result = self.sentiment_analyzer(comment[:512])  # Limit to 512 chars
                    sentiment = result[0]['label']
                    score = result[0]['score']
                    
                    sentiments.append(sentiment)
                    sentiment_scores.append(score)
                    continue
                    
                except Exception as e:
                    self.logger.error(f"Error with transformers sentiment: {e}")
            
            # Fallback to TextBlob or simple rule-based sentiment
            if HAS_TEXTBLOB:
                try:
                    blob = TextBlob(comment)
                    polarity = blob.sentiment.polarity
                    
                    if polarity > 0.1:
                        sentiments.append('POSITIVE')
                        sentiment_scores.append(polarity)
                    elif polarity < -0.1:
                        sentiments.append('NEGATIVE')
                        sentiment_scores.append(abs(polarity))
                    else:
                        sentiments.append('NEUTRAL')
                        sentiment_scores.append(0.5)
                    continue
                except Exception as e:
                    self.logger.error(f"Error with TextBlob sentiment: {e}")
            
            # Simple rule-based fallback
            positive_words = ['good', 'great', 'amazing', 'awesome', 'love', 'like', 'best', 'excellent']
            negative_words = ['bad', 'terrible', 'awful', 'hate', 'worst', 'sucks', 'horrible']
            
            comment_lower = comment.lower()
            pos_count = sum(1 for word in positive_words if word in comment_lower)
            neg_count = sum(1 for word in negative_words if word in comment_lower)
            
            if pos_count > neg_count:
                sentiments.append('POSITIVE')
                sentiment_scores.append(0.7)
            elif neg_count > pos_count:
                sentiments.append('NEGATIVE')
                sentiment_scores.append(0.7)
            else:
                sentiments.append('NEUTRAL')
                sentiment_scores.append(0.5)        # Calculate statistics
        sentiment_counts = Counter(sentiments)
        total_comments = len(sentiments)
        
        if total_comments == 0:
            return {"error": "No valid comments to analyze"}
        
        return {
            "total_comments": total_comments,
            "sentiment_distribution": dict(sentiment_counts),
            "sentiment_percentages": {
                sentiment: round((count / total_comments) * 100, 2)
                for sentiment, count in sentiment_counts.items()
            },
            "average_sentiment_score": round(sum(sentiment_scores) / len(sentiment_scores), 3) if sentiment_scores else 0,
            "overall_sentiment": max(sentiment_counts, key=sentiment_counts.get)
        }
    
    def analyze_emotions(self, comments: List[str]) -> Dict[str, Any]:
        """Analyze emotions in comments."""
        if not comments:
            return {"error": "No comments provided"}
        
        emotions = []
        
        for comment in comments:
            if len(comment.strip()) < 3:
                continue
                
            if self.emotion_analyzer:
                try:
                    result = self.emotion_analyzer(comment[:512])
                    emotion = result[0]['label']
                    emotions.append(emotion)
                    continue
                except Exception as e:
                    self.logger.error(f"Error analyzing emotion: {e}")
            
            # Simple rule-based emotion detection fallback
            comment_lower = comment.lower()
            if any(word in comment_lower for word in ['happy', 'joy', 'love', 'great', 'amazing', 'wonderful']):
                emotions.append('joy')
            elif any(word in comment_lower for word in ['angry', 'mad', 'hate', 'furious', 'annoyed']):
                emotions.append('anger')
            elif any(word in comment_lower for word in ['sad', 'depressed', 'upset', 'disappointed']):
                emotions.append('sadness')
            elif any(word in comment_lower for word in ['scared', 'afraid', 'terrified', 'fear']):
                emotions.append('fear')
            elif any(word in comment_lower for word in ['surprised', 'shocked', 'amazed', 'wow']):
                emotions.append('surprise')
            else:
                emotions.append('neutral')
        
        emotion_counts = Counter(emotions)
        total_comments = len(emotions)
        
        if total_comments == 0:
            return {"error": "No valid comments to analyze"}
        
        return {
            "emotion_distribution": dict(emotion_counts),
            "emotion_percentages": {
                emotion: round((count / total_comments) * 100, 2)
                for emotion, count in emotion_counts.items()
            },
            "dominant_emotion": max(emotion_counts, key=emotion_counts.get) if emotion_counts else "unknown"
        }
    
    def detect_toxicity(self, comments: List[str]) -> Dict[str, Any]:
        """Detect toxic comments using rule-based approach."""
        toxic_comments = []
        spam_comments = []
        
        for i, comment in enumerate(comments):
            comment_lower = comment.lower()
            
            # Check for toxicity
            is_toxic = any(keyword in comment_lower for keyword in self.toxic_keywords)
            if is_toxic:
                toxic_comments.append({
                    "index": i,
                    "comment": comment[:100] + "..." if len(comment) > 100 else comment,
                    "reason": "Contains toxic keywords"
                })
            
            # Check for spam (repeated characters, all caps, etc.)
            if len(comment) > 10:
                if comment.isupper() and len(comment) > 20:
                    spam_comments.append({
                        "index": i,
                        "comment": comment[:100] + "..." if len(comment) > 100 else comment,
                        "reason": "All caps"
                    })
                elif len(set(comment)) < 5 and len(comment) > 15:
                    spam_comments.append({
                        "index": i,
                        "comment": comment[:100] + "..." if len(comment) > 100 else comment,
                        "reason": "Repetitive characters"
                    })
        
        total_comments = len(comments)
        return {
            "total_comments": total_comments,
            "toxic_comments": len(toxic_comments),
            "toxic_percentage": round((len(toxic_comments) / total_comments) * 100, 2) if total_comments > 0 else 0,
            "spam_comments": len(spam_comments),
            "spam_percentage": round((len(spam_comments) / total_comments) * 100, 2) if total_comments > 0 else 0,
            "toxic_examples": toxic_comments[:5],  # Show first 5 examples
            "spam_examples": spam_comments[:5]
        }
    
    def extract_keywords(self, comments: List[str], top_n: int = 20) -> List[Dict[str, Any]]:
        """Extract most common keywords from comments."""
        all_words = []
        
        for comment in comments:
            # Clean and tokenize
            clean_comment = self.clean_text(comment.lower())
            if HAS_NLTK:
                words = word_tokenize(clean_comment)
            else:
                # Simple tokenization fallback
                words = clean_comment.split()
            
            # Filter words
            filtered_words = [
                word for word in words
                if word.isalpha() and len(word) > 2 and word not in self.stop_words
            ]
            
            all_words.extend(filtered_words)
        
        # Count words
        word_counts = Counter(all_words)
        
        return [
            {"word": word, "count": count}
            for word, count in word_counts.most_common(top_n)
        ]
    
    def generate_wordcloud(self, comments: List[str]) -> str:
        """Generate a word cloud image and return as base64 string."""
        if not HAS_WORDCLOUD:
            return ""
            
        try:
            # Combine all comments
            text = ' '.join([self.clean_text(comment) for comment in comments])
            
            if len(text.strip()) == 0:
                return ""
            
            # Generate word cloud
            wordcloud = WordCloud(
                width=800,
                height=400,
                background_color='white',
                stopwords=self.stop_words,
                max_words=100,
                relative_scaling=0.5,
                colormap='viridis'
            ).generate(text)
            
            # Convert to base64
            img_buffer = BytesIO()
            plt.figure(figsize=(10, 5))
            plt.imshow(wordcloud, interpolation='bilinear')
            plt.axis('off')
            plt.tight_layout(pad=0)
            plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=100)
            plt.close()
            
            img_buffer.seek(0)
            img_str = base64.b64encode(img_buffer.read()).decode()
            
            return f"data:image/png;base64,{img_str}"
            
        except Exception as e:
            self.logger.error(f"Error generating word cloud: {e}")
            return ""
    
    def analyze_comment_patterns(self, comments: List[str]) -> Dict[str, Any]:
        """Analyze patterns in comments."""
        if not comments:
            return {"error": "No comments to analyze"}
        
        # Length analysis
        lengths = [len(comment) for comment in comments]
        
        # Time pattern analysis (simplified - just look at exclamation marks, questions, etc.)
        exclamations = sum(1 for comment in comments if '!' in comment)
        questions = sum(1 for comment in comments if '?' in comment)
        mentions = sum(1 for comment in comments if '@' in comment)
        
        return {
            "total_comments": len(comments),
            "average_length": round(sum(lengths) / len(lengths), 2) if lengths else 0,
            "median_length": round(sorted(lengths)[len(lengths)//2], 2) if lengths else 0,
            "longest_comment": max(lengths) if lengths else 0,
            "shortest_comment": min(lengths) if lengths else 0,
            "exclamation_percentage": round((exclamations / len(comments)) * 100, 2),
            "question_percentage": round((questions / len(comments)) * 100, 2),
            "mention_percentage": round((mentions / len(comments)) * 100, 2)
        }
    
    def get_comprehensive_analysis(self, comments: List[str]) -> Dict[str, Any]:
        """Get comprehensive analysis of all comments."""
        if not comments:
            return {"error": "No comments provided"}
        
        # Clean comments
        cleaned_comments = [self.clean_text(comment) for comment in comments if comment.strip()]
        
        if not cleaned_comments:
            return {"error": "No valid comments after cleaning"}
        
        # Run all analyses
        analysis = {
            "sentiment_analysis": self.analyze_sentiment(cleaned_comments),
            "emotion_analysis": self.analyze_emotions(cleaned_comments),
            "toxicity_analysis": self.detect_toxicity(cleaned_comments),
            "keywords": self.extract_keywords(cleaned_comments),
            "comment_patterns": self.analyze_comment_patterns(cleaned_comments),
            "wordcloud": self.generate_wordcloud(cleaned_comments)
        }
        
        return analysis
