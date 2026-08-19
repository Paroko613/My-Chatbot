/* ==========================================================================
   UNIVERSAL CHATBOT BACKEND FRAMEWORK – server.js (AI-PRIORITY VERSION)
   ========================================================================== */

require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");

// --- CORE MODULE IMPORTS ---
const { getBotResponse } = require("./knowledgebase");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------------------------------------------------
   1. SECURITY & MIDDLEWARE SETUP
   --------------------------------------------------------- */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Rate limiting to prevent API abuse
const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { reply: "Too many requests. Please slow down." }
});

/* ---------------------------------------------------------
   2. SYSTEM HELPERS
   --------------------------------------------------------- */
// NOTE: responseCache removed to prevent stale/dry answers. 
// Every request now goes fresh to the AI for expansion.

function sanitizeInput(msg) {
    if (!msg || typeof msg !== "string") return null;
    const clean = msg.trim();
    return (clean.length > 0 && clean.length <= 500) ? clean : null;
}

function detectLanguage(text) {
    // Simple logic to check for common Swahili greetings/keywords
    const swahiliKeywords = ["mambo", "habari", "vipi", "ni", "na", "hujambo"];
    const lowerText = text.toLowerCase();
    return swahiliKeywords.some(word => lowerText.includes(word)) ? "sw" : "en";
}

/* ---------------------------------------------------------
   3. CORE CHAT PIPELINE
   --------------------------------------------------------- */
app.post("/chat", chatLimiter, async (req, res) => {
    try {
        // STEP 1: VALIDATION
        const userMessage = sanitizeInput(req.body.message);
        if (!userMessage) {
            return res.status(400).json({ reply: "Please provide a valid message." });
        }

        // STEP 2: LANGUAGE DETECTION
        const lang = detectLanguage(userMessage);

        // STEP 3: MAIN INTELLIGENCE LAYER (KB + AI)
        // We now skip the cache and go directly to your expanded logic
        console.log(`--- Processing Fresh AI Response for: [${lang}] ${userMessage} ---`);
        const botReply = await getBotResponse(userMessage, lang);

        // STEP 4: FAILSAFE
        const finalReply = botReply && botReply.trim() !== ""
            ? botReply
            : (lang === "sw"
                ? "Samahani, sina taarifa kamili kuhusu hilo kwa sasa. Tafadhali wasiliana nasi."
                : "I may not have full details on that. Please contact UTEL for accurate information.");

        // STEP 5: RESPONSE
        res.json({ reply: finalReply });

    } catch (error) {
        console.error("PIPELINE ERROR:", error.message);
        res.status(500).json({
            reply: "Oops! Something went wrong on our end.",
            error: process.env.NODE_ENV === "production" ? null : error.message
        });
    }
});

/* ---------------------------------------------------------
   4. SERVER STARTUP
   --------------------------------------------------------- */
app.listen(PORT, () => {
    console.log(`
    ===============================================
    UTEL BPO CHATBOT SERVER RUNNING
    Port: ${PORT}
    Mode: LIVE AI EXPANSION (No Cache)
    ===============================================
    `);
});