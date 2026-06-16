// js/claim-detective.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ---- QUESTION BANK ----
const questions = [
    {
        claim: '"Recent studies prove that consuming three cups of green tea daily increases cognitive processing speed by 400% within a week, making it superior to any pharmaceutical intervention for focus."',
        evidence: [
            { label: 'A', text: 'A 5-year study by Oxford University on 10,000 students.' },
            { label: 'B', text: 'My friend Bob drank green tea and passed his math test.' },
            { label: 'C', text: 'A chemical analysis showing increased brain activity.' }
        ],
        correctIndex: 1, // B (anecdote)
        explanation: 'Anecdotal evidence from one person is not reliable scientific proof.'
    },
    {
        claim: '"Energy drinks make you 200% smarter and boost your IQ instantly."',
        evidence: [
            { label: 'A', text: 'A 3-year study on 10,000 university students.' },
            { label: 'B', text: 'My cousin drank one and got an A on her exam.' },
            { label: 'C', text: 'Lab results show a temporary increase in alertness.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s experience is not reliable evidence (anecdotal fallacy).'
    },
    {
        claim: '"Eating dark chocolate every day helps you lose weight fast."',
        evidence: [
            { label: 'A', text: 'A doctor wrote a book recommending chocolate for weight loss.' },
            { label: 'B', text: 'My sister ate chocolate and lost 5kg in a month.' },
            { label: 'C', text: 'A clinical trial on 500 people showed modest weight loss.' }
        ],
        correctIndex: 1,
        explanation: 'Personal testimony is not scientific evidence (anecdotal).'
    },
    {
        claim: '"Online learning is significantly worse than traditional classroom teaching."',
        evidence: [
            { label: 'A', text: 'A survey of 200 teachers across 50 schools.' },
            { label: 'B', text: 'My friend failed his online class last semester.' },
            { label: 'C', text: 'A research paper comparing test scores of both groups.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s failure does not prove the whole system is flawed.'
    },
    {
        claim: '"Vaccines cause autism in children."',
        evidence: [
            { label: 'A', text: 'A retracted study from 1998 (since debunked).' },
            { label: 'B', text: 'A celebrity claimed her child developed autism after vaccination.' },
            { label: 'C', text: 'A meta-analysis of 100 million children showed no link.' }
        ],
        correctIndex: 1,
        explanation: 'Celebrity opinions are not scientific evidence (appeal to false authority).'
    }
];

// ---- STATE ----
let currentQuestionIndex = 0;
let userXP = 0;
let gameSessionStart = performance.now();

// ---- DOM ELEMENTS ----
const claimCard = document.getElementById('claimCard');
const evidenceGroup = document.getElementById('evidenceGroup');
const answerText = document.getElementById('user-answer');
const submitBtn = document.getElementById('submit-btn');
const feedbackDiv = document.getElementById('feedbackMessage');
const progressSpan = document.getElementById('questionProgress').querySelector('span:first-child');
const xpDisplaySpan = document.getElementById('xpDisplay');

// DetectifyAI display elements
const wpmDisplay = document.getElementById('wpmDisplay');
const pasteDisplay = document.getElementById('pasteDisplay');
const ttrDisplay = document.getElementById('ttrDisplay');
const verdictDisplay = document.getElementById('verdictDisplay');
const verdictRow = document.getElementById('verdictRow');
const cognitiveFill = document.getElementById('cognitiveLoadFill');

// ---- RENDER QUESTION ----
function renderQuestion(index) {
    const q = questions[index];
    if (!q) {
        // All done!
        feedbackDiv.className = 'feedback-message success';
        feedbackDiv.style.display = 'block';
        feedbackDiv.innerHTML = '🎉 You completed all rounds! Your mind is sharp. Bonus +100 XP!';
        submitBtn.disabled = true;
        return;
    }

    progressSpan.textContent = `Question ${index + 1} of ${questions.length}`;

    // Claim
    claimCard.innerHTML = `<blockquote>${q.claim}</blockquote>`;

    // Evidence
    let html = '';
    q.evidence.forEach((ev, i) => {
        html += `
            <div class="evidence-option">
                <input type="radio" name="evidence" value="${i}" id="ev_${i}">
                <label for="ev_${i}"><strong>${ev.label}:</strong> ${ev.text}</label>
            </div>
        `;
    });
    evidenceGroup.innerHTML = html;

    // Clear previous feedback
    feedbackDiv.style.display = 'none';
    feedbackDiv.className = 'feedback-message';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Play Now';

    // Reset DetectifyAI timer for new input
    if (typeof startDetectifyTimer === 'function') {
        startDetectifyTimer();
    }
    if (typeof setupPasteListener === 'function') {
        setupPasteListener('user-answer');
    }

    // Clear textarea and reset sidebar
    answerText.value = '';
    wpmDisplay.textContent = '--';
    pasteDisplay.textContent = '--';
    ttrDisplay.textContent = '--';
    verdictDisplay.textContent = 'Waiting...';
    verdictDisplay.className = '';
    cognitiveFill.style.width = '75%';
}

// ---- SUBMIT LOGIC ----
submitBtn.addEventListener('click', async () => {
    const q = questions[currentQuestionIndex];
    if (!q) {
        window.location.href = '../dashboard.html';
        return;
    }

    // 1. Validate radio selection
    const selected = document.querySelector('input[name="evidence"]:checked');
    if (!selected) {
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = 'Please select an evidence option (A, B, or C).';
        return;
    }
    const selectedIndex = parseInt(selected.value);

    // 2. Validate text area (must have at least 10 characters)
    const userText = answerText.value.trim();
    if (userText.length < 10) {
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = 'Please write a proper explanation (at least 10 characters).';
        return;
    }

    // 3. Run DetectifyAI
    if (typeof runDetectifyCheck !== 'function') {
        alert('DetectifyAI engine not loaded. Please refresh.');
        return;
    }
    const result = runDetectifyCheck(userText);

    // 4. Display DetectifyAI metrics in sidebar
    wpmDisplay.textContent = result.wpm;
    pasteDisplay.textContent = result.pasteRatio + '%';
    ttrDisplay.textContent = result.ttr.toFixed(2);

    if (result.isHuman) {
        verdictDisplay.textContent = '✅ Human';
        verdictDisplay.className = '';
        // Increase cognitive load bar slightly for "effort"
        cognitiveFill.style.width = Math.min(100, parseInt(cognitiveFill.style.width) + 5) + '%';
    } else {
        verdictDisplay.textContent = '🚫 Flagged (' + result.reason + ')';
        verdictDisplay.className = 'flagged';
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = result.message + ' Please try again.';
        // Clear the text area and let them retry
        answerText.value = '';
        if (typeof startDetectifyTimer === 'function') startDetectifyTimer();
        return;
    }

    // 5. Check if evidence choice is correct
    const isCorrect = (selectedIndex === q.correctIndex);
    const xpEarned = isCorrect ? 50 : 10;

    // 6. Save to Firebase (only if human)
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not logged in');

        // Save submission
        const submissionRef = await addDoc(collection(db, 'submissions'), {
            userId: user.uid,
            gameId: 'claim-detective',
            questionIndex: currentQuestionIndex,
            claim: q.claim,
            selectedEvidence: q.evidence[selectedIndex].label,
            correctEvidence: q.evidence[q.correctIndex].label,
            isCorrect: isCorrect,
            payload: userText,
            durationSeconds: result.duration,
            wpm: result.wpm,
            pasteRatio: result.pasteRatio,
            ttr: result.ttr,
            xpAwarded: xpEarned,
            timestamp: serverTimestamp()
        });
        console.log('Submission saved:', submissionRef.id);

        // Update user XP
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            xp: increment(xpEarned)
        });

        // Update local XP display
        userXP += xpEarned;
        xpDisplaySpan.textContent = userXP;

    } catch (error) {
        console.error('Firebase error:', error);
        alert('Error saving progress. Please check your connection.');
        return;
    }

    // 7. Show feedback to user
    feedbackDiv.className = 'feedback-message success';
    feedbackDiv.style.display = 'block';
    if (isCorrect) {
        feedbackDiv.innerHTML = `✅ Correct! +${xpEarned} XP. ${q.explanation}`;
    } else {
        feedbackDiv.innerHTML = `⚠️ Not quite. The weak evidence was <strong>${q.evidence[q.correctIndex].label}</strong>. ${q.explanation} +${xpEarned} XP for effort.`;
    }

    // 8. Move to next question after delay
    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading next...';

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            renderQuestion(currentQuestionIndex);
            // Scroll to top of game area
            document.querySelector('.game-main').scrollIntoView({ behavior: 'smooth' });
        } else {
            // All done! Redirect to dashboard after a pause
            feedbackDiv.innerHTML = '🎉 You completed all 5 rounds! Redirecting to dashboard...';
            setTimeout(() => {
                window.location.href = '../dashboard.html';
            }, 2000);
        }
    }, 2500);
});

// ---- AUTH CHECK & USER XP LOAD ----
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../login.html';
        return;
    }
    // Load user's XP from Firestore
    try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            userXP = data.xp || 0;
            xpDisplaySpan.textContent = userXP;
        }
    } catch (e) {
        console.error('Error loading XP:', e);
    }
    // Render first question
    renderQuestion(0);
});

// ---- KEYBOARD SHORTCUT: Ctrl+Enter to submit ----
answerText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        submitBtn.click();
    }
});