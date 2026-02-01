"""AI matching engine for Lost&Found items using CLIP and ResNet."""
import torch
import torch.nn as nn
from transformers import CLIPProcessor, CLIPModel
from torchvision import models, transforms
from PIL import Image
import numpy as np
import faiss
from typing import List, Dict, Tuple, Optional
import requests
from io import BytesIO
import math
from datetime import datetime, timedelta
from .models import Item, Match
from .config import settings


class ImageEncoder:
    """ResNet-based image encoder for visual similarity."""
    
    def __init__(self):
        # Load pre-trained ResNet50
        self.model = models.resnet50(pretrained=True)
        # Remove the final classification layer to get feature vectors
        self.model = nn.Sequential(*list(self.model.children())[:-1])
        self.model.eval()
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    def encode_image_from_url(self, image_url: str) -> Optional[np.ndarray]:
        """Encode image from URL to feature vector."""
        try:
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            image = Image.open(BytesIO(response.content)).convert('RGB')
            return self.encode_image(image)
        except Exception as e:
            print(f"Error encoding image from URL {image_url}: {e}")
            return None
    
    def encode_image(self, image: Image.Image) -> np.ndarray:
        """Encode PIL image to feature vector."""
        with torch.no_grad():
            # Preprocess image
            input_tensor = self.transform(image).unsqueeze(0)
            
            # Get features
            features = self.model(input_tensor)
            features = features.squeeze().numpy()
            
            # Normalize for cosine similarity
            features = features / np.linalg.norm(features)
            
            return features
    
    def compute_similarity(self, vector1: np.ndarray, vector2: np.ndarray) -> float:
        """Compute cosine similarity between two vectors."""
        return float(np.dot(vector1, vector2))


class TextImageEncoder:
    """CLIP-based encoder for text-image cross-modal matching."""
    
    def __init__(self):
        # Load CLIP model
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.model.eval()
    
    def encode_text(self, text: str) -> np.ndarray:
        """Encode text description to feature vector."""
        with torch.no_grad():
            inputs = self.processor(text=[text], return_tensors="pt", padding=True)
            text_features = self.model.get_text_features(**inputs)
            # Normalize
            text_features = text_features / text_features.norm(p=2, dim=-1, keepdim=True)
            return text_features.squeeze().numpy()
    
    def encode_image_from_url(self, image_url: str) -> Optional[np.ndarray]:
        """Encode image from URL using CLIP."""
        try:
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            image = Image.open(BytesIO(response.content)).convert('RGB')
            return self.encode_image(image)
        except Exception as e:
            print(f"Error encoding image with CLIP from URL {image_url}: {e}")
            return None
    
    def encode_image(self, image: Image.Image) -> np.ndarray:
        """Encode PIL image using CLIP."""
        with torch.no_grad():
            inputs = self.processor(images=image, return_tensors="pt")
            image_features = self.model.get_image_features(**inputs)
            # Normalize
            image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
            return image_features.squeeze().numpy()
    
    def compute_similarity(self, vector1: np.ndarray, vector2: np.ndarray) -> float:
        """Compute cosine similarity between two vectors."""
        return float(np.dot(vector1, vector2))


