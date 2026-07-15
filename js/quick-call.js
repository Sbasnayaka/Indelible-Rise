// js/quick-call.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updateUserStreak } from './streak-utils.js';
import { showNotification } from './notification.js';

// ---- 55 QUICK DECISION SCENARIOS ----
const quickScenarios = [
    // 1
    { id: 'qc_1', text: 'Your company is losing money. You must either fire 10% of your staff today, or cut everyone\'s pay by 15%. What do you do?', optionA: 'Fire 10%', optionB: 'Cut Pay 15%' },
    // 2
    { id: 'qc_2', text: 'You find a wallet with £500 cash inside, but no ID. You see a wealthy-looking person and a struggling student walking away. Who do you ask if they dropped it?', optionA: 'The wealthy person', optionB: 'The student' },
    // 3
    { id: 'qc_3', text: 'Your boat is sinking. You can only save the box of food rations OR the emergency radio beacon. Which do you grab?', optionA: 'Food Rations', optionB: 'Radio Beacon' },
    // 4
    { id: 'qc_4', text: 'You are a doctor with one ventilator left. Two patients need it: a 70-year-old with a 50% chance, and a 20-year-old with a 90% chance. Who gets it?', optionA: '70-year-old', optionB: '20-year-old' },
    // 5
    { id: 'qc_5', text: 'Your team is behind schedule. You can either ask everyone to work overtime for 2 weeks, or cut scope and deliver less. Which do you choose?', optionA: 'Work Overtime', optionB: 'Cut Scope' },
    // 6
    { id: 'qc_6', text: 'You are offered a promotion with a 30% pay raise but it requires relocating to a new city. Do you take it?', optionA: 'Take the promotion', optionB: 'Stay in your current role' },
    // 7
    { id: 'qc_7', text: 'A restaurant serves you undercooked chicken. Do you ask for a refund or simply never go back?', optionA: 'Ask for refund', optionB: 'Never go back' },
    // 8
    { id: 'qc_8', text: 'You have a sore throat and a big presentation tomorrow. Do you rest all day or power through and practice?', optionA: 'Rest all day', optionB: 'Power through' },
    // 9
    { id: 'qc_9', text: 'A friend asks to borrow £200. They have a history of not paying back. Do you lend it or say no?', optionA: 'Lend it', optionB: 'Say no' },
    // 10
    { id: 'qc_10', text: 'Your flight is overbooked. The airline offers £400 to take a later flight. Do you take the offer?', optionA: 'Take the offer', optionB: 'Keep your seat' },
    // 11
    { id: 'qc_11', text: 'A new project is risky but could double your company\'s revenue. Do you approve it or play it safe?', optionA: 'Approve it', optionB: 'Play it safe' },
    // 12
    { id: 'qc_12', text: 'You accidentally receive a document marked "Confidential" meant for your boss. Do you read it or return it unread?', optionA: 'Read it', optionB: 'Return it unread' },
    // 13
    { id: 'qc_13', text: 'Your car breaks down in a remote area. Do you walk 5km to the nearest town or stay with the car and wait?', optionA: 'Walk to town', optionB: 'Stay with car' },
    // 14
    { id: 'qc_14', text: 'You win a prize: either £5,000 cash or a luxury holiday worth £8,000. Which do you choose?', optionA: '£5,000 cash', optionB: 'Luxury holiday' },
    // 15
    { id: 'qc_15', text: 'A colleague takes credit for your work. Do you confront them or stay quiet for the sake of team harmony?', optionA: 'Confront them', optionB: 'Stay quiet' },
    // 16
    { id: 'qc_16', text: 'You are building a house. Do you spend more on a better foundation or on a better interior finish?', optionA: 'Better foundation', optionB: 'Better interior' },
    // 17
    { id: 'qc_17', text: 'A new law could reduce crime by 20% but restrict civil liberties. Do you support it?', optionA: 'Support it', optionB: 'Oppose it' },
    // 18
    { id: 'qc_18', text: 'Your friend is dating someone you think is bad for them. Do you speak up or mind your own business?', optionA: 'Speak up', optionB: 'Mind your own business' },
    // 19
    { id: 'qc_19', text: 'You have two job offers: one pays well but is boring; the other pays less but is exciting. Which do you take?', optionA: 'High pay, boring', optionB: 'Low pay, exciting' },
    // 20
    { id: 'qc_20', text: 'A company offers you a free trial for 30 days then auto-charges. Do you sign up or decline?', optionA: 'Sign up', optionB: 'Decline' },
    // 21
    { id: 'qc_21', text: 'You are in a hurry and see a parking spot that is technically for disabled. Do you park there or keep looking?', optionA: 'Park there', optionB: 'Keep looking' },
    // 22
    { id: 'qc_22', text: 'Your team wants to adopt a new software tool. It will take time to learn but save hours later. Do you adopt it?', optionA: 'Adopt it', optionB: 'Stick with the old tool' },
    // 23
    { id: 'qc_23', text: 'A reporter asks you about a sensitive topic. Do you give a statement or decline to comment?', optionA: 'Give a statement', optionB: 'Decline to comment' },
    // 24
    { id: 'qc_24', text: 'You are planning a vacation. Do you book a package holiday with everything planned, or plan it yourself?', optionA: 'Package holiday', optionB: 'Plan it yourself' },
    // 25
    { id: 'qc_25', text: 'A school wants to ban a book from the curriculum. Do you protest the ban or accept the decision?', optionA: 'Protest the ban', optionB: 'Accept the decision' },
    // 26
    { id: 'qc_26', text: 'Your child wants to study art but you think it\'s risky. Do you encourage them or guide them to a safer career?', optionA: 'Encourage art', optionB: 'Guide to safer career' },
    // 27
    { id: 'qc_27', text: 'You accidentally damage a friend\'s car. Do you tell them immediately or wait to see if they notice?', optionA: 'Tell them immediately', optionB: 'Wait and see' },
    // 28
    { id: 'qc_28', text: 'A politician proposes a new tax to fund healthcare. Do you support or oppose it?', optionA: 'Support it', optionB: 'Oppose it' },
    // 29
    { id: 'qc_29', text: 'You are at a restaurant and the service is terrible. Do you ask to speak to the manager or just pay and leave?', optionA: 'Speak to manager', optionB: 'Pay and leave' },
    // 30
    { id: 'qc_30', text: 'A company offers you stock options instead of a higher salary. Do you take the options or the salary?', optionA: 'Take stock options', optionB: 'Take higher salary' },
    // 31
    { id: 'qc_31', text: 'Your neighbour plays loud music at night. Do you confront them or call the police?', optionA: 'Confront them', optionB: 'Call the police' },
    // 32
    { id: 'qc_32', text: 'You are offered a chance to invest in a friend\'s start-up. It could fail or succeed big. Do you invest?', optionA: 'Invest', optionB: 'Don\'t invest' },
    // 33
    { id: 'qc_33', text: 'A charity asks you to donate monthly. Do you commit or give a one-time donation?', optionA: 'Monthly commitment', optionB: 'One-time donation' },
    // 34
    { id: 'qc_34', text: 'You are asked to sign a petition for a cause you support but the group seems extreme. Do you sign?', optionA: 'Sign it', optionB: 'Don\'t sign' },
    // 35
    { id: 'qc_35', text: 'Your team is divided. Do you make the decision yourself or try to build consensus?', optionA: 'Decide yourself', optionB: 'Build consensus' },
    // 36
    { id: 'qc_36', text: 'You have a chance to travel for a year but it means pausing your career. Do you go or stay?', optionA: 'Travel for a year', optionB: 'Stay and work' },
    // 37
    { id: 'qc_37', text: 'A company has a toxic culture but pays very well. Do you accept a job offer?', optionA: 'Accept the job', optionB: 'Reject the offer' },
    // 38
    { id: 'qc_38', text: 'You witness a minor theft at a store. Do you report it or ignore it?', optionA: 'Report it', optionB: 'Ignore it' },
    // 39
    { id: 'qc_39', text: 'Your partner wants to move to another city for their career. Do you move with them or stay for yours?', optionA: 'Move with them', optionB: 'Stay for your career' },
    // 40
    { id: 'qc_40', text: 'You are asked to lie to protect a friend. Do you lie or tell the truth?', optionA: 'Lie to protect', optionB: 'Tell the truth' },
    // 41
    { id: 'qc_41', text: 'A new tech device costs £1,000 but will save you 2 hours per week. Do you buy it?', optionA: 'Buy it', optionB: 'Don\'t buy it' },
    // 42
    { id: 'qc_42', text: 'Your landlord raises rent by 20%. Do you negotiate or move out?', optionA: 'Negotiate', optionB: 'Move out' },
    // 43
    { id: 'qc_43', text: 'A colleague is being bullied. Do you speak up or stay out of it?', optionA: 'Speak up', optionB: 'Stay out of it' },
    // 44
    { id: 'qc_44', text: 'You are offered a free gym membership for a year but it\'s far away. Do you take it?', optionA: 'Take it', optionB: 'Decline it' },
    // 45
    { id: 'qc_45', text: 'A competitor offers you a job for 30% more pay. Do you leave your current company?', optionA: 'Leave', optionB: 'Stay' },
    // 46
    { id: 'qc_46', text: 'You are asked to work on a holiday. Do you do it for extra pay or refuse?', optionA: 'Work for extra pay', optionB: 'Refuse' },
    // 47
    { id: 'qc_47', text: 'Your phone breaks. Do you repair it (£100) or buy a new one (£500)?', optionA: 'Repair it', optionB: 'Buy new one' },
    // 48
    { id: 'qc_48', text: 'A friend reveals a secret they asked you to keep. Do you keep it or tell someone?', optionA: 'Keep it', optionB: 'Tell someone' },
    // 49
    { id: 'qc_49', text: 'You are offered a free course to learn a new skill. It requires 3 hours per week. Do you commit?', optionA: 'Commit to it', optionB: 'Don\'t commit' },
    // 50
    { id: 'qc_50', text: 'Your child is offered a place at a private school. It\'s expensive but better. Do you accept?', optionA: 'Accept private school', optionB: 'Keep them in public school' },
    // 51
    { id: 'qc_51', text: 'A celebrity endorses a product. Do you buy it because of them or ignore it?', optionA: 'Buy it', optionB: 'Ignore it' },
    // 52
    { id: 'qc_52', text: 'You are in a traffic jam. Do you take a longer but faster route or wait it out?', optionA: 'Take the longer route', optionB: 'Wait it out' },
    // 53
    { id: 'qc_53', text: 'Your boss asks you to break a small rule to meet a deadline. Do you do it or refuse?', optionA: 'Break the rule', optionB: 'Refuse' },
    // 54
    { id: 'qc_54', text: 'You are given a project that is impossible to finish on time. Do you tell your boss or try anyway?', optionA: 'Tell your boss', optionB: 'Try anyway' },
    // 55
    { id: 'qc_55', text: 'A friend asks you to be a guarantor for their loan. Do you agree or say no?', optionA: 'Agree', optionB: 'Say no' }
];

