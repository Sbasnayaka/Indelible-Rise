// js/tone-mixer.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updateUserStreak } from './streak-utils.js';
import { showNotification } from './notification.js';

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
let userStreak = 0;
let overlayShown = false;

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

    if (document.referrer.includes('dashboard.html') && !overlayShown) {
        showHowToOverlay();
    }
}

// ---- SHOW HOW-TO OVERLAY (first time only) ----
function showHowToOverlay() {
    const overlay = document.getElementById('how-to-overlay');
    if (!overlay) return;

    // Show overlay
    overlay.style.display = 'flex';
    overlayShown = true;

    const dismiss = () => {
        overlay.style.display = 'none';
        overlay.onclick = null;
        startBtn.onclick = null;
    };

    const startBtn = document.getElementById('start-game-btn');

    // Click on overlay background (but not on inner card) closes it
    overlay.onclick = function(e) {
        if (e.target === overlay) {
            dismiss();
        }
    };

    // Click on the "Start Mixing" button closes it
    startBtn.onclick = function(e) {
        e.stopPropagation();
        dismiss();
    };
}

// ---- SUBMIT LOGIC ----
submitBtn.addEventListener('click', async () => {
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    if (currentLevelIndex >= baseSentences.length) {
        submitBtn.disabled = true;
        submitBtn.textContent = '🏆 Master!';
        return;
    }

    const formal = formalInput.value.trim();
    const funny = funnyInput.value.trim();
    const empathetic = empatheticInput.value.trim();
    
    const reEnable = () => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Tones';
    };

    // 1. Validate all fields are filled
    if (!formal || !funny || !empathetic) {
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = 'Please fill in all three tone variations before submitting.';
        showNotification('⚠️ Please fill in all three tone variations.', 'error');
        reEnable();
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
        showNotification('✏️ Each tone needs at least 3 words.', 'error');
        reEnable();
        return;
    }

    const combined = getCombinedText();

    // 3. Run DetectifyAI
    if (typeof runDetectifyCheck !== 'function') {
        showNotification('DetectifyAI engine not loaded. Please refresh.', 'error');
        reEnable();
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
        showNotification('🚫 ' + result.message + ' Please try again.', 'error');
        formalInput.value = '';
        funnyInput.value = '';
        empatheticInput.value = '';
        if (typeof startDetectifyTimer === 'function') startDetectifyTimer();
        updateDetectifyStats();
        reEnable();
        return;
    }

    // ---- Tone Mixer specific checks ----
    const sentence = baseSentences[currentLevelIndex];
    // Get base sentence words (ignore common stopwords? We'll keep simple: any word with length > 2)
    const baseWords = sentence.toLowerCase().match(/\b\w{3,}\b/g) || [];

    // Helper: count how many base words appear in a tone (case-insensitive)
    const countBaseWords = (tone) => {
        const toneLower = tone.toLowerCase();
        let count = 0;
        // Use a set to count unique base words found
        const found = new Set();
        for (const word of baseWords) {
            if (toneLower.includes(word) && !found.has(word)) {
                found.add(word);
                count++;
            }
        }
        return count;
    };

    const formalCount = countBaseWords(formal);
    const funnyCount = countBaseWords(funny);
    const empatheticCount = countBaseWords(empathetic);

    // Check that the three tones are not identical (case-insensitive trim)
    const areDistinct = !(formal.toLowerCase() === funny.toLowerCase() &&
                          funny.toLowerCase() === empathetic.toLowerCase());

    // Check that each tone contains at least 2 base words
    const allHaveKeywords = formalCount >= 2 && funnyCount >= 2 && empatheticCount >= 2;

    let xpEarned = 0;
    let reasonMessage = '';

    if (areDistinct && allHaveKeywords) {
        xpEarned = 2;
        reasonMessage = 'Great variety and keyword integration!';
    } else {
        xpEarned = -1;
        const issues = [];
        if (!areDistinct) issues.push('All three tones are identical.');
        if (!allHaveKeywords) {
            if (formalCount < 2) issues.push(`Formal tone missing base words (${formalCount}/2).`);
            if (funnyCount < 2) issues.push(`Funny tone missing base words (${funnyCount}/2).`);
            if (empatheticCount < 2) issues.push(`Empathetic tone missing base words (${empatheticCount}/2).`);
        }
        reasonMessage = issues.join(' ');
    }

    // 6. Human verified! Save to Firebase

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

        userStreak = await updateUserStreak(user.uid, db);

        userXP += xpEarned;
        xpDisplaySpan.textContent = userXP;

    } catch (error) {
        console.error('Firebase error:', error);
        showNotification('Error saving progress. Please check your connection.', 'error');
        reEnable();
        return;
    }

    // 7. Show success feedback
    verdictDisplay.textContent = '✅ Human';
    verdictDisplay.className = '';
    feedbackDiv.className = 'feedback-message success';
    feedbackDiv.style.display = 'block';

    let feedbackMessage = '';
    let notifType = 'success';
    if (xpEarned > 0) {
        feedbackMessage = `✅ ${reasonMessage} +${xpEarned} XP. 🔥 Streak: ${userStreak} days! Your versatility is growing! 🚀`;
        notifType = 'success';
    } else {
        feedbackMessage = `❌ ${reasonMessage} ${xpEarned} XP. 🔥 Streak: ${userStreak} days. Try to vary the tones and include keywords! 💡`;
        notifType = 'error';
    }
    feedbackDiv.innerHTML = feedbackMessage;

    const plainMessage = feedbackMessage.replace(/<[^>]*>/g, '');
    showNotification(plainMessage, notifType);

    // 8. Advance to next level after delay
    submitBtn.disabled = true;
    submitBtn.textContent = '🎉 Level Complete!';

    setTimeout(() => {
        currentLevelIndex++;
        renderLevel(currentLevelIndex);
        document.querySelector('.game-main').scrollIntoView({ behavior: 'smooth' });
    }, 2500);
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