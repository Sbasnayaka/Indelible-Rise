// js/mashup-studio.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updateUserStreak } from './streak-utils.js';

// ---- PROMPT POOLS (30 each -> creates 55 unique shuffled combinations) ----
const poolA = [
    "A Coffee Mug", "A Silver Key", "A Broken Compass", "A Dusty Book",
    "A Floating Island", "A Whispering Forest", "A Giant Clock", "A Forgotten Song",
    "A Melted Candle", "A Cracked Mirror", "A Golden Feather", "A Silent Bell",
    "A Rusty Sword", "A Paper Boat", "A Glowing Stone", "A Talking Parrot",
    "A Magic Carpet", "A Frozen Lake", "A Spinning Top", "A Lost Map",
    "A Wooden Puppet", "A Rainbow Bridge", "A Shadow Wolf", "A Silver Moon",
    "A Desert Flower", "A Storm Cloud", "A Hidden Tunnel", "A Crystal Ball",
    "A Velvet Rose", "A Whistling Wind"
];

const poolB = [
    "Time Travel", "Underwater Kingdom", "Alien Invasion", "Secret Society",
    "Parallel Universe", "Ghost Story", "Eternal Love", "Epic Betrayal",
    "Forgotten Prophecy", "Cosmic Disaster", "Silent Apocalypse", "Dream Heist",
    "Robot Uprising", "Magic School", "Pirate Treasure", "Superhero Origin",
    "Vampire Curse", "Werewolf Hunt", "Space Colony", "Viking Saga",
    "Samurai Duel", "Medieval Quest", "Cyberpunk Noir", "Steampunk Adventure",
    "Jungle Exploration", "Desert Survival", "Arctic Mystery", "Deep Sea Discovery",
    "Mountain Climbing", "Urban Legend"
];

// ---- SHUFFLE UTILITY ----
function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// ---- GENERATE 55 LEVEL PAIRS (shuffled) ----
function generatePairs() {
    const shuffledA = shuffleArray(poolA);
    const shuffledB = shuffleArray(poolB);
    const pairs = [];
    for (let i = 0; i < 55; i++) {
        pairs.push({
            a: shuffledA[i % shuffledA.length],
            b: shuffledB[i % shuffledB.length]
        });
    }
    return pairs;
}

const levels = generatePairs();

// ---- STATE ----
let currentLevelIndex = 0;
let userXP = 0;
let userStreak = 0;

// ---- DOM ELEMENTS ----
const promptAEl = document.getElementById('promptA').querySelector('span');
const promptBEl = document.getElementById('promptB').querySelector('span');
const answerText = document.getElementById('user-answer');
const submitBtn = document.getElementById('submit-btn');
const feedbackDiv = document.getElementById('feedbackMessage');
const levelDisplay = document.getElementById('levelDisplay');
const xpDisplaySpan = document.getElementById('xpDisplay');
const backBtn = document.getElementById('backToDashboardBtn');
const wordCounter = document.getElementById('wordCounter');

// DetectifyAI display elements
const wpmDisplay = document.getElementById('wpmDisplay');
const pasteDisplay = document.getElementById('pasteDisplay');
const ttrDisplay = document.getElementById('ttrDisplay');
const verdictDisplay = document.getElementById('verdictDisplay');
const cognitiveFill = document.getElementById('cognitiveLoadFill');
const cognitiveStatus = document.getElementById('cognitiveStatus');



// ---- REAL‑TIME WORD COUNTER ----
function updateWordCounter() {
    const text = answerText.value;
    const words = text.match(/\b\w+\b/g) || [];
    const count = words.length;
    const minWords = 30;
    wordCounter.innerHTML = `Words: ${count} / ${minWords}`;
    if (count >= minWords) {
        wordCounter.className = 'word-counter word-count-ok';
    } else {
        wordCounter.className = 'word-counter word-count-low';
    }
    // Also update DetectifyAI live
    if (typeof runDetectifyCheck === 'function' && text.length > 3) {
        const result = runDetectifyCheck(text);
        wpmDisplay.textContent = result.wpm;
        pasteDisplay.textContent = result.pasteRatio + '%';
        ttrDisplay.textContent = result.ttr.toFixed(2);
        if (result.isHuman) {
            verdictDisplay.textContent = '✅ Human';
            verdictDisplay.className = '';
            cognitiveStatus.textContent = 'Optimal';
        } else {
            verdictDisplay.textContent = '🚫 Flagged (' + result.reason + ')';
            verdictDisplay.className = 'flagged';
            cognitiveStatus.textContent = 'Under Review';
        }
    }
}

