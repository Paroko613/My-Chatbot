/* =========================
   GLOBAL STATE
========================= */
let typingInterval = null;
let isBotTyping = false;

/* =========================
   CHATBOT UI TEMPLATE
   (This is the HTML that will be "born" when the user clicks launch)
========================= */
const chatbotHTML = `
<div class="chatbot-container">
    <header class="chatbot-header">
        <h1>Utel Assistant</h1>
        <div>
            <button id="refreshBot"><i class="fa-solid fa-rotate"></i></button>
            <button id="closeBot"><i class="fa-solid fa-xmark"></i></button>
        </div>
    </header>

    <main class="chatbot-body" id="chatBody">
        <div class="welcome-panel" id="welcomePanel">
            <img src="images/utel icon.jpeg" alt="utel icon" class="welcome-logo" />
            <h3>Utel Assistant</h3>
            <p>Welcome Utel Global. How can we help you today?</p>
        </div>
    </main>

    <footer class="chatbot-footer">
        <textarea 
            id="userInput" 
            rows="1" 
            placeholder="Ask about Utel Global..."
        ></textarea>
        <button id="sendBtn">
            <i class="fa-solid fa-paper-plane"></i>
        </button>
    </footer>

    <div class="chatbot-ownership">
        Utel Global Limited
    </div>
</div>
`;

/* =========================
   LAUNCHER LOGIC
========================= */
const launcher = document.getElementById("chatbot-launcher");
const root = document.getElementById("chatbot-root");

if (launcher) {
    launcher.onclick = () => {
        // 1. Inject the HTML into the root div
        if (root) {
            root.innerHTML = chatbotHTML;
            root.classList.remove("hidden");
        }
        
        // 2. Hide the launcher icon
        launcher.style.display = "none";
        
        // 3. Setup listeners for the NEWLY created buttons/input
        setupEventListeners();
        
        // 4. Load any saved chat history
        loadChatFromStorage();
    };
}

function setupEventListeners() {
    const sendBtn = document.getElementById("sendBtn");
    const userInput = document.getElementById("userInput");
    const closeBtn = document.getElementById("closeBot");
    const refreshBtn = document.getElementById("refreshBot");

    if (sendBtn) sendBtn.onclick = sendMessage;

    if (userInput) {
        userInput.onkeydown = (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };
        // Auto-grow textarea
        userInput.oninput = function() {
            this.style.height = "42px";
            this.style.height = this.scrollHeight + "px";
        };
        userInput.focus();
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            if (root) {
                root.classList.add("hidden");
                root.innerHTML = ""; // Clear the HTML to save memory
            }
            launcher.style.display = "flex";
        };
    }

    if (refreshBtn) refreshBtn.onclick = refreshBot;
}

/* =========================
   CORE CHAT FUNCTIONS
========================= */
function sendMessage() {
    if (isBotTyping) return;

    const input = document.getElementById("userInput");
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;

    addUserMessage(message);
    input.value = "";
    input.style.height = "42px";

    showTypingIndicator();

    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
    })
    .then(res => res.json())
    .then(data => {
        removeTypingIndicator();
        addBotMessage(data.reply);
    })
    .catch(err => {
        removeTypingIndicator();
        addErrorMessage("Connection error. Try again.");
    });
}

/* =========================
   UI HELPERS
========================= */
function addUserMessage(text) {
    const chatBody = document.getElementById("chatBody");
    if (!chatBody) return;
    const div = document.createElement("div");
    div.className = "user-message";
    div.textContent = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    saveMessageToHistory("user", text);
}

function addBotMessage(text) {
    const chatBody = document.getElementById("chatBody");
    if (!chatBody) return;
    const div = document.createElement("div");
    div.className = "bot-message";
    div.textContent = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    saveMessageToHistory("bot", text);
}

function addErrorMessage(text) {
    const chatBody = document.getElementById("chatBody");
    if (!chatBody) return;
    const div = document.createElement("div");
    div.className = "bot-message error-message";
    div.textContent = text;
    chatBody.appendChild(div);
}

function showTypingIndicator() {
    isBotTyping = true;
    const chatBody = document.getElementById("chatBody");
    const typingDiv = document.createElement("div");
    typingDiv.className = "typing-indicator";
    typingDiv.id = "typingIndicator";
    typingDiv.innerHTML = `Utel Assistant is typing<span class="typing-dots"></span>`;
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTypingIndicator() {
    isBotTyping = false;
    const indicator = document.getElementById("typingIndicator");
    if (indicator) indicator.remove();
}

/* =========================
   STORAGE
========================= */
function saveMessageToHistory(sender, text) {
    const history = JSON.parse(localStorage.getItem("utel_chat_history")) || [];
    history.push({ sender, text });
    localStorage.setItem("utel_chat_history", JSON.stringify(history));
}

function loadChatFromStorage() {
    const history = JSON.parse(localStorage.getItem("utel_chat_history")) || [];
    const chatBody = document.getElementById("chatBody");
    if (!chatBody) return;

    history.forEach(msg => {
        const div = document.createElement("div");
        div.className = msg.sender === "user" ? "user-message" : "bot-message";
        div.textContent = msg.text;
        chatBody.appendChild(div);
    });
    chatBody.scrollTop = chatBody.scrollHeight;
}

function refreshBot() {
    localStorage.removeItem("utel_chat_history");
    location.reload();
}