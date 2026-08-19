/* =========================================
   UTEL HYBRID INTELLIGENCE ENGINE
   ========================================= */

require("dotenv").config();

// DeepSeek API Configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

const USE_AI = true;

// --- KNOWLEDGE BASE DATA ---
const knowledgeBase = [
    {
        tag: "greeting",
        keywords: ["hello", "hi", "hey", "mambo", "habari"],
        content: "UTEL Assistant greeting: Welcome the user warmly and ask how you can help with telecom, BPO, or ICT."
    },
    {
        tag: "company",
        keywords: ["company", "about", "who are you", "utel"],
        content: "UTEL is a technology-driven company based in Tanzania providing telecom infrastructure and ICT solutions."
    },
    {
        tag: "services_overview",
        keywords: ["services", "what do you offer", "solutions", "provide"],
        content: "Telecom infrastructure, call center operations, ICT support, HR outsourcing, and managed enterprise solutions."
    },
    {
        tag: "call_center",
        keywords: ["call center", "customer support", "helpdesk", "support"],
        content: "Inbound/outbound support, customer experience management, multi-channel (calls, email, chat), and CRM integration."
    },
    {
        tag: "hr",
        keywords: ["hr", "recruitment", "jobs", "hiring", "staff"],
        content: "HR outsourcing: recruitment, staffing, workforce management, training, and employee development."
    },
    {
        tag: "technical",
        keywords: ["technical", "ict", "it", "network", "telecom", "internet"],
        content: "Network management, system monitoring, enterprise IT solutions, and telecom infrastructure."
    },
    {
        tag: "location",
        keywords: ["location", "where", "address"],
        content: "Headquarters: Dar es Salaam, Tanzania. Serving the entire region."
    }
];

/* =========================================
   KEYWORD MATCHER
   ========================================= */
function findMatch(userMessage) {
    const message = userMessage.toLowerCase();
    for (const entry of knowledgeBase) {
        for (const keyword of entry.keywords) {
            if (message.includes(keyword)) return entry.content;
        }
    }
    return null;
}

/* =========================================
   AI EXPANSION LAYER (DEEPSEEK)
   ======================================== */
async function expandWithAI(baseContent, userMessage, lang = "en") {
    if (!USE_AI) return baseContent;

    const systemPrompt = `
        You are the UTEL Global AI Ambassador, a sophisticated and helpful AI assistant.
        
        GOAL:
        - Take the provided CONTEXT and rewrite it into a high-quality, expanded response.
        - Your tone should be modern, professional, and warm (like ChatGPT or Gemini).
        
        FORMATTING RULES:
        - Use **bolding** for important terms.
        - Use bullet points (•) or numbered lists for services and features.
        - 🚀 Include relevant professional emojis (✅, 📞, 🌐, ✨) to make the text engaging.
        - Break long text into short, readable paragraphs.
        
        KNOWLEDGE APPLICATION:
        - FACTUAL SOURCE: "${baseContent}"
        - Do NOT just repeat the source. Elaborate on it. Explain *why* it matters to the user.
        - If the context is a greeting, be exceptionally welcoming.
        
        LANGUAGE:
        - Respond strictly in ${lang === "sw" ? "Swahili" : "English"}.
        
        CLOSING:
        - End every response with a polite "Call to Action" (e.g., "Would you like more details on our ICT solutions?").
    `;

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: DEEPSEEK_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { 
                        role: "user", 
                        content: `CONTEXT: ${baseContent}\n\nUSER QUESTION: ${userMessage}` 
                    }
                ],
                temperature: 0.8,
                max_tokens: 600
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("DeepSeek API Error:", errorData);
            return `⚠️ API Error: ${errorData.error?.message || "Unknown error"}`;
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error("AI ERROR:", error.message);
        return "I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or contact UTEL directly for immediate assistance.";
    }
}

/* =========================================
   MAIN EXPORT FUNCTION (AI-PRIORITY UPGRADE)
   ========================================= */
async function getBotResponse(userMessage, lang = "en") {
    // 1. Get the raw text from your Knowledge Base
    const match = findMatch(userMessage);
    
    // 2. Extract the content string (English or Swahili)
    let rawKBContent = "";
    if (match) {
        rawKBContent = match;
    } else {
        rawKBContent = "General information about UTEL BPO, ICT, and Telecom infrastructure in Tanzania.";
    }

    // 3. THE SECRET SAUCE: 
    // We wrap the KB content in a "Directive" that forces the AI to expand it.
    const instructionForAI = `
        SOURCE DATA: "${rawKBContent}"
        USER QUESTION: "${userMessage}"
        
        GOAL: act as a senior UTEL consultant. 
        Take the SOURCE DATA and expand it into a detailed, helpful, and 
        structured response. Use bolding, bullet points, and emojis (🚀, ✅). 
        Make it sound exactly like ChatGPT or Gemini.
    `;

    // 4. Return the expanded version
    return await expandWithAI(rawKBContent, userMessage, lang);
}

module.exports = { getBotResponse };