// ---- STATE ----
let currentLevelIndex = 0;
let userXP = 0;
let userStreak = 0;
let timerInterval = null;
let timeLeft = 10;
let userChoice = '';
let timeTaken = 0;
let choiceMade = false;
let currentScenario = null;
let overlayShown = false;

// ---- DOM ELEMENTS ----
const choicePhase = document.getElementById('choicePhase');
const explanationPhase = document.getElementById('explanationPhase');
const timerNumber = document.getElementById('timerNumber');
const scenarioText = document.getElementById('scenarioText');
const btnA = document.getElementById('btnOptionA');
const btnB = document.getElementById('btnOptionB');
const decisionTag = document.getElementById('decisionTag');
const explanationPrompt = document.getElementById('explanationPrompt');
const reasonText = document.getElementById('userReason');
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

// ---- DETECTIFY UPDATE ----
function updateDetectifyStats() {
    const text = reasonText.value.trim();
    if (text.length < 3) {
        wpmDisplay.textContent = '--';
        pasteDisplay.textContent = '--';
        ttrDisplay.textContent = '--';
        verdictDisplay.textContent = 'Waiting...';
        verdictDisplay.className = '';
        return;
    }

    if (typeof runDetectifyCheck !== 'function') return;
    const result = runDetectifyCheck(text);
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

// ---- TIMER ----
function startTimer() {
    timeLeft = 10;
    choiceMade = false;
    timerNumber.textContent = timeLeft;
    document.getElementById('timerDisplay').classList.remove('warning');

    btnA.disabled = false;
    btnB.disabled = false;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerNumber.textContent = timeLeft;

        if (timeLeft <= 3) {
            document.getElementById('timerDisplay').classList.add('warning');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerNumber.textContent = '0';
            // Timeout – auto move to explanation
            userChoice = 'Timeout';
            timeTaken = 10;
            moveToExplanation('⏱ Time is up! You didn\'t choose in time. Why did you hesitate?');
        }
    }, 1000);
}

