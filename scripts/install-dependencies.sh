#!/bin/bash

# Cluely Copilot - Dependency Installation Script
echo "🚀 Installing Cluely Copilot dependencies..."

# Detect operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📱 Detected macOS"
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "🍺 Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # Install audio recording dependencies
    echo "🎤 Installing audio recording dependencies..."
    brew install sox
    
    # Install Tesseract for OCR
    echo "👁️ Installing OCR dependencies..."
    brew install tesseract
    
    echo "✅ macOS dependencies installed successfully!"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Detected Linux"
    
    # Detect package manager
    if command -v apt-get &> /dev/null; then
        echo "📦 Using apt package manager..."
        sudo apt-get update
        sudo apt-get install -y sox tesseract-ocr
    elif command -v yum &> /dev/null; then
        echo "📦 Using yum package manager..."
        sudo yum install -y sox tesseract
    elif command -v pacman &> /dev/null; then
        echo "📦 Using pacman package manager..."
        sudo pacman -S sox tesseract
    else
        echo "❌ Unsupported package manager. Please install sox and tesseract manually."
        exit 1
    fi
    
    echo "✅ Linux dependencies installed successfully!"
    
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo "🪟 Detected Windows"
    echo "ℹ️  Windows dependencies will be handled by the application automatically."
    echo "✅ Windows setup complete!"
    
else
    echo "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' or 'bun install' to install Node.js dependencies"
echo "2. Run 'npm run app:dev' to start the development server"
echo "3. Enter your OpenAI API key when prompted"
echo "4. Use ⌘+Shift+K to activate the copilot"
echo ""
echo "For more information, see the README.md file." 