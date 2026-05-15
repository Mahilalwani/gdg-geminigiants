// ================================================================
// ThirdEye DRS — script.js
// Pure fetch()-based REST API. No SDK, no imports, no modules.
// ================================================================

// ---------------- API CONFIG ----------------
// 🔑 Paste your API key from https://aistudio.google.com/apikey
const GEMINI_API_KEY = "AIzaSyBe52Gm6rpzmLgT4oIktZbL6K-mKOALmYU";

// Model fallback list — tried in order until one works
// gemini-2.5-flash is the newest free-tier model as of 2025
const MODEL_CANDIDATES = [
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite"
];

// ---------------- DOM ELEMENTS ----------------
const sections = {
    home:    document.getElementById("home-section"),
    preview: document.getElementById("preview-section"),
    loading: document.getElementById("loading-section"),
    results: document.getElementById("results-section")
};

const fileInput           = document.getElementById("file-input");
const dropZone            = document.getElementById("drop-zone");
const imagePreview        = document.getElementById("image-preview");
const videoPreview        = document.getElementById("video-preview");
const loadingMediaContainer = document.getElementById("loading-media-container");
const analyzeBtn          = document.getElementById("analyze-btn");
const cancelBtn           = document.getElementById("cancel-btn");
const resetBtn            = document.getElementById("reset-btn");
const loadingStep         = document.getElementById("loading-step");

let selectedFile = null;

// ---------------- INIT ----------------
function init() {
    console.log("ThirdEye DRS loaded ✓");
    setupEventListeners();
    startLiveScoreSimulation();
}

/**
 * Fetches real-time scores from ESPNCricinfo RSS via a more reliable CORS proxy
 */
