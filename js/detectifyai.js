// js/detectifyai.js
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ---- ANIMATE PROGRESS BARS ON LOAD ----
document.addEventListener('DOMContentLoaded', () => {
    // Get all progress fills
    const progressBars = document.querySelectorAll('.progress-fill');
    
    // Animate each one with a slight delay
    progressBars.forEach((bar, index) => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.transition = 'width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            bar.style.width = targetWidth;
        }, 200 + index * 300);
    });
});

// ---- AUTH CHECK: Redirect to login if not authenticated ----
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Allow public access to this info page, but if you want to protect it:
        // window.location.href = 'login.html';
    }
});