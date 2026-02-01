#!/usr/bin/env python3
"""Mock server using only Python standard library for Lost&Found AI platform."""
import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
from datetime import datetime

class MockAPIHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    def _send_json_response(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        if self.path == '/':
            self._send_json_response({
                "message": "Lost&Found AI Platform API",
                "version": "1.0.0",
                "status": "running",
                "docs": "/docs"
            })
        elif self.path == '/health':
            self._send_json_response({
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat()
            })
        elif self.path == '/api/dashboard':
            self._send_json_response({
                "user_stats": {
                    "total_items": 3,
                    "lost_items": 2,
                    "found_items": 1,
                    "open_items": 3,
                    "resolved_items": 0
                },
                "recent_items": [],
                "public_items": [
                    {
                        "id": "1",
                        "type": "lost",
                        "product": "iPhone 14 Pro",
                        "brand": "Apple",
                        "color": "Deep Purple",
                        "description": "Lost iPhone with cracked screen protector near campus library",
                        "gps": {"lat": 12.9716, "lng": 77.5946, "address": "Sathyabama University, Chennai"},
                        "status": "open",
                        "created_at": "2026-01-31T10:00:00Z"
                    },
                    {
                        "id": "2",
                        "type": "found",
                        "product": "Leather Wallet",
                        "brand": "Unknown",
                        "color": "Brown", 
                        "description": "Found brown leather wallet in parking lot with ID cards",
                        "gps": {"lat": 12.9716, "lng": 77.5946, "address": "Sathyabama University, Chennai"},
                        "status": "open",
                        "created_at": "2026-01-31T11:00:00Z"
                    },
                    {
                        "id": "3",
                        "type": "lost",
                        "product": "MacBook Air",
                        "brand": "Apple", 
                        "color": "Silver",
                        "description": "Lost MacBook Air with hackathon stickers in computer lab",
                        "gps": {"lat": 12.9716, "lng": 77.5946, "address": "Sathyabama University, Chennai"},
                        "status": "open",
                        "created_at": "2026-01-31T12:00:00Z"
                    }
                ]
            })
        elif self.path.startswith('/api/items/'):
            item_id = self.path.split('/')[-1]
            self._send_json_response({
                "item": {
                    "id": item_id,
                    "type": "lost",
                    "product": "Demo Item",
                    "description": "This is a demo item for testing",
                    "gps": {"lat": 12.9716, "lng": 77.5946, "address": "Sathyabama University"},
                    "status": "open",
                    "created_at": "2026-01-31T10:00:00Z"
                },
                "can_claim": True,
                "can_modify": False
            })
        elif self.path == '/api/items':
            self._send_json_response([])
        else:
            self._send_json_response({"error": "Not found"}, 404)
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8')) if post_data else {}
        except:
            data = {}
        
        if self.path == '/api/auth/login':
            self._send_json_response({
                "access_token": "demo_token_12345",
                "token_type": "bearer",
                "expires_in": 86400
            })
        elif self.path == '/api/auth/register':
            self._send_json_response({
                "access_token": "demo_token_12345", 
                "token_type": "bearer",
                "expires_in": 86400,
                "user": {
                    "id": "1",
                    "email": data.get("email", "demo@lostfound.ai"),
                    "full_name": data.get("full_name", "Demo User"),
                    "role": "USER"
                }
            })
        elif self.path == '/api/items/lost':
            self._send_json_response({
                "item_id": "new_lost_item",
                "message": "Lost item reported successfully"
            })
        elif self.path == '/api/items/found':
            self._send_json_response({
                "item_id": "new_found_item", 
                "message": "Found item reported successfully",
                "matches_found": 1,
                "top_matches": [{
                    "item": {
                        "id": "match_1",
                        "product": "Similar Item",
                        "description": "AI found this matching item"
                    },
                    "score": 0.85,
                    "breakdown": {"image": 0.9, "text_image": 0.8, "location": 0.85, "time": 0.9}
                }]
            })
        elif self.path.startswith('/api/ai/match/'):
            self._send_json_response([{
                "item": {
                    "id": "match_1",
                    "type": "found",
                    "product": "AI Matched Item",
                    "description": "Found by AI matching algorithm",
                    "status": "open"
                },
                "score": 0.92,
                "breakdown": {"image": 0.95, "text_image": 0.88, "location": 0.92, "time": 0.94}
            }])
        else:
            self._send_json_response({"message": "Mock response"})

def run_server():
    server = HTTPServer(('localhost', 8000), MockAPIHandler)
    print("🚀 Mock Lost&Found AI Backend running on http://localhost:8000")
    print("📋 Available endpoints:")
    print("   GET  /              - API info")
    print("   GET  /health        - Health check") 
    print("   GET  /api/dashboard - Dashboard data")
    print("   POST /api/auth/login - Login")
    print("   POST /api/items/lost - Report lost item")
    print("   POST /api/items/found - Report found item")
    print("🛑 Press Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✅ Mock server stopped")
        server.shutdown()

if __name__ == "__main__":
    run_server()