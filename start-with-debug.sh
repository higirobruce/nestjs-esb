#!/bin/bash

echo "🚀 Starting NestJS ESB with JWT Debugging..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update JWT secrets for production!"
else
    echo "✅ .env file exists"
fi

# Check JWT configuration
echo ""
echo "🔐 JWT Configuration:"
if grep -q "JWT_SECRET" .env; then
    JWT_SECRET=$(grep "JWT_SECRET=" .env | head -1 | cut -d '=' -f2)
    if [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-this-in-production" ]; then
        echo "⚠️  Using default JWT_SECRET - change this for production!"
    else
        echo "✅ Custom JWT_SECRET configured"
    fi
else
    echo "❌ JWT_SECRET not found in .env"
    echo "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production" >> .env
fi

# Check if dependencies are installed
echo ""
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "✅ Dependencies installed"
fi

# Build the application
echo ""
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful"

# Check if port 4000 is available
echo ""
echo "🔌 Checking port 4000..."
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 4000 is already in use. Please stop the existing process or use a different port."
    echo "Processes using port 4000:"
    lsof -Pi :4000 -sTCP:LISTEN
    echo ""
    echo "To kill the process: kill -9 \$(lsof -ti:4000)"
    exit 1
else
    echo "✅ Port 4000 is available"
fi

echo ""
echo "🎯 Starting application with debug logging..."
echo "Press Ctrl+C to stop the application"
echo ""
echo "After the application starts, you can test JWT in another terminal:"
echo "  node debug-jwt.js"
echo ""

# Start the application with debug logging
NODE_ENV=development LOG_LEVEL=debug npm run start:dev