class LocationMatcher:
    """Location-based matching using GPS coordinates."""
    
    @staticmethod
    def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate haversine distance between two GPS points in kilometers."""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    @staticmethod
    def location_similarity(item1: Item, item2: Item, max_distance_km: float = 10.0) -> float:
        """Calculate location similarity score (0-1)."""
        distance = LocationMatcher.haversine_distance(
            item1.gps.lat, item1.gps.lng,
            item2.gps.lat, item2.gps.lng
        )
        
        if distance >= max_distance_km:
            return 0.0
        
        # Linear decay: 1.0 at distance 0, 0.0 at max_distance
        return max(0.0, 1.0 - (distance / max_distance_km))


class TimeMatcher:
    """Time-based matching for lost/found correlation."""
    
    @staticmethod
    def time_similarity(item1: Item, item2: Item, max_hours: float = 168.0) -> float:  # 7 days
        """Calculate time similarity score (0-1)."""
        time_diff = abs((item1.created_at - item2.created_at).total_seconds()) / 3600.0  # hours
        
        if time_diff >= max_hours:
            return 0.0
        
        # Exponential decay favoring recent matches
        return math.exp(-time_diff / (max_hours / 3))


class AIMatchingEngine:
    """Main AI matching engine combining multiple similarity metrics."""
    
    def __init__(self):
        self.image_encoder = ImageEncoder()
        self.clip_encoder = TextImageEncoder()
        self.location_matcher = LocationMatcher()
        self.time_matcher = TimeMatcher()
        
        # Similarity weights (must sum to 1.0)
        self.weights = {
            "image": 0.35,      # Image-to-image similarity
            "text_image": 0.25, # Text-to-image cross-modal
            "location": 0.25,   # GPS proximity
            "time": 0.15        # Temporal proximity
        }
        
        # Minimum score threshold for matches
        self.min_match_score = 0.75
    
    async def generate_embeddings(self, item: Item) -> Dict[str, np.ndarray]:
        """Generate all embeddings for an item."""
        embeddings = {}
        
        # Text description embedding (always available)
        text_description = f"{item.product} {item.brand or ''} {item.color or ''} {item.description}".strip()
        embeddings["text"] = self.clip_encoder.encode_text(text_description)
        
        # Image embeddings (if image available)
        if item.image_url:
            # ResNet image features
            resnet_features = self.image_encoder.encode_image_from_url(item.image_url)
            if resnet_features is not None:
                embeddings["image"] = resnet_features
            
            # CLIP image features
            clip_features = self.clip_encoder.encode_image_from_url(item.image_url)
            if clip_features is not None:
                embeddings["clip_image"] = clip_features
        
        return embeddings
    
    def calculate_similarity_scores(self, item1: Item, item2: Item) -> Dict[str, float]:
        """Calculate detailed similarity scores between two items."""
        scores = {}
        
        # Image similarity (ResNet features)
        if item1.image_vector and item2.image_vector:
            vec1 = np.array(item1.image_vector)
            vec2 = np.array(item2.image_vector)
            scores["image"] = self.image_encoder.compute_similarity(vec1, vec2)
        else:
            scores["image"] = 0.0
        
        # Text-image cross-modal similarity (CLIP)
        if item1.text_vector and item2.image_vector:
            text_vec = np.array(item1.text_vector)
            img_vec = np.array(item2.image_vector)
            scores["text_image"] = self.clip_encoder.compute_similarity(text_vec, img_vec)
        elif item2.text_vector and item1.image_vector:
            text_vec = np.array(item2.text_vector)
            img_vec = np.array(item1.image_vector)
            scores["text_image"] = self.clip_encoder.compute_similarity(text_vec, img_vec)
        else:
            scores["text_image"] = 0.0
        
        # Location similarity
        scores["location"] = self.location_matcher.location_similarity(item1, item2)
        
        # Time similarity
        scores["time"] = self.time_matcher.time_similarity(item1, item2)
        
        return scores
    
    def calculate_overall_score(self, scores: Dict[str, float]) -> float:
        """Calculate weighted overall similarity score."""
        overall_score = 0.0
        for metric, score in scores.items():
            weight = self.weights.get(metric, 0.0)
            overall_score += weight * score
        
        return overall_score
    
    async def find_matches(self, target_item: Item, candidate_items: List[Item]) -> List[Dict]:
        """Find and rank matches for a target item."""
        matches = []
        
        for candidate in candidate_items:
            # Skip if same user owns both items
            if target_item.owner_id == candidate.owner_id:
                continue
            
            # Calculate similarity scores
            scores = self.calculate_similarity_scores(target_item, candidate)
            overall_score = self.calculate_overall_score(scores)
            
            # Only include matches above threshold
            if overall_score >= self.min_match_score:
                matches.append({
                    "item": candidate,
                    "overall_score": overall_score,
                    "breakdown": scores
                })
        
        # Sort by overall score (descending)
        matches.sort(key=lambda x: x["overall_score"], reverse=True)
        
        return matches[:10]  # Return top 10 matches
    
    async def create_match_record(self, lost_item: Item, found_item: Item, scores: Dict[str, float]) -> Match:
        """Create a Match record for database storage."""
        overall_score = self.calculate_overall_score(scores)
        
        match = Match(
            lost_item_id=lost_item.id,
            found_item_id=found_item.id,
            overall_score=overall_score,
            image_score=scores.get("image"),
            text_score=scores.get("text_image"),
            location_score=scores.get("location"),
            time_score=scores.get("time")
        )
        
        return match


class VectorDatabase:
    """FAISS-based vector database for efficient similarity search."""
    
    def __init__(self):
        self.index = None
        self.dimension = 2048  # ResNet50 feature dimension
        self.item_ids = []
        
    def initialize_index(self, dimension: int = 2048):
        """Initialize FAISS index."""
        self.dimension = dimension
        # Use L2 distance (can be converted to cosine similarity)
        self.index = faiss.IndexFlatL2(dimension)
        print(f"Initialized FAISS index with dimension {dimension}")
    
    def add_vectors(self, vectors: np.ndarray, item_ids: List[str]):
        """Add vectors to the index."""
        if self.index is None:
            self.initialize_index(vectors.shape[1])
        
        # Normalize vectors for cosine similarity
        normalized_vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
        
        self.index.add(normalized_vectors.astype('float32'))
        self.item_ids.extend(item_ids)
    
    def search(self, query_vector: np.ndarray, k: int = 10) -> Tuple[List[float], List[str]]:
        """Search for similar vectors."""
        if self.index is None or self.index.ntotal == 0:
            return [], []
        
        # Normalize query vector
        query_vector = query_vector / np.linalg.norm(query_vector)
        query_vector = query_vector.reshape(1, -1).astype('float32')
        
        # Search
        distances, indices = self.index.search(query_vector, min(k, self.index.ntotal))
        
        # Convert L2 distances to cosine similarities
        similarities = [1 - (dist / 2) for dist in distances[0]]
        matched_ids = [self.item_ids[idx] for idx in indices[0] if idx < len(self.item_ids)]
        
        return similarities, matched_ids


# Global instances
ai_engine = AIMatchingEngine()
vector_db = VectorDatabase()