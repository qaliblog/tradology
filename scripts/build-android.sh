#!/bin/bash

echo "🚀 Building tradology Android APK..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build web app
echo "🌐 Building web app..."
npm run build

# Check if Capacitor is installed
if ! command -v npx cap &> /dev/null; then
    echo "📱 Installing Capacitor CLI..."
    npm install -g @capacitor/cli
fi

# Add Android platform if it doesn't exist
if [ ! -d "android" ]; then
    echo "🤖 Adding Android platform..."
    npx cap add android
fi

# Sync web code to native
echo "🔄 Syncing web code to native..."
npx cap sync android

# Update app configuration
echo "⚙️  Updating app configuration..."
cd android

# Update app name and package
sed -i 's/AI Trading Bot Analyst/tradology/g' app/src/main/res/values/strings.xml
sed -i 's/com.aitradingbot.analyst/com.tradology.app/g' app/build.gradle
sed -i 's/com.aitradingbot.analyst/com.tradology.app/g' app/src/main/AndroidManifest.xml

# Show current configuration
echo "=== Current Configuration ==="
echo "Package: $(grep 'package=' app/src/main/AndroidManifest.xml)"
echo "App Name: $(grep 'string name="app_name"' app/src/main/res/values/strings.xml)"
echo "Build.gradle package: $(grep 'applicationId' app/build.gradle)"

# Build APK
echo "🔨 Building APK..."
./gradlew clean
./gradlew assembleDebug

# Check if build was successful
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ APK built successfully!"
    echo "📱 APK location: $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
    ls -la app/build/outputs/apk/debug/
else
    echo "❌ APK build failed!"
    exit 1
fi

echo "🎉 Build complete! You can now install the APK on your Android device."