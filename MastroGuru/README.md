# ✦ Astrobite – AI Astrology Agent Webapp

A professional AI-powered astrology agent built with **HTML, CSS, and vanilla JavaScript**, integrated with **Claude AI (Anthropic)** for personalized readings.

---

## 📁 Project Structure

```
MastroGuru/
├── index.html   ← Landing page (homepage)
├── chat.html    ← AI chat interface  
├── styles.css   ← All styles (dark cosmic theme)
├── app.js       ← All JavaScript logic + Claude API
└── README.md    ← This file
```

---

## 🚀 How to Run

1. Open the `MastroGuru` folder in VS Code
2. Install the **Live Server** extension (if not already installed)
3. Right-click `index.html` → **"Open with Live Server"**
4. The site opens at `http://127.0.0.1:5500`

> **No build step needed.** This is pure HTML/CSS/JS — open and go.

---

## 🔑 Setting Up Your Claude API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/) and sign up
2. Create an API key (starts with `sk-ant-...`)
3. When you open `chat.html`, a modal will ask for your key
4. Paste it in — it is saved to your **browser's localStorage only**
5. It is never sent anywhere except directly to `api.anthropic.com`

---

## 🧠 How the AI Agent Works (Explained Simply)

### What is an "Agent"?
An AI agent is a program that:
1. Has a **persona and instructions** (the "system prompt")
2. Receives **user input** (questions)
3. Calls an **AI model** (Claude) to generate intelligent responses
4. **Remembers context** across the conversation

### The Three Key Parts:

#### 1. System Prompt (in `app.js` → `buildSystemPrompt()`)
This is the most important part. It tells Claude:
- **Who it is**: "You are Astrobite, an expert AI astrologer..."
- **Who the user is**: Name, date/time/place of birth, reading focus
- **How to behave**: Compassionate, detailed, use bold formatting, etc.
- **What to do**: Give Vedic & Western readings, suggest remedies, etc.

```javascript
// Example of how the system prompt is built:
function buildSystemPrompt(profile) {
  return `You are Astrobite, an expert AI astrologer...
  USER's Birth Profile:
  - Name: ${profile.name}
  - DOB: ${profile.dob}
  ...`
}
```

#### 2. Conversation History (in `app.js` → `conversationHistory`)
Every message (user + Claude) is stored in an array and sent with each API call. This is how Claude "remembers" the conversation.

```javascript
conversationHistory = [
  { role: 'user',      content: 'What does my chart say?' },
  { role: 'assistant', content: 'Great question! Your Sun in...' },
  { role: 'user',      content: 'Tell me about my career.' },
]
```

#### 3. API Call (in `app.js` → `sendToAgent()`)
We use `fetch()` to call Claude's API directly:

```javascript
fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': claudeApiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: buildSystemPrompt(userProfile),
    messages: conversationHistory,
  })
})
```

---

## 🎨 Design System

| Element       | Value                          |
|--------------|-------------------------------|
| Background   | `#080b14` (deep space dark)   |
| Accent Gold  | `#f5c842`                     |
| Accent Purple| `#a78bfa` / `#7c3aed`         |
| Font (headings) | Cinzel (Google Fonts)      |
| Font (body)  | Inter (Google Fonts)          |

---

## 🔧 Customisation Guide

| What to change         | Where to change it             |
|------------------------|-------------------------------|
| Business name          | All `Astrobite` in HTML files  |
| Brand colours          | `--gold`, `--purple` in `styles.css` |
| AI persona/instructions| `buildSystemPrompt()` in `app.js` |
| Claude model           | `model:` in `sendToAgent()` in `app.js` |
| Quick prompt buttons   | `.quick-btn` elements in `chat.html` |
| Features section       | Feature cards in `index.html`  |

---

## ⚠️ Important Notes

- This is a **client-side prototype** — the API key is stored in the browser
- For production, route API calls through a **backend server** to protect your key
- Always include the disclaimer: "For entertainment purposes only"
- Claude API usage is **not free** — check Anthropic's pricing at console.anthropic.com

---

## 📦 Tech Stack

- **HTML5** – Structure
- **CSS3** – Styling (CSS variables, flexbox, grid, animations)
- **Vanilla JavaScript** – No frameworks, no dependencies
- **Claude API** – Anthropic's claude-3-5-sonnet model
- **Google Fonts** – Cinzel + Inter
- **Font Awesome** – Icons (CDN)
