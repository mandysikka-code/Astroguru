/**
 * ═══════════════════════════════════════════════════════════
 * ASTROBITE – AGENT WEBAPP JAVASCRIPT
 * ═══════════════════════════════════════════════════════════
 *
 * HOW THIS FILE WORKS (A beginner-friendly explanation):
 * ──────────────────────────────────────────────────────────
 * This file is the "brain" of the Astrobite webapp. It does 3 main things:
 *
 * 1. LANDING PAGE (index.html):
 *    - Animates the starfield in the hero section
 *    - Handles navbar scroll behaviour
 *    - Opens/closes the mobile hamburger menu
 *
 * 2. BIRTH PROFILE (chat.html – left sidebar):
 *    - Reads the form inputs (name, DOB, time, place, gender, focus)
 *    - Saves them to the browser's localStorage so they persist
 *    - Builds a rich "system prompt" that tells Claude WHO the user is
 *
 * 3. CLAUDE AI CHAT (chat.html – main area):
 *    - Sends messages to the AI API
 *    - Receives responses and renders them in the chat UI
 *    - Keeps a conversation history so the AI remembers context
 *    - Handles the API key modal (stored locally, never sent to any server)
 * ═══════════════════════════════════════════════════════════
 */

/* ────────────────────────────────────────────────────────
   SECTION 1 – LANDING PAGE LOGIC (runs on index.html)
──────────────────────────────────────────────────────── */

// Only run this block when we are on the landing page (index.html)
if (document.getElementById('stars')) {

  // 1a. Generate animated star particles in the hero background
  const starsContainer = document.getElementById('stars');
  const STAR_COUNT = 120;

  for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement('div');
    star.classList.add('star');

    // Random size between 1px and 3px
    const size = Math.random() * 2 + 1;
    star.style.cssText = `
      width:  ${size}px;
      height: ${size}px;
      top:    ${Math.random() * 100}%;
      left:   ${Math.random() * 100}%;
      --dur:  ${Math.random() * 4 + 2}s;
      --op:   ${Math.random() * 0.6 + 0.2};
      animation-delay: ${Math.random() * 4}s;
    `;
    starsContainer.appendChild(star);
  }

  // 1b. Navbar changes background when user scrolls down
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  // 1c. Hamburger menu toggle for mobile screens
  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });

    // Close menu when any link inside it is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }
}


/* ────────────────────────────────────────────────────────
   SECTION 2 – CHAT PAGE LOGIC (runs on chat.html)
──────────────────────────────────────────────────────── */

