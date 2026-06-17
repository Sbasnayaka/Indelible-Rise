// js/logic-loom.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ---- 55 LOGIC PUZZLES ----
const logicPuzzles = [
    // Each puzzle: 3 facts that need to be connected logically
    { id: 'puzzle_1', facts: ['The factory upstream released chemicals last week.', 'The city\'s water supply is contaminated.', 'Residents are reporting sudden illnesses.'] },
    { id: 'puzzle_2', facts: ['Social media algorithms prioritize engaging content.', 'Anger and outrage drive the highest user engagement.', 'Political polarization has increased significantly.'] },
    { id: 'puzzle_3', facts: ['Students are relying heavily on AI to write essays.', 'Cognitive offloading causes memory and logic skills to fade.', 'Independent thinking requires mental effort and practice.'] },
    { id: 'puzzle_4', facts: ['The company cut its R&D budget.', 'Competitors are releasing innovative products.', 'The company\'s market share is declining.'] },
    { id: 'puzzle_5', facts: ['The city has built more bike lanes.', 'Bicycle usage has increased 40% in the last year.', 'Traffic congestion has decreased by 15%.'] },
    { id: 'puzzle_6', facts: ['Smoking rates have dropped 30% in the last decade.', 'Lung cancer diagnoses have fallen.', 'Public health campaigns on smoking have expanded.'] },
    { id: 'puzzle_7', facts: ['Online shopping is more convenient than in-store.', 'More consumers are shopping online.', 'Traditional retail stores are closing.'] },
    { id: 'puzzle_8', facts: ['The government raised the minimum wage.', 'Low-income workers have more disposable income.', 'Local businesses report higher sales.'] },
    { id: 'puzzle_9', facts: ['Schools are incorporating more technology.', 'Students are more engaged with interactive content.', 'Test scores have improved modestly.'] },
    { id: 'puzzle_10', facts: ['Deforestation rates have increased in the Amazon.', 'Rainfall patterns are becoming more extreme.', 'The region\'s biodiversity is declining.'] },
    { id: 'puzzle_11', facts: ['The company invested in employee wellness programs.', 'Employee turnover has decreased.', 'Productivity metrics have improved.'] },
    { id: 'puzzle_12', facts: ['Electric car prices are dropping.', 'More consumers are considering EVs.', 'Public charging infrastructure is expanding.'] },
    { id: 'puzzle_13', facts: ['The city has invested in flood barriers.', 'Flood damage claims have decreased.', 'Extreme weather events are becoming more frequent.'] },
    { id: 'puzzle_14', facts: ['New teaching methods focus on critical thinking.', 'Students are solving problems more effectively.', 'Standardized test scores are rising.'] },
    { id: 'puzzle_15', facts: ['Healthcare costs have been rising steadily.', 'More people are choosing telemedicine.', 'Telemedicine clinics are opening across the country.'] },
    { id: 'puzzle_16', facts: ['The company adopted agile development.', 'Product release cycles are shorter.', 'Customer satisfaction scores are higher.'] },
    { id: 'puzzle_17', facts: ['Recycling programs have expanded.', 'Landfill waste has decreased.', 'Public awareness of environmental issues is growing.'] },
    { id: 'puzzle_18', facts: ['The university increased financial aid.', 'Student loan defaults have decreased.', 'Graduation rates have improved.'] },
    { id: 'puzzle_19', facts: ['The government invested in high-speed rail.', 'Intercity travel times are significantly shorter.', 'Passenger numbers are increasing.'] },
    { id: 'puzzle_20', facts: ['The restaurant added plant-based options.', 'Vegan customers are returning more often.', 'Monthly revenue has increased.'] },
    { id: 'puzzle_21', facts: ['The city installed more CCTV cameras.', 'Petty crime has decreased.', 'Residents report feeling safer.'] },
    { id: 'puzzle_22', facts: ['The software company released a free version.', 'User adoption is growing rapidly.', 'Paid subscriptions are also increasing.'] },
    { id: 'puzzle_23', facts: ['The government introduced energy efficiency standards.', 'Energy consumption has decreased.', 'Households are saving money on utilities.'] },
    { id: 'puzzle_24', facts: ['The bookstore opened a cafe.', 'Foot traffic has increased.', 'Book sales have risen.'] },
    { id: 'puzzle_25', facts: ['The company implemented remote work policies.', 'Employee satisfaction scores are up.', 'Office rental costs have decreased.'] },
    { id: 'puzzle_26', facts: ['The college launched an online degree program.', 'Enrollment numbers are increasing.', 'Graduate employment rates are high.'] },
    { id: 'puzzle_27', facts: ['The city planted more trees in urban areas.', 'Air quality has improved.', 'Summer temperatures are slightly lower.'] },
    { id: 'puzzle_28', facts: ['The supermarket started a loyalty program.', 'Customer retention has improved.', 'Average spending per visit is higher.'] },
    { id: 'puzzle_29', facts: ['The government funded after-school programs.', 'Juvenile crime rates have dropped.', 'High school graduation rates are up.'] },
    { id: 'puzzle_30', facts: ['The coffee shop switched to fair-trade beans.', 'Sales to ethically-conscious customers have grown.', 'The shop\'s reputation has improved.'] },
    { id: 'puzzle_31', facts: ['The city improved public transit frequency.', 'Car ownership rates have declined.', 'Commute times are shorter.'] },
    { id: 'puzzle_32', facts: ['The company introduced flexible working hours.', 'Employee absenteeism has decreased.', 'Productivity has remained stable.'] },
    { id: 'puzzle_33', facts: ['The gym added 24-hour access.', 'Membership numbers are increasing.', 'Retention rates have improved.'] },
    { id: 'puzzle_34', facts: ['The government raised tobacco taxes.', 'Smoking rates have declined.', 'Public health spending has decreased.'] },
    { id: 'puzzle_35', facts: ['The museum introduced interactive exhibits.', 'Visitor numbers have increased.', 'Membership renewals are up.'] },
    { id: 'puzzle_36', facts: ['The company reduced packaging waste.', 'Shipping costs have decreased.', 'Customer perception of the brand is more positive.'] },
    { id: 'puzzle_37', facts: ['The city built more parks.', 'Physical activity levels have increased.', 'Obesity rates have declined.'] },
    { id: 'puzzle_38', facts: ['The restaurant started a delivery service.', 'Orders have increased.', 'Revenue has grown despite higher costs.'] },
    { id: 'puzzle_39', facts: ['The government invested in renewable energy.', 'Electricity prices have stabilized.', 'Carbon emissions have fallen.'] },
    { id: 'puzzle_40', facts: ['The school introduced coding classes.', 'Student interest in technology careers has grown.', 'Tech companies are hiring more from the school.'] },
    { id: 'puzzle_41', facts: ['The bank launched a mobile banking app.', 'Customer complaints have decreased.', 'Transaction volumes are increasing.'] },
    { id: 'puzzle_42', facts: ['The city introduced a bike-sharing program.', 'Traffic congestion has eased.', 'Air quality has improved slightly.'] },
    { id: 'puzzle_43', facts: ['The company increased wages for frontline staff.', 'Employee morale has improved.', 'Customer service ratings are higher.'] },
    { id: 'puzzle_44', facts: ['The government provided subsidized childcare.', 'Parents are returning to work.', 'The labor force participation rate is rising.'] },
    { id: 'puzzle_45', facts: ['The hospital implemented electronic health records.', 'Patient record errors have decreased.', 'Treatment coordination is smoother.'] },
    { id: 'puzzle_46', facts: ['The city improved street lighting.', 'Nighttime crime has decreased.', 'Residents feel safer walking at night.'] },
    { id: 'puzzle_47', facts: ['The subscription box service added personalization.', 'Customer retention has improved.', 'Revenue per customer is higher.'] },
    { id: 'puzzle_48', facts: ['The government built more public housing.', 'Homelessness has decreased.', 'Property values in the area have stabilized.'] },
    { id: 'puzzle_49', facts: ['The gym introduced group fitness classes.', 'Attendance has increased.', 'Membership churn has decreased.'] },
    { id: 'puzzle_50', facts: ['The company invested in cybersecurity.', 'Data breaches have decreased.', 'Customer trust has improved.'] },
    { id: 'puzzle_51', facts: ['The city implemented a food waste recycling program.', 'Landfill use has decreased.', 'Residents are more environmentally conscious.'] },
    { id: 'puzzle_52', facts: ['The university established a entrepreneurship center.', 'Student startups have increased.', 'Local funding for new businesses is growing.'] },
    { id: 'puzzle_53', facts: ['The company adopted a four-day workweek.', 'Employee burnout has decreased.', 'Productivity per hour has improved.'] },
    { id: 'puzzle_54', facts: ['The city introduced a free Wi-Fi network.', 'Digital access has improved.', 'Small businesses are reporting more customers.'] },
    { id: 'puzzle_55', facts: ['The government funded vocational training.', 'Skills gaps are narrowing.', 'Employment rates are rising.'] }
];

