// js/tone-mixer.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ---- 55 BASE SENTENCES ----
const baseSentences = [
    "The meeting has been cancelled.",
    "I lost my car keys.",
    "My alarm clock didn't go off this morning.",
    "The restaurant ran out of coffee.",
    "I have to work late on Friday.",
    "The train was delayed again.",
    "My phone battery died.",
    "The internet connection is down.",
    "I forgot my wallet at home.",
    "The movie was not as good as expected.",
    "My flight got cancelled.",
    "The package hasn't arrived yet.",
    "I spilled coffee on my shirt.",
    "The printer is out of ink.",
    "My computer crashed right before the deadline.",
    "The power went out during the storm.",
    "I locked myself out of the house.",
    "The supermarket is closed on Sundays.",
    "My friend forgot my birthday.",
    "I missed the bus this morning.",
    "The pizza delivery took over an hour.",
    "My shoes are uncomfortable.",
    "I have to attend a boring meeting all day.",
    "The weather forecast was completely wrong.",
    "My favourite team lost the match.",
    "I accidentally deleted an important file.",
    "The water heater is broken.",
    "My neighbour plays loud music at night.",
    "I can't find my glasses anywhere.",
    "The new restaurant is overpriced.",
    "My passport expired yesterday.",
    "I got stuck in traffic for two hours.",
    "The washing machine is making a strange noise.",
    "My boss gave me extra work on Friday afternoon.",
    "The hotel room was too small.",
    "I twisted my ankle while jogging.",
    "The conference was rescheduled to next month.",
    "My credit card got declined at the store.",
    "I left my umbrella on the train.",
    "The grass needs cutting but it's raining.",
    "My friend borrowed my favourite book and lost it.",
    "The fridge is empty and the shops are closed.",
    "I have a headache and need to rest.",
    "The presentation didn't go as planned.",
    "My car has a flat tyre.",
    "The children are being too loud.",
    "I forgot to buy milk on the way home.",
    "My laptop charger broke.",
    "The neighbours are having a party on a Tuesday night.",
    "I have three deadlines tomorrow and no time.",
    "The streaming service is buffering constantly.",
    "My new haircut looks terrible.",
    "The doorbell rang but no one was there.",
    "I dropped my phone and the screen cracked.",
    "The gym is closed for maintenance."
];

// ---- STATE ----
let currentLevelIndex = 0;
let userXP = 0;

// ---- DOM ELEMENTS ----
const sentenceDisplay = document.getElementById('baseSentenceDisplay');
const formalInput = document.getElementById('ans-formal');
const funnyInput = document.getElementById('ans-funny');
const empatheticInput = document.getElementById('ans-empathetic');
const submitBtn = document.getElementById('submit-btn');
const feedbackDiv = document.getElementById('feedbackMessage');
const levelDisplay = document.getElementById('levelDisplay');
const xpDisplaySpan = document.getElementById('xpDisplay');
const backBtn = document.getElementById('backToDashboardBtn');

// DetectifyAI display elements
const wpmDisplay = document.getElementById('wpmDisplay');
const pasteDisplay = document.getElementById('pasteDisplay');
const ttrDisplay = document.getElementById('ttrDisplay');
const verdictDisplay = document.getElementById('verdictDisplay');
const cognitiveFill = document.getElementById('cognitiveLoadFill');
const cognitiveStatus = document.getElementById('cognitiveStatus');

// ---- GET COMBINED TEXT FOR DETECTIFY ----
function getCombinedText() {
    const formal = formalInput.value.trim();
    const funny = funnyInput.value.trim();
    const empathetic = empatheticInput.value.trim();
    return formal + " " + funny + " " + empathetic;
}

// ---- REAL‑TIME DETECTIFY UPDATE ----
function updateDetectifyStats() {
    const combined = getCombinedText();
    if (combined.length < 3) {
        wpmDisplay.textContent = '--';
        pasteDisplay.textContent = '--';
        ttrDisplay.textContent = '--';
        verdictDisplay.textContent = 'Waiting...';
        verdictDisplay.className = '';
        return;
    }

    if (typeof runDetectifyCheck !== 'function') return;
    const result = runDetectifyCheck(combined);
    wpmDisplay.textContent = result.wpm;
    pasteDisplay.textContent = result.pasteRatio + '%';
    ttrDisplay.textContent = result.ttr.toFixed(2);
    if (result.isHuman) {
        verdictDisplay.textContent = '✅ Human';
        verdictDisplay.className = '';
        cognitiveStatus.textContent = 'Optimal';
        cognitiveFill.style.width = Math.min(100, parseInt(cognitiveFill.style.width) + 2) + '%';
    } else {
        verdictDisplay.textContent = '🚫 Flagged (' + result.reason + ')';
        verdictDisplay.className = 'flagged';
        cognitiveStatus.textContent = 'Under Review';
    }
}

