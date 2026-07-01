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

    // Open modal
    btn.addEventListener("click", () => {
        modal.style.display = "block";
        loadUserProgress();
    });

    // Close modal
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Close on outside click
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
});

async function loadUserProgress() {
    const contentDiv = document.getElementById("progress-content");
    if (!contentDiv) return;

    // Wait for auth state
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            contentDiv.innerHTML = `<p style="color: #FF6B6B;">Please log in to view your progress.</p>`;
            return;
        }

        try {
            // Query all submissions for this user
            const submissionsRef = collection(db, "submissions");
            const q = query(submissionsRef, where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                contentDiv.innerHTML = `<p style="color: #ccc;">You haven't played any games yet. Start playing to see your skills improve!</p>`;
                return;
            }

            // Skill trackers
            const skills = {
                logic: { name: "Logical Reasoning 🧩", plays: 0, xp: 0 },
                creativity: { name: "Creativity & Language 💡", plays: 0, xp: 0 },
                memory: { name: "Memory & Fast Thinking ⚡", plays: 0, xp: 0 }
            };

            // Categorise games
            snapshot.forEach(doc => {
                const data = doc.data();
                const gameId = data.gameId;
                const earnedXP = data.xpAwarded || 0;

                if (gameId === "claim-detective" || gameId === "logic-loom") {
                    skills.logic.plays += 1;
                    skills.logic.xp += earnedXP;
                } else if (gameId === "mashup-studio" || gameId === "tone-mixer") {
                    skills.creativity.plays += 1;
                    skills.creativity.xp += earnedXP;
                } else if (gameId === "memory-market" || gameId === "quick-call") {
                    skills.memory.plays += 1;
                    skills.memory.xp += earnedXP;
                }
            });

            // Build the HTML
            let html = "";
            for (const key in skills) {
                const skill = skills[key];
                const level = Math.max(1, Math.floor(skill.xp / 100) + 1);
                const status = skill.plays > 0 ? "📈 Improving" : "⏳ Needs Practice";
                // color based on XP
                const barColor = skill.xp > 50 ? "#39FF14" : skill.xp > 20 ? "#FFD700" : "#FF6B6B";

                html += `
                    <div style="background: rgba(20,40,20,0.6); padding: 16px; margin-bottom: 14px; border-radius: 16px; border-left: 4px solid ${barColor}; backdrop-filter: blur(2px);">
                        <h3 style="margin: 0 0 6px 0; color: #fff; font-size: 1.2rem;">${skill.name}</h3>
                        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                            <span><strong>Status:</strong> ${status}</span>
                            <span><strong>Level:</strong> ${level}</span>
                            <span><strong>⭐ XP:</strong> ${skill.xp}</span>
                        </div>
                        <div style="margin-top: 8px; background: #1a2a1a; border-radius: 8px; height: 8px; width: 100%; overflow: hidden;">
                            <div style="width: ${Math.min(100, skill.xp)}%; height: 100%; background: ${barColor}; border-radius: 8px; transition: width 0.6s;"></div>
                        </div>
                        <div style="margin-top: 4px; font-size: 0.8rem; color: #aaa;">Games completed: ${skill.plays}</div>
                    </div>
                `;
            }

            contentDiv.innerHTML = html;

        } catch (error) {
            console.error("Error loading progress:", error);
            contentDiv.innerHTML = `<p style="color: #FF6B6B;">Error loading progress. Please refresh and try again.</p>`;
        }
    });
}