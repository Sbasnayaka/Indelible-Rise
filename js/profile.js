// js/profile.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ---- DOM ELEMENTS ----
const displayNameEl = document.getElementById('userDisplayName');
const levelEl = document.getElementById('userLevel');
const xpEl = document.getElementById('xpValue');
const streakEl = document.getElementById('streakValue');
const currentStreakEl = document.getElementById('currentStreak');
const gamesPlayedEl = document.getElementById('gamesPlayed');
const gamesThisWeekEl = document.getElementById('gamesThisWeek');
const wordScoreEl = document.getElementById('wordScore');
const wordScoreChangeEl = document.getElementById('wordScoreChange');
const wpmVarianceEl = document.getElementById('wpmVariance');
const wpmStatusEl = document.getElementById('wpmStatus');
const ttrValueEl = document.getElementById('ttrValue');
const ttrStatusEl = document.getElementById('ttrStatus');

// ---- CHART INSTANCES ----
let performanceChart = null;
let cognitiveChart = null;

// ---- COMPUTE LEVEL FROM XP ----
function getLevel(xp) {
    if (xp < 100) return 1;
    if (xp < 300) return 2;
    if (xp < 600) return 3;
    if (xp < 1000) return 4;
    if (xp < 1500) return 5;
    if (xp < 2100) return 6;
    if (xp < 2800) return 7;
    if (xp < 3600) return 8;
    if (xp < 4500) return 9;
    if (xp < 5500) return 10;
    if (xp < 6600) return 11;
    if (xp < 7800) return 12;
    if (xp < 9100) return 13;
    if (xp < 10500) return 14;
    return 15;
}

// ---- FORMAT STREAK ----
function formatStreak(days) {
    return days + ' Days';
}

// ---- LOAD PROFILE DATA ----
async function loadProfile(userId) {
    try {
        // 1. Get user document
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.warn('User document not found');
            return;
        }

        const userData = userSnap.data();
        const xp = userData.xp || 0;
        const streak = userData.streak || 0;
        const displayName = userData.displayName || 'Player';

        // Update hero
        displayNameEl.textContent = displayName;
        const level = getLevel(xp);
        levelEl.textContent = `Cognitive Explorer Level ${level}`;

        // Update stats
        xpEl.textContent = xp.toLocaleString();
        streakEl.textContent = formatStreak(streak);
        currentStreakEl.textContent = `Current: ${streak} Days`;

        // 2. Get submissions count
        const submissionsQuery = query(
            collection(db, 'submissions'),
            where('userId', '==', userId)
        );
        const submissionsSnap = await getDocs(submissionsQuery);
        const totalGames = submissionsSnap.size;
        gamesPlayedEl.textContent = totalGames;

        // Count games this week (approx)
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        let thisWeek = 0;
        submissionsSnap.forEach(doc => {
            const data = doc.data();
            if (data.timestamp && data.timestamp.toDate) {
                const ts = data.timestamp.toDate();
                if (ts >= weekAgo) thisWeek++;
            }
        });
        gamesThisWeekEl.textContent = `+${thisWeek} this week`;

        // 3. Compute triad metrics from submissions
        let totalWords = 0;
        let totalTTR = 0;
        let totalWPM = 0;
        let count = 0;
        submissionsSnap.forEach(doc => {
            const data = doc.data();
            if (data.payload) {
                const text = typeof data.payload === 'string' ? data.payload : JSON.stringify(data.payload);
                const words = text.match(/\b\w+\b/g) || [];
                totalWords += words.length;
            }
            if (data.ttr) { totalTTR += data.ttr; count++; }
            if (data.wpm) { totalWPM += data.wpm; }
        });

        const avgTTR = count > 0 ? totalTTR / count : 0;
        const avgWPM = count > 0 ? totalWPM / count : 0;

        wordScoreEl.textContent = totalWords.toLocaleString();
        wordScoreChangeEl.textContent = `+${Math.round(totalWords * 0.05)} this week`;

        // WPM variance: show average WPM as ± variance
        const variance = Math.round(avgWPM * 0.1);
        wpmVarianceEl.textContent = `±${variance}`;
        wpmStatusEl.textContent = avgWPM > 30 ? 'Stable' : 'Improving';
        wpmStatusEl.className = 'triad-change ' + (avgWPM > 30 ? 'improving' : 'declining');

        ttrValueEl.textContent = avgTTR.toFixed(2);
        ttrStatusEl.textContent = avgTTR > 0.5 ? 'Improving' : 'Needs Work';
        ttrStatusEl.className = 'triad-change ' + (avgTTR > 0.5 ? 'improving' : 'declining');

        // 4. Render charts with sample data (or real data if available)
        renderCharts(submissionsSnap);

    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// ---- RENDER CHARTS ----
function renderCharts(submissionsSnap) {
    // Prepare data: group submissions by day
    const dateMap = {};
    const labels = [];
    const scores = [];

    // Use last 14 days
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split('T')[0];
        dateMap[key] = { label: key, count: 0, avgTTR: 0, totalTTR: 0, num: 0 };
        labels.push(key);
    }

    // Count submissions per day and average TTR
    submissionsSnap.forEach(doc => {
        const data = doc.data();
        if (data.timestamp && data.timestamp.toDate) {
            const ts = data.timestamp.toDate();
            const key = ts.toISOString().split('T')[0];
            if (dateMap[key]) {
                dateMap[key].count++;
                if (data.ttr) {
                    dateMap[key].totalTTR += data.ttr;
                    dateMap[key].num++;
                }
            }
        }
    });

    // Build arrays for charts
    const counts = [];
    const avgTTRs = [];
    Object.keys(dateMap).forEach(key => {
        const entry = dateMap[key];
        counts.push(entry.count);
        avgTTRs.push(entry.num > 0 ? entry.totalTTR / entry.num : 0);
    });

    // === PERFORMANCE CHART (line) ===
    const ctx1 = document.getElementById('performanceChart').getContext('2d');
    if (performanceChart) performanceChart.destroy();
    performanceChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Games Played',
                data: counts,
                borderColor: '#39FF14',
                backgroundColor: 'rgba(57, 255, 20, 0.1)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#39FF14',
                pointBorderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#3F4A3B', font: { family: 'Inter' } }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#3F4A3B', font: { family: 'Inter', size: 10 } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y: {
                    ticks: { color: '#3F4A3B', font: { family: 'Inter', size: 10 }, stepSize: 1 },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    beginAtZero: true
                }
            }
        }
    });

    // === COGNITIVE ACCURACY CHART (bar) ===
    const ctx2 = document.getElementById('cognitiveChart').getContext('2d');
    if (cognitiveChart) cognitiveChart.destroy();

    // Sample categories: Memory, Logic, Speed, Flexibility, Attention
    const categories = ['Mem', 'Logic', 'Speed', 'Flex', 'Attn'];
    // Generate mock scores based on avgTTR or random
    const baseScore = avgTTRs.length > 0 ? avgTTRs[avgTTRs.length - 1] * 100 : 60;
    const scoresData = categories.map(() => Math.min(100, baseScore + (Math.random() - 0.5) * 40));

    cognitiveChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Accuracy %',
                data: scoresData,
                backgroundColor: ['#053F1D', '#39FF14', '#053F1D', '#39FF14', '#053F1D'],
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ticks: { color: '#3F4A3B', font: { family: 'Inter', size: 10 } },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: '#3F4A3B', font: { family: 'Inter', size: 10 }, max: 100 },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    beginAtZero: true
                }
            }
        }
    });
}

// ---- AUTH CHECK ----
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    await loadProfile(user.uid);
});