async function startLiveScoreSimulation() {
    const ticker = document.getElementById("score-ticker");
    const rssUrl = "https://www.espncricinfo.com/rss/livescores.xml";
    // Using corsproxy.io which is often faster and has fewer rate limits
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`;

    async function updateScore() {
        try {
            console.log("Fetching live scores...");
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            
            const xmlText = await response.text();
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            
            // Check for parsing errors
            const parseError = xmlDoc.getElementsByTagName("parsererror");
            if (parseError.length > 0) {
                throw new Error("XML Parsing Error");
            }

            const items = xmlDoc.getElementsByTagName("item");
            console.log(`Found ${items.length} matches in feed.`);
            
            let iplMatch = null;
            const iplTeams = ["Kings", "Capitals", "Indians", "Giants", "Titans", "Super", "Royals", "Sunrisers", "Challengers", "Kolkata", "Lucknow", "Chennai", "Mumbai", "Delhi", "Punjab", "Gujarat", "Rajasthan", "Hyderabad", "Bangalore"];

            for (let i = 0; i < items.length; i++) {
                const title = items[i].getElementsByTagName("title")[0].textContent;
                if (iplTeams.some(team => title.includes(team))) {
                    iplMatch = title;
                    break;
                }
            }

            if (iplMatch) {
                const parts = iplMatch.split(" v ");
                const team1 = parts[0] || "Match";
                const team2 = parts[1] || "Live";

                ticker.innerHTML = `
                    <span class="match-pair">${team1} vs ${team2.split(' ')[0]}</span>
                    <span class="score-value">${team2.substring(team2.indexOf(' ') + 1) || "Live"}</span>
                    <span class="match-info">Live via ESPN</span>
                `;
            } else if (items.length > 0) {
                ticker.innerHTML = `
                    <span class="match-pair">Live Match</span>
                    <span class="score-value">${items[0].getElementsByTagName("title")[0].textContent}</span>
                    <span class="match-info">Live Updates</span>
                `;
            } else {
                ticker.innerHTML = `<span class="match-info">No live matches currently</span>`;
            }
        } catch (error) {
            console.error("Score fetch failed:", error);
            // Don't overwrite if we already have a score showing, unless it's the first try
            if (ticker.innerHTML.includes("CSK vs RCB") || ticker.innerText.includes("unavailable")) {
                ticker.innerHTML = `<span class="match-info" style="color: #ff3333">Score sync error. Retrying...</span>`;
            }
        }
    }

    updateScore();
    setInterval(updateScore, 45000); // 45 seconds to stay safe with proxy limits
}

function setupEventListeners() {
    // Upload zone click
    dropZone.addEventListener("click", () => fileInput.click());

    // File picked from dialog
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length) handleFiles(e.target.files[0]);
    });

    // Drag & Drop visual feedback
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "var(--neon-blue)";
    });
    dropZone.addEventListener("dragleave", () => {
        dropZone.style.borderColor = "rgba(0, 242, 255, 0.3)";
    });
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "rgba(0, 242, 255, 0.3)";
        const files = e.dataTransfer.files;
        if (files.length) handleFiles(files[0]);
    });

    // Buttons
    analyzeBtn.addEventListener("click", startAnalysis);
    cancelBtn.addEventListener("click",  resetToHome);
    resetBtn.addEventListener("click",   resetToHome);
}

// ---------------- FILE HANDLING ----------------
function handleFiles(file) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        alert("Please upload an image (JPG, PNG) or video (MP4, MOV) file.");
        return;
    }

    selectedFile = file;

    if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.hidden = false;
            videoPreview.hidden = true;
            switchSection("preview");
        };
        reader.readAsDataURL(file);
    } else {
        const url = URL.createObjectURL(file);
        videoPreview.src = url;
        videoPreview.hidden = false;
        imagePreview.hidden = true;
        switchSection("preview");
    }
}

// ---------------- UI NAVIGATION ----------------
function switchSection(id) {
    Object.values(sections).forEach((s) => s.classList.remove("active"));
    sections[id].classList.add("active");
}

function resetToHome() {
    selectedFile = null;
    fileInput.value = "";
    imagePreview.src = "";
    videoPreview.src = "";
    switchSection("home");
}

// ---------------- ANALYSIS FLOW ----------------
async function startAnalysis() {
    if (!selectedFile) return;

    // Clone media into the scanner box
    loadingMediaContainer.innerHTML = "";
    const clone = imagePreview.hidden === false
        ? imagePreview.cloneNode(true)
        : videoPreview.cloneNode(true);
    clone.style.width  = "100%";
    clone.style.height = "100%";
    clone.style.objectFit = "cover";
    if (clone.tagName === "VIDEO") {
        clone.muted   = true;
        clone.autoplay = true;
        clone.loop    = true;
    }
    loadingMediaContainer.appendChild(clone);
    switchSection("loading");

    // Broadcast step ticker
    const steps = [
        "Checking for edge...",
        "Analyzing ball trajectory...",
        "Verifying catch height...",
        "Consulting Hawk-Eye...",
        "Finalizing decision..."
    ];
    let stepIdx = 0;
    const ticker = setInterval(() => {
        if (stepIdx < steps.length) loadingStep.textContent = steps[stepIdx++];
    }, 1200);

    try {
        const result = await callGeminiWithFallback();
        clearInterval(ticker);
        setTimeout(() => displayResults(result), 900);
    } catch (err) {
        clearInterval(ticker);
        console.error("Analysis failed:", err);
        let msg = "Analysis failed: " + err.message;
        if (err.message.includes("429")) msg = "⚠️ Quota Exceeded. Please wait 60 seconds and try again.";
        alert(msg);
        switchSection("preview");
    }
}

// ---------------- GEMINI REST API ----------------

// Convert File → base64 string
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror   = reject;
        reader.readAsDataURL(file);
    });
}

// Call one specific model via REST
async function callGeminiModel(modelName, base64Data, mimeType) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `Analyze the provided cricket image or video frame and determine:
1. Is the batter OUT or NOT OUT?
2. Is the delivery WIDE or FAIR DELIVERY?
3. If a catch is involved, is it a VALID CATCH or NOT A CLEAN CATCH?

Return ONLY valid JSON with no extra text, no markdown fences:
{
  "outDecision": "OUT",
  "wideDecision": "FAIR DELIVERY",
  "catchDecision": "VALID CATCH",
  "confidence": 94,
  "reason": "Brief explanation here."
}`;

    const body = {
        contents: [{
            parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64Data } }
            ]
        }]
    };

    const res  = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body)
    });
    const data = await res.json();

    if (!res.ok) {
        const e = new Error(data.error?.message || `HTTP ${res.status}`);
        e.status = res.status;
        throw e;
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log(`Gemini [${modelName}] raw:`, raw);
    const cleaned = raw.replace(/```json/gi, "").replace(/```/gi, "").trim();
    return JSON.parse(cleaned);
}

// Try each model; on 404 skip, on 429 wait 10s and retry once
async function callGeminiWithFallback() {
    const base64Data = await fileToBase64(selectedFile);
    const mimeType   = selectedFile.type;

    for (const model of MODEL_CANDIDATES) {
        try {
            return await callGeminiModel(model, base64Data, mimeType);
        } catch (err) {
            // 404 = model doesn't exist, try next
            if (err.status === 404) {
                console.warn(`${model} → 404, trying next...`);
                continue;
            }
            
            // High demand detection (503 or specific message)
            if (err.status === 503 || (err.message && err.message.includes("high demand"))) {
                console.warn(`${model} → High demand, trying next...`);
                continue;
            }

            // 429 = rate limited, wait and retry ONCE
            if (err.status === 429) {
                console.warn(`${model} → 429, waiting 10s...`);
                loadingStep.textContent = "Rate limited — retrying in 10s...";
                await new Promise(r => setTimeout(r, 10000));
                try {
                    return await callGeminiModel(model, base64Data, mimeType);
                } catch (_) {
                    console.warn(`${model} retry failed, trying next...`);
                    continue;
                }
            }
            throw err; // any other error — propagate
        }
    }
    throw new Error("API Limit Reached: All models are currently busy or out of quota. Please try again in a few minutes.");
}

// ---------------- RESULTS ----------------
function displayResults(data) {
    const banner   = document.getElementById("verdict-banner");
    const decision = document.getElementById("final-decision");

    decision.textContent = data.outDecision;

    // Color the banner: "out" → red, "not-out" → green
    const cls = data.outDecision.toLowerCase().replace(/\s+/g, "-");
    banner.className = `verdict-banner glass ${cls}`;

    document.getElementById("confidence-value").textContent = `${data.confidence}%`;
    document.getElementById("conf-fill").style.width        = `${data.confidence}%`;
    document.getElementById("wide-decision").textContent    = data.wideDecision;
    document.getElementById("catch-decision").textContent   = data.catchDecision;
    document.getElementById("ai-reason").textContent        = data.reason;

    switchSection("results");
    speakVerdict(data.outDecision);
}

// ---------------- VOICE ----------------
function speakVerdict(verdict) {
    if (!("speechSynthesis" in window)) return;
    const msg = new SpeechSynthesisUtterance(`The Third Umpire decision is ${verdict}`);
    msg.rate = 0.85;
    window.speechSynthesis.speak(msg);
}

// ---------------- START ----------------
init();