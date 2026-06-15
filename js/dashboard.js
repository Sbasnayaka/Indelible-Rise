// js/dashboard.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const welcomeHeading = document.getElementById('welcomeMessage');
const subMessage = document.getElementById('subMessage');
const xpElement = document.getElementById('xpValue');
const streakElement = document.getElementById('streakValue');

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const displayName = user.displayName || 'Player';
    // Wrap the second line in a span for gradient styling
    welcomeHeading.innerHTML = `Welcome back, <span class="player-name">${displayName}</span> !!!<br><span class="ready-gradient">Ready to level up ?</span>`;
    subMessage.textContent = 'Your cognitive vitality is growing...';

    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const xp = userData.xp || 0;
            const streak = userData.streak || 0;
            xpElement.textContent = xp.toLocaleString();
            streakElement.textContent = `${streak} Days`;
        } else {
            xpElement.textContent = '0';
            streakElement.textContent = '0 Days';
        }
    } catch (error) {
        console.error('Error fetching user stats:', error);
        xpElement.textContent = '—';
        streakElement.textContent = '—';
    }
});