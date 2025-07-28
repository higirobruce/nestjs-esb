#!/bin/bash

echo "🚀 Starting authentication test..."
echo "Make sure the NestJS ESB server is running on http://localhost:4000"
echo ""

# Check if axios is available, if not install it temporarily
if ! npm list axios &> /dev/null; then
    echo "📦 Installing axios for testing..."
    npm install axios --no-save
fi

echo "⚡ Running authentication tests..."
node test-auth.js
