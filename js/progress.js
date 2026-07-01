// js/progress.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("progress-modal");
    const btn = document.getElementById("view-progress-btn");
    const closeBtn = document.getElementById("close-modal");

    if (!modal || !btn || !closeBtn) {
        console.warn("Progress modal elements not found.");
        return;
    }

    btn.addEventListener("click", () => {
        modal.style.display = "block";
    document.body.style.overflow = "hidden";
        loadUserProgress();
    });

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    document.body.style.overflow = "";
    });

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        document.body.style.overflow = "";
        }
    });
});

// Helper: compute average of an array
function avg(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Helper: format a date from Firestore timestamp
function formatDate(timestamp) {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function loadUserProgress() {
    const contentDiv = document.getElementById("progress-content");
    if (!contentDiv) return;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            contentDiv.innerHTML = `<p style="color: #FF6B6B;">Please log in to view your progress.</p>`;
            return;
        }

        try {
            const submissionsRef = collection(db, "submissions");
            const q = query(submissionsRef, where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                contentDiv.innerHTML = `<p style="color: #ccc;">You haven't played any games yet. Start playing to see your skills improve!</p>`;
                return;
            }

            // Group submissions by gameId
            const gamesData = {};

            snapshot.forEach(doc => {
                const data = doc.data();
                const gameId = data.gameId || "unknown";
                if (!gamesData[gameId]) {
                    gamesData[gameId] = {
                        plays: 0,
                        xpTotal: 0,
                        wpmList: [],
                        ttrList: [],
                        pasteList: [],
                        dates: [],
                        firstDate: null,
                        lastDate: null,
                    };
                }
                const g = gamesData[gameId];
                g.plays += 1;
                g.xpTotal += data.xpAwarded || 0;
                if (data.wpm) g.wpmList.push(data.wpm);
                if (data.ttr) g.ttrList.push(data.ttr);
                if (data.pasteRatio) g.pasteList.push(data.pasteRatio);
                if (data.timestamp) {
                    const d = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                    g.dates.push(d);
                    if (!g.firstDate || d < g.firstDate) g.firstDate = d;
                    if (!g.lastDate || d > g.lastDate) g.lastDate = d;
                }
            });

            // Define display names and icons for each game
            const gameMeta = {
                'claim-detective': { name: 'Claim Detective', icon: 'fa-search' },
                'logic-loom': { name: 'Logic Loom', icon: 'fa-brain' },
                'mashup-studio': { name: 'Mashup Studio', icon: 'fa-lightbulb' },
                'tone-mixer': { name: 'Tone Mixer', icon: 'fa-sliders-h' },
                'memory-market': { name: 'Memory Market', icon: 'fa-database' },
                'quick-call': { name: 'Quick Call', icon: 'fa-bolt' }
            };

            // Build the HTML
            let html = `<div>`;

            for (const [gameId, g] of Object.entries(gamesData)) {
                const meta = gameMeta[gameId] || { name: gameId, icon: 'fa-gamepad' };
                const avgWPM = avg(g.wpmList).toFixed(1);
                const avgTTR = avg(g.ttrList).toFixed(2);
                const avgPaste = avg(g.pasteList).toFixed(1);
                const startDate = formatDate(g.firstDate);
                const lastDate = formatDate(g.lastDate);

                // Determine improvement: compare first 3 vs last 3 WPM
                let trend = '—';
                if (g.wpmList.length >= 2) {
                    const first = g.wpmList.slice(0, Math.min(3, g.wpmList.length));
                    const last = g.wpmList.slice(-Math.min(3, g.wpmList.length));
                    const avgFirst = avg(first);
                    const avgLast = avg(last);
                    if (avgLast > avgFirst * 1.05) trend = '📈 Improving';
                    else if (avgLast < avgFirst * 0.95) trend = '📉 Needs Focus';
                    else trend = '➡️ Steady';
                }

                html += `
                    <div style="background: rgba(20,40,20,0.7); padding: 16px; margin-bottom: 16px; border-radius: 16px; border-left: 4px solid #39FF14; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <i class="fas ${meta.icon}" style="color: #39FF14; font-size: 1.6rem;"></i>
                            <h3 style="margin: 0; color: #fff; font-size: 1.3rem;">${meta.name}</h3>
                            <span style="margin-left: auto; background: #2a4a2a; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; color: #ccc;">${g.plays} plays</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; font-size: 0.9rem; color: #ddd;">
                            <div><strong>⭐ XP</strong> ${g.xpTotal}</div>
                            <div><strong>⚡ Avg WPM</strong> ${avgWPM}</div>
                            <div><strong>📊 Avg TTR</strong> ${avgTTR}</div>
                            <div><strong>📋 Avg Paste</strong> ${avgPaste}%</div>
                            <div><strong>📅 Started</strong> ${startDate}</div>
                            <div><strong>🕒 Last</strong> ${lastDate}</div>
                            <div><strong>📈 Trend</strong> ${trend}</div>
                        </div>
                        <!-- Mini progress bar for WPM improvement (optional) -->
                        <div style="margin-top: 10px; background: #1a2a1a; border-radius: 6px; height: 6px; width: 100%; overflow: hidden;">
                            <div style="width: ${Math.min(100, (avgWPM / 60) * 100)}%; height: 100%; background: #39FF14; border-radius: 6px;"></div>
                        </div>
                        <div style="margin-top: 4px; font-size: 0.7rem; color: #888;">WPM progress (relative)</div>
                    </div>
                `;
            }

            html += `</div>`;
            contentDiv.innerHTML = html;

        } catch (error) {
            console.error("Error loading progress:", error);
            contentDiv.innerHTML = `<p style="color: #FF6B6B;">Error loading progress. Please refresh and try again.</p>`;
        }
    });
}