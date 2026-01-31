#!/bin/bash
# Lost&Found AI Platform - React Demo Startup Script

echo "🔍 Lost&Found AI Platform - React Demo Setup"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python is not installed. Please install Python 3.11+ and try again."
    exit 1
fi

echo "🚀 Starting Lost&Found AI Platform (React Version)..."

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo "📄 Creating backend environment file..."
    cp backend/.env.example backend/.env
    echo "✅ Backend .env created"
fi

if [ ! -f "frontend/.env" ]; then
    echo "📄 Creating frontend environment file..."
    cp frontend/.env.example frontend/.env
    echo "✅ Frontend .env created"
fi

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $port is already in use. Please stop the service using this port."
        return 1
    fi
    return 0
}

# Check if ports are available
if ! check_port 8000; then
    exit 1
fi

if ! check_port 3000; then
    exit 1
fi

# Start Backend
echo "🐍 Starting FastAPI Backend..."
cd backend

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Download spaCy model
echo "🧠 Downloading spaCy model..."
python -m spacy download en_core_web_sm

# Start backend in background
echo "🚀 Starting backend server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Go back to root
cd ..

# Start Frontend
echo "⚛️ Starting React Frontend..."
cd frontend

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Start frontend
echo "🚀 Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

# Go back to root
cd ..

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo "🔍 Checking $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        
        echo "⏳ Attempt $attempt/$max_attempts - waiting for $service_name..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start"
    return 1
}

# Check backend health
check_service "Backend API" "http://localhost:8000/health"

# Check frontend
check_service "Frontend" "http://localhost:3000"

echo ""
echo "🎉 Lost&Found AI Platform is ready!"
echo "===================================="
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/api/docs"
echo ""
echo "🎮 Demo Instructions:"
echo "1. Open http://localhost:3000"
echo "2. Register a new account"
echo "3. Report a lost item with GPS location"
echo "4. Open another browser/incognito tab"
echo "5. Register as another user"
echo "6. Report found item with image"
echo "7. See AI matching in action!"
echo "8. Complete claim verification flow"
echo ""
echo "🛑 To stop the demo:"
echo "   Press Ctrl+C to stop this script"
echo "   Or kill processes: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📋 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🏆 Ready for Hackathon Demo! Good luck!"

# Open browser automatically (optional)
if command -v open &> /dev/null; then
    echo "🌐 Opening browser..."
    sleep 3
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    echo "🌐 Opening browser..."
    sleep 3
    xdg-open http://localhost:3000
fi

# Wait for user to stop
echo ""
echo "Press Ctrl+C to stop the demo..."

# Trap Ctrl+C to clean up processes
trap 'echo ""; echo "🛑 Stopping demo..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ Demo stopped!"; exit 0' INT

# Keep script running
wait