// ---- STATE ----
let currentLevelIndex = 0;
let userXP = 0;

// ---- DOM ELEMENTS ----
const factsList = document.getElementById('scatteredFactsList');
const step1Input = document.getElementById('step-1');
const step2Input = document.getElementById('step-2');
const step3Input = document.getElementById('step-3');
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
    const s1 = step1Input.value.trim();
    const s2 = step2Input.value.trim();
    const s3 = step3Input.value.trim();
    return s1 + " " + s2 + " " + s3;
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

// ---- SHUFFLE FACTS ----
function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// ---- RENDER LEVEL ----
function renderLevel(index) {
    if (index >= logicPuzzles.length) {
        feedbackDiv.className = 'feedback-message success';
        feedbackDiv.style.display = 'block';
        feedbackDiv.innerHTML = '🎉 You completed all 55 puzzles! Your logical reasoning is razor-sharp! Redirecting...';
        submitBtn.disabled = true;
        submitBtn.textContent = '🏆 Master!';
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 3000);
        return;
    }

    const puzzle = logicPuzzles[index];
    levelDisplay.textContent = `Level ${index + 1} of ${logicPuzzles.length}`;

    // Display shuffled facts
    const shuffled = shuffleArray(puzzle.facts);
    factsList.innerHTML = '';
    shuffled.forEach(fact => {
        const li = document.createElement('li');
        li.textContent = fact;
        factsList.appendChild(li);
    });

    // Clear feedback
    feedbackDiv.style.display = 'none';
    feedbackDiv.className = 'feedback-message';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Argument';

    // Reset DetectifyAI
    if (typeof startDetectifyTimer === 'function') {
        startDetectifyTimer();
    }
    if (typeof setupPasteListener === 'function') {
        setupPasteListener('step-1');
        setupPasteListener('step-2');
        setupPasteListener('step-3');
    }

    // Clear all inputs and reset stats
    step1Input.value = '';
    step2Input.value = '';
    step3Input.value = '';
    wpmDisplay.textContent = '--';
    pasteDisplay.textContent = '--';
    ttrDisplay.textContent = '--';
    verdictDisplay.textContent = 'Waiting...';
    verdictDisplay.className = '';
    cognitiveFill.style.width = '75%';
    cognitiveStatus.textContent = 'Optimal';

    // Remove previous input listener and attach new one
    if (window._logicInputListener) {
        step1Input.removeEventListener('input', window._logicInputListener);
        step2Input.removeEventListener('input', window._logicInputListener);
        step3Input.removeEventListener('input', window._logicInputListener);
    }
    const listener = function() {
        updateDetectifyStats();
    };
    step1Input.addEventListener('input', listener);
    step2Input.addEventListener('input', listener);
    step3Input.addEventListener('input', listener);
    window._logicInputListener = listener;
}

