<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# tradology

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# tradology

## Building Android APK

This project includes GitHub Actions workflow to automatically build Android APKs from the web application using Capacitor.

### Automatic Builds

The GitHub workflow (`.github/workflows/build-android.yml`) automatically builds APKs on:
- Push to `main` or `develop` branches
- Pull requests to `main` branch
- Manual workflow dispatch

### Manual Build Commands

To build APKs locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build debug APK:**
   ```bash
   npm run android:build
   ```

3. **Build release APK:**
   ```bash
   npm run android:release
   ```

### Prerequisites for Local Builds

- Node.js 20+
- Java 17+
- Android SDK
- Android Studio (recommended)

### Generated APKs

- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### GitHub Actions Artifacts

After each successful workflow run, you can download the APK files from the Actions tab in your GitHub repository.