// Only run this block on the chat page
if (document.getElementById('chatMessages')) {

  /* ── 2a. DOM References ── */
  const chatMessages    = document.getElementById('chatMessages');
  const welcomeScreen   = document.getElementById('welcomeScreen');
  const chatInput       = document.getElementById('chatInput');
  const sendBtn         = document.getElementById('sendBtn');
  const typingIndicator = document.getElementById('typingIndicator');

  // Sidebar form elements
  const birthForm       = document.getElementById('birthForm');
  const saveProfileBtn  = document.getElementById('saveProfileBtn');
  const profileSaved    = document.getElementById('profileSaved');
  const editProfileBtn  = document.getElementById('editProfileBtn');
  const quickPrompts    = document.getElementById('quickPrompts');

  // Profile display elements
  const profileAvatar   = document.getElementById('profileAvatar');
  const profileName     = document.getElementById('profileName');
  const profileDob      = document.getElementById('profileDob');
  const profilePob      = document.getElementById('profilePob');

  // API key modal
  const apiKeyModal     = document.getElementById('apiKeyModal');
  const apiKeyInput     = document.getElementById('apiKeyInput');
  const saveApiKeyBtn   = document.getElementById('saveApiKeyBtn');
  const toggleApiKey    = document.getElementById('toggleApiKey');

  /* ── 2b. State Variables ── */
  let userProfile   = null;   // Stores the birth profile object
  let conversationHistory = []; // Full message history sent to the AI
  let openaiApiKey  = '';     // API key (never leaves the browser)

  /* ── 2c. Initialise on Page Load ── */
  function init() {
    // Load saved API key from localStorage
    openaiApiKey = localStorage.getItem('astrobite_api_key') || '';

    // Load saved profile from localStorage
    const savedProfile = localStorage.getItem('astrobite_profile');
    if (savedProfile) {
      userProfile = JSON.parse(savedProfile);
      showSavedProfile(userProfile);
    }

    // Show the API key modal if no key is saved yet
    if (!openaiApiKey) {
      openApiKeyModal();
    }
  }

  /* ────────────────────────────────────────────────────────
     SECTION 3 – API KEY MANAGEMENT
  ──────────────────────────────────────────────────────── */

  /**
   * openApiKeyModal()
   * Shows the API key entry modal so the user can paste their key.
   * The key is stored only in localStorage – it is NEVER sent to any server
   * other than directly to the AI provider from the user's own browser.
   */
  function openApiKeyModal() {
    apiKeyModal.classList.add('open');
    setTimeout(() => apiKeyInput.focus(), 300);
  }

  // Toggle password visibility in the API key input
  if (toggleApiKey) {
    toggleApiKey.addEventListener('click', () => {
      const isHidden = apiKeyInput.type === 'password';
      apiKeyInput.type = isHidden ? 'text' : 'password';
      toggleApiKey.innerHTML = isHidden
        ? '<i class="fas fa-eye-slash"></i>'
        : '<i class="fas fa-eye"></i>';
    });
  }

  // Save the API key when the user clicks "Save & Continue"
  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', () => {
      const key = apiKeyInput.value.trim();

      if (!key || !key.startsWith('sk-')) {
        showModalError('Please enter a valid API key (starts with sk-)');
        return;
      }

      openaiApiKey = key;
      localStorage.setItem('astrobite_api_key', key);
      apiKeyModal.classList.remove('open');
    });

    // Allow Enter key to save
    apiKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveApiKeyBtn.click();
    });
  }

  /** Show an inline error inside the modal */
  function showModalError(message) {
    let errEl = apiKeyModal.querySelector('.modal-error');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.classList.add('modal-error');
      errEl.style.cssText = 'color:#fca5a5; font-size:0.82rem; text-align:center; margin-top:-8px;';
      saveApiKeyBtn.parentNode.insertBefore(errEl, saveApiKeyBtn);
    }
    errEl.textContent = message;
  }

  /* ────────────────────────────────────────────────────────
     SECTION 4 – BIRTH PROFILE FORM
  ──────────────────────────────────────────────────────── */

  /**
   * When the user submits the birth form, we:
   * 1. Collect all form values
   * 2. Build a "profile" object
   * 3. Save it to localStorage
   * 4. Display the saved profile card
   * 5. Enable the chat input
   * 6. Send an automatic "first reading" message to the AI
   */
  if (birthForm) {
    birthForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name       = document.getElementById('name').value.trim();
      const dob        = document.getElementById('dob').value;
      const tob        = document.getElementById('tob').value;
      const pob        = document.getElementById('pob').value.trim();
      const gender     = document.getElementById('gender').value;
      const readingType = document.getElementById('readingType').value;

      userProfile = { name, dob, tob, pob, gender, readingType };
      localStorage.setItem('astrobite_profile', JSON.stringify(userProfile));

      showSavedProfile(userProfile);
      enableChat();

      // Automatically kick off the first reading
      const greeting = buildGreetingMessage(userProfile);
      sendToAgent(greeting, true /* isSystem = hide this from chat UI */);
    });
  }

  /**
   * showSavedProfile(profile)
   * Hides the form and shows the compact profile card + quick prompts.
   */
  function showSavedProfile(profile) {
    if (birthForm)    birthForm.style.display = 'none';
    if (profileSaved) profileSaved.style.display = 'block';
    if (quickPrompts) quickPrompts.style.display = 'block';

    // Populate the profile card
    if (profileAvatar) profileAvatar.textContent = profile.name.charAt(0).toUpperCase();
    if (profileName)   profileName.textContent   = profile.name;
    if (profileDob)    profileDob.textContent     = formatDate(profile.dob) + (profile.tob ? ` at ${profile.tob}` : '');
    if (profilePob)    profilePob.textContent     = profile.pob;

    enableChat();
  }

  /** Edit profile – show form again */
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      if (birthForm)    birthForm.style.display = 'flex';
      if (profileSaved) profileSaved.style.display = 'none';
      if (quickPrompts) quickPrompts.style.display = 'none';
    });
  }

  /** Enable the chat textarea and send button */
  function enableChat() {
    chatInput.disabled = false;
    sendBtn.disabled   = false;
    chatInput.placeholder = 'Ask your astrologer anything…';
    if (welcomeScreen) welcomeScreen.style.display = 'none';
  }

  /** Quick prompt buttons – prefill the chat input */
  if (quickPrompts) {
    quickPrompts.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        chatInput.value = btn.dataset.prompt;
        chatInput.focus();
        autoResizeTextarea(chatInput);
      });
    });
  }

  /* ────────────────────────────────────────────────────────
     SECTION 5 – CHAT INPUT HANDLING
  ──────────────────────────────────────────────────────── */

  // Auto-resize textarea as user types
  chatInput.addEventListener('input', () => autoResizeTextarea(chatInput));

  // Send on Enter (Shift+Enter = new line)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener('click', handleSend);

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text || sendBtn.disabled) return;

    chatInput.value = '';
    autoResizeTextarea(chatInput);
    sendToAgent(text, false);
  }

  function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }

  /* ────────────────────────────────────────────────────────
     SECTION 6 – AI API INTEGRATION

     HOW IT WORKS:
     ─────────────
     We call the Chat Completions API directly from the browser.

     Endpoint: https://api.openai.com/v1/chat/completions
     Method:   POST
     Headers:
       - Authorization: Bearer sk-...  (your API key)
       - Content-Type: application/json

     Body (JSON):
       - model:    The model to use ("gpt-4o" is recommended)
       - max_tokens: Max length of the response
       - messages: Array starting with { role:"system", content:"..." }
                   followed by the full conversation history

     SYSTEM PROMPT STRATEGY:
     ───────────────────────
     The system prompt is the most important part of an AI agent.
     It tells the AI:
       1. Its persona (Astrobite, an expert astrologer)
       2. The user's birth details (name, DOB, time, place)
       3. What kind of reading to focus on
       4. How to format its responses
       5. Boundaries (entertainment only, compassionate tone, etc.)
  ──────────────────────────────────────────────────────── */

  /**
   * buildSystemPrompt(profile)
   *
   * Creates the "instructions" we send to the AI as the system message.
   * This is the key to making the AI "agent" feel personalized and expert.
   */
  function buildSystemPrompt(profile) {
    const readingLabels = {
      general:   'a general life reading',
      career:    'career and financial guidance',
      love:      'love and relationship insights',
      health:    'health and wellness analysis',
      spiritual: 'spiritual growth and higher purpose',
      forecast:  'a daily/weekly forecast',
    };

    const focus = readingLabels[profile.readingType] || 'a general life reading';

    return `You are Astrobite, an expert AI astrologer combining Vedic (Jyotish) and Western astrology traditions. You are warm, wise, insightful, and deeply knowledgeable about planetary influences, birth charts, dashas, transits, and astrological remedies.

USER'S BIRTH PROFILE:
- Full Name: ${profile.name}
- Date of Birth: ${formatDate(profile.dob)}
- Time of Birth: ${profile.tob || 'Unknown (use approximations)'}
- Place of Birth: ${profile.pob}
- Gender: ${profile.gender || 'Not specified'}
- Requested Focus: ${focus}

YOUR RESPONSIBILITIES:
1. Always personalize responses based on the birth details above.
2. Reference specific planetary placements, zodiac signs, houses, and nakshaktras relevant to ${profile.name}'s chart.
3. For Vedic readings, consider Lagna (Ascendant), Moon sign (Rashi), Sun sign, and current Mahadasha/Antardasha.
4. For Western readings, consider Sun, Moon, Rising signs, and key aspects.
5. Offer practical, actionable guidance alongside spiritual insights.
6. When relevant, suggest Vedic remedies (mantras, gemstones, colours, charity, fasting days) specific to ${profile.name}'s chart.
7. Be compassionate and empowering — never use fear-based language.
8. Format responses clearly using paragraphs. Use **bold** for planet names, sign names, and key terms. Use bullet points for lists of remedies or key points.
9. Keep responses focused and meaningful — not too short, not excessively long.

IMPORTANT DISCLAIMER: Always end responses with a brief reminder that astrology is for guidance and entertainment, not a substitute for professional advice.

Begin each session by warmly greeting ${profile.name} and providing an initial reading overview based on their birth details and chosen focus area.`;
  }

  /**
   * buildGreetingMessage(profile)
   *
   * This is the FIRST message sent to Claude when a user saves their profile.
   * It's not shown in the chat UI directly — Claude's response IS shown.
   * Claude will reply with a personalized welcome + initial reading.
   */
  function buildGreetingMessage(profile) {
    return `Please greet me and give me an initial ${profile.readingType || 'general'} reading based on my birth chart. My name is ${profile.name}, I was born on ${formatDate(profile.dob)}${profile.tob ? ' at ' + profile.tob : ''} in ${profile.pob}. I'm looking for ${profile.readingType || 'general'} guidance.`;
  }

  /**
   * sendToAgent(userMessage, isAutoGreeting)
   *
   * This is the CORE function that:
   * 1. Adds the user's message to the conversation history
   * 2. Shows the user's message bubble in the UI
   * 3. Shows the "typing..." indicator
   * 4. Calls the Claude API
   * 5. Displays Claude's response
   * 6. Handles errors gracefully
   *
   * @param {string}  userMessage    - The text to send to Claude
   * @param {boolean} isAutoGreeting - If true, don't show the user message in UI
   */
  async function sendToAgent(userMessage, isAutoGreeting = false) {
    if (!openaiApiKey) {
      openApiKeyModal();
      return;
    }

    // Disable input while waiting
    sendBtn.disabled   = true;
    chatInput.disabled = true;

    // Show user message in the chat UI (unless it's the silent auto-greeting)
    if (!isAutoGreeting) {
      appendMessage('user', userMessage);
    }

    // Add to conversation history (ChatGPT needs the full history for context)
    conversationHistory.push({ role: 'user', content: userMessage });

    // Show typing indicator
    showTyping(true);
    scrollToBottom();

    try {
      /**
       * OPENAI CHATGPT API CALL
       * ────────────────────────
       * Endpoint : https://api.openai.com/v1/chat/completions
       * Method   : POST
       * Auth     : Bearer token in the Authorization header
       *
       * Key differences from Claude:
       *  - The system prompt goes as the FIRST message with role "system"
       *    inside the messages array (not a separate "system" field).
       *  - Response is at: data.choices[0].message.content
       *  - Model name: "gpt-4o" (latest, best quality + speed)
       *
       * NOTE: For a production app, proxy this through your own server
       * to keep the API key safe. Direct browser calls are fine for prototypes.
       */
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model:      'gpt-4o',   // Latest GPT-4o — best balance of quality & speed
          max_tokens: 1024,        // Max length of response
          // For OpenAI, the system prompt is the FIRST element in messages[]
          messages: [
            { role: 'system', content: buildSystemPrompt(userProfile) },
            ...conversationHistory,   // Full conversation history follows
          ],
        }),
      });

      // Check for HTTP errors (e.g., 401 Unauthorized, 429 Rate Limited)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();

      /**
       * OpenAI ChatGPT response structure:
       * {
       *   choices: [{
       *     message: { role: 'assistant', content: '...' }
       *   }]
       * }
       */
      const assistantMessage = data.choices?.[0]?.message?.content
        || 'I was unable to generate a response. Please try again.';

      // Add assistant's reply to conversation history (for future context)
      conversationHistory.push({ role: 'assistant', content: assistantMessage });

      // Hide typing indicator and show the response
      showTyping(false);
      appendMessage('assistant', assistantMessage);

    } catch (error) {
      showTyping(false);

      // Show a user-friendly error message
      let errorText = 'Something went wrong. ';
      if (error.message.includes('401') || error.message.includes('Incorrect API key')) {
        errorText += 'Your OpenAI API key appears to be invalid. Please check and update it.';
        setTimeout(openApiKeyModal, 1500);
      } else if (error.message.includes('429')) {
        errorText += 'Rate limit or quota reached. Please wait a moment or check your OpenAI billing.';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorText += 'Network error. Please check your internet connection.';
      } else {
        errorText += error.message;
      }

      appendErrorMessage(errorText);
    }

    // Re-enable input
    sendBtn.disabled   = false;
    chatInput.disabled = false;
    chatInput.focus();
    scrollToBottom();
  }

  /* ────────────────────────────────────────────────────────
     SECTION 7 – CHAT UI RENDERING HELPERS
  ──────────────────────────────────────────────────────── */

  /**
   * appendMessage(role, text)
   * Creates a chat bubble and appends it to the messages area.
   * 
   * @param {'user'|'assistant'} role
   * @param {string} text - Raw text (we convert markdown-like syntax to HTML)
   */
  function appendMessage(role, text) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', role);

    // Avatar
    const avatar = document.createElement('div');
    avatar.classList.add('msg-avatar');
    avatar.textContent = role === 'user'
      ? (userProfile?.name?.charAt(0).toUpperCase() || 'U')
      : '✦';

    // Message body wrapper
    const body = document.createElement('div');
    body.classList.add('msg-body');

    // Bubble with formatted text
    const bubble = document.createElement('div');
    bubble.classList.add('msg-bubble');
    bubble.innerHTML = formatMessageText(text);

    // Timestamp
    const time = document.createElement('div');
    time.classList.add('msg-time');
    time.textContent = getCurrentTime();

    body.appendChild(bubble);
    body.appendChild(time);

    if (role === 'user') {
      messageEl.appendChild(body);
      messageEl.appendChild(avatar);
    } else {
      messageEl.appendChild(avatar);
      messageEl.appendChild(body);
    }

    chatMessages.appendChild(messageEl);
    scrollToBottom();
  }

  /**
   * formatMessageText(text)
   * Converts simple markdown-like syntax to HTML for display.
   * Handles: **bold**, *italic*, bullet lists, numbered lists, line breaks.
   */
  function formatMessageText(text) {
    return text
      // Escape HTML special chars first
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // **bold**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // *italic* or _italic_
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      // ### Headings → styled
      .replace(/^### (.+)$/gm, '<strong style="font-size:1.05rem; color:var(--gold); display:block; margin: 10px 0 4px;">$1</strong>')
      .replace(/^## (.+)$/gm,  '<strong style="font-size:1.1rem; color:var(--gold); display:block; margin: 12px 0 6px;">$1</strong>')
      // Bullet lists: lines starting with - or •
      .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
      // Numbered lists: lines starting with 1. 2. etc.
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Wrap consecutive <li> items in <ul>
      .replace(/(<li>.*<\/li>\n?)+/gs, (match) => `<ul style="padding-left:1.2em; margin:8px 0;">${match}</ul>`)
      // Double newlines → paragraph breaks
      .replace(/\n\n/g, '</p><p>')
      // Single newlines → line breaks
      .replace(/\n/g, '<br />')
      // Wrap in paragraph tags
      .replace(/^(.+)$/, '<p>$1</p>');
  }

  /** Show an error bubble in the chat */
  function appendErrorMessage(text) {
    const errorEl = document.createElement('div');
    errorEl.classList.add('message', 'assistant');
    errorEl.innerHTML = `
      <div class="msg-avatar">⚠</div>
      <div class="msg-body">
        <div class="msg-bubble error-message">${text}</div>
        <div class="msg-time">${getCurrentTime()}</div>
      </div>`;
    chatMessages.appendChild(errorEl);
    scrollToBottom();
  }

  /** Show or hide the "typing…" animation */
  function showTyping(visible) {
    typingIndicator.style.display = visible ? 'flex' : 'none';
  }

  /** Scroll the messages area to the very bottom */
  function scrollToBottom() {
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 50);
  }

  /* ────────────────────────────────────────────────────────
     SECTION 8 – UTILITY FUNCTIONS
  ──────────────────────────────────────────────────────── */

  /**
   * formatDate(dateStr)
   * Converts '1990-05-21' → 'May 21, 1990'
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
  }

  /**
   * getCurrentTime()
   * Returns current time as '3:45 PM'
   */
  function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /* ────────────────────────────────────────────────────────
     START THE APP
  ──────────────────────────────────────────────────────── */
  init();
}