// ---- RENDER LEVEL ----
function renderLevel(index) {
    if (index >= baseSentences.length) {
        feedbackDiv.className = 'feedback-message success';
        feedbackDiv.style.display = 'block';
        feedbackDiv.innerHTML = '🎉 You completed all 55 levels! Your stylistic range is incredible! Redirecting...';
        submitBtn.disabled = true;
        submitBtn.textContent = '🏆 Master!';
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 3000);
        return;
    }

    levelDisplay.textContent = `Level ${index + 1} of ${baseSentences.length}`;
    sentenceDisplay.textContent = `"${baseSentences[index]}"`;

    // Clear feedback
    feedbackDiv.style.display = 'none';
    feedbackDiv.className = 'feedback-message';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Tones';

    // Reset DetectifyAI
    if (typeof startDetectifyTimer === 'function') {
        startDetectifyTimer();
    }
    // Attach paste listeners to all 3 text areas
    if (typeof setupPasteListener === 'function') {
        setupPasteListener('ans-formal');
        setupPasteListener('ans-funny');
        setupPasteListener('ans-empathetic');
    }

    // Clear all inputs and reset stats
    formalInput.value = '';
    funnyInput.value = '';
    empatheticInput.value = '';
    wpmDisplay.textContent = '--';
    pasteDisplay.textContent = '--';
    ttrDisplay.textContent = '--';
    verdictDisplay.textContent = 'Waiting...';
    verdictDisplay.className = '';
    cognitiveFill.style.width = '75%';
    cognitiveStatus.textContent = 'Optimal';

    // Remove previous input listener and attach new one
    if (window._toneInputListener) {
        formalInput.removeEventListener('input', window._toneInputListener);
        funnyInput.removeEventListener('input', window._toneInputListener);
        empatheticInput.removeEventListener('input', window._toneInputListener);
    }
    const listener = function() {
        updateDetectifyStats();
    };
    formalInput.addEventListener('input', listener);
    funnyInput.addEventListener('input', listener);
    empatheticInput.addEventListener('input', listener);
    window._toneInputListener = listener;
}

// ---- SUBMIT LOGIC ----
submitBtn.addEventListener('click', async () => {
    if (currentLevelIndex >= baseSentences.length) return;

    const formal = formalInput.value.trim();
    const funny = funnyInput.value.trim();
    const empathetic = empatheticInput.value.trim();

    // 1. Validate all fields are filled
    if (!formal || !funny || !empathetic) {
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = 'Please fill in all three tone variations before submitting.';
        return;
    }

    // 2. Validate minimum length per field (at least 3 words each)
    const formalWords = formal.match(/\b\w+\b/g) || [];
    const funnyWords = funny.match(/\b\w+\b/g) || [];
    const empatheticWords = empathetic.match(/\b\w+\b/g) || [];

    if (formalWords.length < 3 || funnyWords.length < 3 || empatheticWords.length < 3) {
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = 'Each tone needs at least 3 words. Show some creativity! ✍️';
        return;
    }

    const combined = getCombinedText();

    // 3. Run DetectifyAI
    if (typeof runDetectifyCheck !== 'function') {
        alert('DetectifyAI engine not loaded. Please refresh.');
        return;
    }
    const result = runDetectifyCheck(combined);

    // 4. Update stats
    wpmDisplay.textContent = result.wpm;
    pasteDisplay.textContent = result.pasteRatio + '%';
    ttrDisplay.textContent = result.ttr.toFixed(2);

    // 5. Check Human verdict
    if (!result.isHuman) {
        verdictDisplay.textContent = '🚫 Flagged (' + result.reason + ')';
        verdictDisplay.className = 'flagged';
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = result.message + ' Please try again with your own original writing.';
        formalInput.value = '';
        funnyInput.value = '';
        empatheticInput.value = '';
        if (typeof startDetectifyTimer === 'function') startDetectifyTimer();
        updateDetectifyStats();
        return;
    }

    // 6. Human verified! Save to Firebase
    const xpEarned = 2;
    const sentence = baseSentences[currentLevelIndex];

    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not logged in');

        // Save submission
        await addDoc(collection(db, 'submissions'), {
            userId: user.uid,
            gameId: 'tone-mixer',
            levelIndex: currentLevelIndex,
            baseSentence: sentence,
            payload: {
                formal: formal,
                funny: funny,
                empathetic: empathetic
            },
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
            toneMixerLevel: currentLevelIndex + 1
        });

        userXP += xpEarned;
        xpDisplaySpan.textContent = userXP;

    } catch (error) {
        console.error('Firebase error:', error);
        alert('Error saving progress. Please check your connection.');
        return;
    }

    // 7. Show success feedback
    verdictDisplay.textContent = '✅ Human';
    verdictDisplay.className = '';
    feedbackDiv.className = 'feedback-message success';
    feedbackDiv.style.display = 'block';
    feedbackDiv.innerHTML = `✅ Fantastic range! +${xpEarned} XP. Your writing versatility is growing! 🚀`;

    // 8. Advance to next level after delay
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
            xpDisplaySpan.textContent = userXP;
            const savedLevel = data.toneMixerLevel || 0;
            if (savedLevel >= baseSentences.length) {
                feedbackDiv.className = 'feedback-message success';
                feedbackDiv.style.display = 'block';
                feedbackDiv.innerHTML = '🏆 You have mastered all 55 levels! Amazing work!';
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
const allInputs = [formalInput, funnyInput, empatheticInput];
allInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            submitBtn.click();
        }
    });
});