// ---- RENDER LEVEL ----
function renderLevel(index) {
    if (index >= levels.length) {
        feedbackDiv.className = 'feedback-message success';
        feedbackDiv.style.display = 'block';
        feedbackDiv.innerHTML = '🎉 You completed all 55 levels! Your creativity is off the charts! Redirecting...';
        submitBtn.disabled = true;
        submitBtn.textContent = '🏆 Master!';
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 3000);
        return;
    }

    const pair = levels[index];
    levelDisplay.textContent = `Level ${index + 1} of ${levels.length}`;
    promptAEl.textContent = pair.a;
    promptBEl.textContent = pair.b;

    // Clear feedback
    feedbackDiv.style.display = 'none';
    feedbackDiv.className = 'feedback-message';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Idea';

    // Reset DetectifyAI
    if (typeof startDetectifyTimer === 'function') {
        startDetectifyTimer();
    }
    if (typeof setupPasteListener === 'function') {
        setupPasteListener('user-answer');
    }

    // Clear textarea and reset stats
    answerText.value = '';
    updateWordCounter();
    wpmDisplay.textContent = '--';
    pasteDisplay.textContent = '--';
    ttrDisplay.textContent = '--';
    verdictDisplay.textContent = 'Waiting...';
    verdictDisplay.className = '';
    cognitiveFill.style.width = '75%';
    cognitiveStatus.textContent = 'Optimal';

    // Remove previous input listener and attach new one
    if (window._mashupInputListener) {
        answerText.removeEventListener('input', window._mashupInputListener);
    }
    const listener = function() {
        updateWordCounter();
        // live Detectify update is inside updateWordCounter
    };
    answerText.addEventListener('input', listener);
    window._mashupInputListener = listener;
}

// ---- SUBMIT LOGIC ----
submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    if (currentLevelIndex >= levels.length) return;

    const userText = answerText.value.trim();
    const words = userText.match(/\b\w+\b/g) || [];
    const wordCount = words.length;
    
    const reEnable = () => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Argument';
    };

    // 1. Validate word count (minimum 30 words)
    if (wordCount < 30) {
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = `Please write at least 30 words. You have ${wordCount} words. Keep going! ✍️`;
        reEnable();
        return;
    }

    // 2. Run DetectifyAI
    if (typeof runDetectifyCheck !== 'function') {
        alert('DetectifyAI engine not loaded. Please refresh.');
        reEnable();
        return;
    }
    const result = runDetectifyCheck(userText);

    // 3. Update stats
    wpmDisplay.textContent = result.wpm;
    pasteDisplay.textContent = result.pasteRatio + '%';
    ttrDisplay.textContent = result.ttr.toFixed(2);

    // 4. Check Human verdict
    if (!result.isHuman) {
        verdictDisplay.textContent = '🚫 Flagged (' + result.reason + ')';
        verdictDisplay.className = 'flagged';
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = result.message + ' Please try again with your own original thoughts.';
        answerText.value = '';
        if (typeof startDetectifyTimer === 'function') startDetectifyTimer();
        updateWordCounter();
        reEnable();
        return;
    }

    // 5. Human verified! Save to Firebase
    const xpEarned = 5;
    const pair = levels[currentLevelIndex];

    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not logged in');

        // Save submission
        await addDoc(collection(db, 'submissions'), {
            userId: user.uid,
            gameId: 'mashup-studio',
            levelIndex: currentLevelIndex,
            promptA: pair.a,
            promptB: pair.b,
            payload: userText,
            wordCount: wordCount,
            durationSeconds: result.duration,
            wpm: result.wpm,
            pasteRatio: result.pasteRatio,
            ttr: result.ttr,
            xpAwarded: xpEarned,
            timestamp: serverTimestamp()
        });

        // Update user XP and level
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            xp: increment(xpEarned),
            mashupStudioLevel: currentLevelIndex + 1
        });

        
        userStreak = await updateUserStreak(user.uid, db);

        userXP += xpEarned;
        xpDisplaySpan.textContent = userXP;

    } catch (error) {
        console.error('Firebase error:', error);
        alert('Error saving progress. Please check your connection.');
        reEnable();
        return;
    }

    // 6. Show success feedback
    verdictDisplay.textContent = '✅ Human';
    verdictDisplay.className = '';
    feedbackDiv.className = 'feedback-message success';
    feedbackDiv.style.display = 'block';
    feedbackDiv.innerHTML = `✅ Brilliant idea! +${xpEarned} XP. Your creativity is thriving! 🚀`;

    // 7. Advance to next level after delay
    submitBtn.disabled = true;
    submitBtn.textContent = '🎉 Level Complete!';

    setTimeout(() => {
        currentLevelIndex++;
        renderLevel(currentLevelIndex);
        document.querySelector('.game-main').scrollIntoView({ behavior: 'smooth' });
    }, 2000);
});

// ---- BACK BUTTON ----
backBtn.addEventListener('click', () => {
    window.location.href = '../dashboard.html';
});

// ---- LOAD USER LEVEL AND XP ----
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../login.html';
        return;
    }
    try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            userXP = data.xp || 0;
            userStreak = data.streak || 0;
            xpDisplaySpan.textContent = userXP;
            const savedLevel = data.mashupStudioLevel || 0;
            if (savedLevel >= levels.length) {
                feedbackDiv.className = 'feedback-message success';
                feedbackDiv.style.display = 'block';
                feedbackDiv.innerHTML = `✅ Brilliant idea! +${xpEarned} XP. 🔥 Streak: ${userStreak} days! Your creativity is thriving! 🚀`;
                submitBtn.disabled = true;
                submitBtn.textContent = '🌟 Master';
                return;
            }
            currentLevelIndex = savedLevel;
            renderLevel(currentLevelIndex);
        } else {
            renderLevel(0);
        }
    } catch (e) {
        console.error('Error loading user data:', e);
        renderLevel(0);
    }
});

// ---- KEYBOARD SHORTCUT: Ctrl+Enter to submit ----
answerText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        submitBtn.click();
    }
});