// ---- MOVE TO EXPLANATION ----
function moveToExplanation(promptText) {
    clearInterval(timerInterval);
    choiceMade = true;
    btnA.disabled = true;
    btnB.disabled = true;

    // Hide choice phase, show explanation
    choicePhase.style.display = 'none';
    explanationPhase.style.display = 'block';

    // Set decision tag
    if (userChoice === 'Timeout') {
        decisionTag.textContent = 'You chose: ⏱ Timeout';
        decisionTag.style.borderColor = '#FF6B6B';
        decisionTag.style.color = '#FF6B6B';
    } else {
        decisionTag.textContent = `You chose: ${userChoice}`;
        decisionTag.style.borderColor = '#39FF14';
        decisionTag.style.color = '#39FF14';
    }

    explanationPrompt.textContent = promptText;

    // Start DetectifyAI timer NOW (not during the 10s countdown)
    if (typeof startDetectifyTimer === 'function') {
        startDetectifyTimer();
    }
    if (typeof setupPasteListener === 'function') {
        setupPasteListener('userReason');
    }

    // Attach input listener for live Detectify updates
    if (window._quickInputListener) {
        reasonText.removeEventListener('input', window._quickInputListener);
    }
    const listener = function() {
        updateDetectifyStats();
    };
    reasonText.addEventListener('input', listener);
    window._quickInputListener = listener;

    // Focus the textarea
    reasonText.focus();

    // Update cognitive load bar (effort)
    cognitiveFill.style.width = Math.min(100, parseInt(cognitiveFill.style.width) + 10) + '%';
}

