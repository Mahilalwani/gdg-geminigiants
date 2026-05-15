# 👁️ ThirdEye DRS - AI Cricket Decision Review System

ThirdEye DRS is a high-fidelity, hackathon-ready web application that mimics a professional cricket broadcast's Decision Review System (DRS). Powered by **Google Gemini AI**, it analyzes match footage or images to provide instant verdicts on OUT/NOT OUT, WIDE/FAIR, and CATCH validity.

![ThirdEye DRS](stadium_background.png)

## 🚀 Features

- **Multimodal AI Analysis**: Uses Gemini 2.0 Flash to analyze both images and video clips.
- **Dramatic Broadcast UI**: A "Third Umpire Reviewing" screen with scanning animations and progress bars.
- **Instant Verdicts**: Clear OUT/NOT OUT displays with confidence scores and detailed AI reasoning.
- **Voice Commentary**: Automated verbal announcement of the final decision using the Web Speech API.
- **Responsive Design**: Optimized for both desktop and mobile viewing.
- **Glassmorphism Theme**: Modern stadium-inspired design with neon blue and gold accents.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **AI Engine**: Google Gemini API (`gemini-2.0-flash`)
- **Icons**: Material Symbols
- **Typography**: Outfit (Google Fonts)

## 🏁 Getting Started

### 1. Prerequisites
- A modern web browser (Chrome, Edge, or Safari).
- A Google AI Studio API Key. Get one for free at [aistudio.google.com](https://aistudio.google.com/).

### 2. Setup
1. Clone or download this project.
2. Open `script.js` in a text editor.
3. Find the line: `const GEMINI_API_KEY = "YOUR_API_KEY_HERE";`
4. Replace `YOUR_API_KEY_HERE` with your actual Gemini API key.
5. Save the file.

### 3. Run Locally
Simply open `index.html` in your browser. For the best experience, use a local server like Live Server (VS Code extension) or run:
```bash
npx serve .
```

## 📋 How to Use
1. **Upload**: Drag and drop a cricket image or video clip (e.g., a caught-behind appeal or a close LBW).
2. **Analyze**: Click the **ANALYZE DECISION** button.
3. **Review**: Watch the dramatic "Third Umpire Reviewing" sequence as the AI scans the media.
4. **Verdict**: View the final decision, confidence levels, and the AI's step-by-step reasoning.
5. **Listen**: The app will automatically announce the verdict through your speakers!

## 🚀 Deployment

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize: `firebase init` (Select Hosting)
3. Deploy: `firebase deploy`

### GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings > Pages**.
3. Select the branch and folder (root) and click **Save**.

---

*Built for the Google Gemini Hackathon. All rights reserved.*