// ---- SUBMIT LOGIC ----
submitBtn.addEventListener('click', async () => {
    if (currentLevelIndex >= logicPuzzles.length) return;

    const step1 = step1Input.value.trim();
    const step2 = step2Input.value.trim();
    const step3 = step3Input.value.trim();

    // 1. Validate all fields are filled
    if (!step1 || !step2 || !step3) {
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = 'Please fill in all three steps to build your argument.';
        return;
    }

    // 2. Validate minimum length per step (at least 5 words each)
    const words1 = step1.match(/\b\w+\b/g) || [];
    const words2 = step2.match(/\b\w+\b/g) || [];
    const words3 = step3.match(/\b\w+\b/g) || [];

    if (words1.length < 5 || words2.length < 5 || words3.length < 5) {
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = 'Each step needs at least 5 words. Build a proper argument! 🧠';
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
        feedbackDiv.textContent = result.message + ' Please try again with your own logical reasoning.';
        step1Input.value = '';
        step2Input.value = '';
        step3Input.value = '';
        if (typeof startDetectifyTimer === 'function') startDetectifyTimer();
        updateDetectifyStats();
        return;
    }

    // 6. Human verified! Save to Firebase
    const xpEarned = 5;
    const puzzle = logicPuzzles[currentLevelIndex];

    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not logged in');

        // Save submission
        await addDoc(collection(db, 'submissions'), {
            userId: user.uid,
            gameId: 'logic-loom',
            levelIndex: currentLevelIndex,
            puzzleId: puzzle.id,
            puzzleFacts: puzzle.facts,
            payload: {
                step1: step1,
                step2: step2,
                step3: step3
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
            logicLoomLevel: currentLevelIndex + 1
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
    feedbackDiv.innerHTML = `✅ Solid reasoning! +${xpEarned} XP. Your logic is getting stronger! 🔗`;

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
            const savedLevel = data.logicLoomLevel || 0;
            if (savedLevel >= logicPuzzles.length) {
                feedbackDiv.className = 'feedback-message success';
                feedbackDiv.style.display = 'block';
                feedbackDiv.innerHTML = '🏆 You have mastered all 55 puzzles! Amazing work!';
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
const allInputs = [step1Input, step2Input, step3Input];
allInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            submitBtn.click();
        }
    });
});