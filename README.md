# 🧠 Indelible Rise

### *Train. Play. Rise.*

> A gamified web platform that preserves human cognitive skills in the age of AI.

---

## ✨ Overview

**Indelible Rise** is an academic research project built to tackle a growing problem: **cognitive offloading** caused by over-reliance on generative AI tools like ChatGPT.

The platform offers **6 micro-games** that train core cognitive skills — creativity, logical reasoning, memory, and fast thinking — while a lightweight engine called **DetectifyAI** runs in the background to gently discourage copy-pasting and AI-generated responses.

> 🎯 **Goal:** Help you stay sharp. No AI shortcuts. Just you.

---

## 🎮 The Games

| Game | Skill | What You Do |
|------|-------|-------------|
| 🕵️ **Claim Detective** | Critical Thinking | Spot weak evidence and explain why |
| 🧩 **Logic Loom** | Logical Reasoning | Chain facts into a 3‑step argument |
| 💡 **Mash Up Studio** | Creativity | Combine two random prompts into one original idea |
| ✍️ **Tone Mixer** | Language & Expression | Rewrite a sentence in 3 different tones |
| 🧠 **Memory Market** | Memory & Recall | Read a story, then answer questions from memory |
| ⚡ **Quick Call** | Fast Thinking | Make a snap decision under 10 seconds, then explain your gut instinct |

---
## 🔍 DetectifyAI – The Humanity Triad

DetectifyAI ensures you're using your **real brain power**, not a shortcut.

It monitors three simple metrics in real time:

| Rule | Threshold | What It Detects |
|------|-----------|-----------------|
| **WPM** (Words Per Minute) | > 120 | Copy-pasting or typing way too fast |
| **Paste Ratio** | > 80% | Content pasted from clipboard |
| **TTR** (Type-Token Ratio) | < 0.4 | Repetitive, robotic language |

If any rule is triggered, you'll receive a friendly nudge:

> *"That looked a bit automated. Try again in your own words."*

No punishment. No judgment. Just a gentle reminder to keep it human.

---

## 🧪 Research Purpose

This project is part of a **BSc Computer Science** dissertation at the **University of Bedfordshire**.

We are investigating whether gamified micro‑games with real‑time AI‑cheat detection can reduce cognitive offloading and preserve critical thinking skills in Gen Z users.

### Hypotheses

- **H₀:** No significant difference in cognitive scores between Indelible Rise users and control group.
- **H₁:** Indelible Rise users show a statistically significant improvement in cognitive scores.

### Study Design

- **N = 20** participants (10 intervention, 10 control)
- Pre‑test / post‑test cognitive quiz (10‑question reasoning test)
- 14‑day intervention period

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (no frameworks) |
| Backend | Firebase Authentication + Firestore (serverless) |
| Hosting | GitHub Pages |
| Charts | Chart.js |
| Icons | Font Awesome |
| Fonts | Mystery Quest, Oooh Baby, Rancho, Rasa, Ranga, Aladin, Ravi Prakash, JetBrains Mono |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Sbasnayaka/Indelible-Rise.git
cd indelible-rise
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (name: `Indelible Rise`)
3. Register a web app and copy your `firebaseConfig`
4. Enable **Email/Password** authentication
5. Create a Firestore database (start in test mode)
6. Paste your config into `js/firebase-config.js`

### 3. Run locally

Open `index.html` in your browser, or use Live Server in VS Code.

---

## 📁 Project Structure

```
indelible-rise/
├── index.html                 # Home page
├── login.html
├── signup.html
├── get-started.html           # Consent page
├── dashboard.html
├── profile.html
├── detectifyai.html
├── about.html
├── loading.html
├── games/
│   ├── claim-detective.html
│   ├── logic-loom.html
│   ├── mashup-studio.html
│   ├── tone-mixer.html
│   ├── memory-market.html
│   └── quick-call.html
├── css/
│   ├── main.css               # Shared navbar + footer
│   └── *.css                  # Page‑specific styles
├── js/
│   ├── firebase-config.js
│   ├── auth.js
│   ├── detectify.js           # The Humanity Triad engine
│   ├── main.js                # Logout, mobile menu
│   ├── streak-utils.js
│   ├── dashboard.js
│   ├── profile.js
│   ├── detectifyai.js
│   └── game-*.js              # Each game's logic
└── assets/
    ├── font/                  # Custom fonts
    ├── icon/                  # Icons
    └── *.png                  # Logos + backgrounds
```