// ---- RENDER LEVEL ----
function renderLevel(index) {
    if (index >= quickScenarios.length) {
        feedbackDiv.className = 'feedback-message success';
        feedbackDiv.style.display = 'block';
        feedbackDiv.innerHTML = '🎉 You completed all 55 levels! Your intuition is razor-sharp! Redirecting...';
        submitBtn.disabled = true;
        submitBtn.textContent = '🏆 Master!';
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 3000);
        return;
    }

    currentScenario = quickScenarios[index];
    levelDisplay.textContent = `Level ${index + 1} of ${quickScenarios.length}`;

    // Reset UI
    choicePhase.style.display = 'block';
    explanationPhase.style.display = 'none';
    feedbackDiv.style.display = 'none';
    feedbackDiv.className = 'feedback-message';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Reasoning';
    reasonText.value = '';

    // Set scenario and options
    scenarioText.textContent = currentScenario.text;
    btnA.innerHTML = `<i class="fas fa-check-circle"></i> ${currentScenario.optionA}`;
    btnB.innerHTML = `<i class="fas fa-check-circle"></i> ${currentScenario.optionB}`;

    // Reset stats
    wpmDisplay.textContent = '--';
    pasteDisplay.textContent = '--';
    ttrDisplay.textContent = '--';
    verdictDisplay.textContent = 'Waiting...';
    verdictDisplay.className = '';
    cognitiveFill.style.width = '75%';
    cognitiveStatus.textContent = 'Optimal';
    document.getElementById('timerDisplay').classList.remove('warning');

    // Remove old input listener
    if (window._quickInputListener) {
        reasonText.removeEventListener('input', window._quickInputListener);
        window._quickInputListener = null;
    }

     if (document.referrer.includes('dashboard.html') && !overlayShown) {
        showHowToOverlay();
    }
}

// ---- SHOW HOW-TO OVERLAY (first time, or after each level) ----
function showHowToOverlay() {
    const overlay = document.getElementById('how-to-overlay');
    if (!overlay) return;

    // Show overlay
    overlay.style.display = 'flex';
    overlayShown = true;

    // Remove any previous event listeners to avoid duplicates
    const startBtn = document.getElementById('start-game-btn');
    const closeOverlay = () => {
        overlay.style.display = 'none';
        // Now start the timer
        startTimer();
    };

    // Click on overlay background closes it
    overlay.onclick = function(e) {
        // Only close if click is on the background, not on the inner card
        if (e.target === overlay) {
            closeOverlay();
        }
    };

    // Click on the "Start Now" button closes it
    startBtn.onclick = function(e) {
        e.stopPropagation(); // prevent triggering overlay click
        closeOverlay();
    };
}

// ---- HANDLE CHOICE BUTTONS ----
btnA.addEventListener('click', () => {
    if (choiceMade) return;
    clearInterval(timerInterval);
    userChoice = currentScenario.optionA;
    timeTaken = 10 - timeLeft;
    moveToExplanation(`You chose: "${userChoice}". Why did your gut tell you to pick this?`);
});

btnB.addEventListener('click', () => {
    if (choiceMade) return;
    clearInterval(timerInterval);
    userChoice = currentScenario.optionB;
    timeTaken = 10 - timeLeft;
    moveToExplanation(`You chose: "${userChoice}". Why did your gut tell you to pick this?`);
});

// ---- SUBMIT REASONING ----
document.getElementById('quickForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    if (!choiceMade) return;

    const reason = reasonText.value.trim();

    const reEnable = () => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Reasoning';
    };

    // Validate: at least 10 words
    const wordCount = reason.match(/\b\w+\b/g) || [];
    if (wordCount.length < 10) {
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = 'Please write a more detailed reasoning (at least 10 words).';
        showNotification('✏️ Please write at least 10 words.', 'error');
        reEnable();
        return;
    }

    // Run DetectifyAI
    if (typeof runDetectifyCheck !== 'function') {
        showNotification('DetectifyAI engine not loaded. Please refresh.', 'error');
        reEnable();
        return;
    }
    const result = runDetectifyCheck(reason);

    wpmDisplay.textContent = result.wpm;
    pasteDisplay.textContent = result.pasteRatio + '%';
    ttrDisplay.textContent = result.ttr.toFixed(2);

    if (!result.isHuman) {
        verdictDisplay.textContent = '🚫 Flagged (' + result.reason + ')';
        verdictDisplay.className = 'flagged';
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = result.message + ' Please try again with your own reasoning.';
        showNotification('🚫 ' + result.message + ' Please try again.', 'error');
        reasonText.value = '';
        if (typeof startDetectifyTimer === 'function') startDetectifyTimer();
        updateDetectifyStats();
        reEnable();
        return;
    }

     // ---- QUICK CALL SPECIFIC CHECK: does reasoning mention the chosen option? ----
    const chosenOption = userChoice; // e.g., "Fire 10%" or "Cut Pay 15%"
    const mentioned = reason.toLowerCase().includes(chosenOption.toLowerCase());

    // XP logic: +2 if mentioned, else -1
    const xpEarned = mentioned ? 2 : -1;

    // Human verified – save to Firebase

    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not logged in');

        await addDoc(collection(db, 'submissions'), {
            userId: user.uid,
            gameId: 'quick-call',
            levelIndex: currentLevelIndex,
            scenarioId: currentScenario.id,
            scenarioText: currentScenario.text,
            optionA: currentScenario.optionA,
            optionB: currentScenario.optionB,
            decisionMade: userChoice,
            timeToDecide: timeTaken,
            payload: reason,
            durationSeconds: result.duration,
            wpm: result.wpm,
            pasteRatio: result.pasteRatio,
            ttr: result.ttr,
            xpAwarded: xpEarned,
            timestamp: serverTimestamp()
        });

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            xp: increment(xpEarned),
            quickCallLevel: currentLevelIndex + 1
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

    verdictDisplay.textContent = '✅ Human';
    verdictDisplay.className = '';
    feedbackDiv.className = 'feedback-message success';
    feedbackDiv.style.display = 'block';

    let feedbackMessage = '';
    let notifType = 'success';
    if (mentioned) {
        feedbackMessage = `✅ Reasoning matches your choice! +${xpEarned} XP. 🔥 Streak: ${userStreak} days! Your intuition is sharp! ⚡`;
        notifType = 'success';
    } else {
        feedbackMessage = `❌ Your reasoning didn't mention "${chosenOption}". ${xpEarned} XP. 🔥 Streak: ${userStreak} days. Next time, explain why you chose that option! 💡`;
        notifType = 'error';
    }
    feedbackDiv.innerHTML = feedbackMessage;

    const plainMessage = feedbackMessage.replace(/<[^>]*>/g, '');
    showNotification(plainMessage, notifType);

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
    clearInterval(timerInterval);
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
            const savedLevel = data.quickCallLevel || 0;
            if (savedLevel >= quickScenarios.length) {
                feedbackDiv.className = 'feedback-message success';
                feedbackDiv.style.display = 'block';
                feedbackDiv.innerHTML = `✅ Quick thinking! +${xpEarned} XP. 🔥 Streak: ${userStreak} days! 🏆 You have mastered all 55 levels! Amazing work!`;
                submitBtn.disabled = true;
                submitBtn.textContent = '🌟 Master';
                choicePhase.style.display = 'none';
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
reasonText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        document.getElementById('quickForm').dispatchEvent(new Event('submit'));
    }
});