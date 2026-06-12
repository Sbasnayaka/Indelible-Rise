// js/index.js
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Get logout button
const logoutBtn = document.getElementById('logout-btn');

// Optional: check if user is logged in, if not redirect to login (uncomment if home should be protected)
// onAuthStateChanged(auth, (user) => {
//     if (!user) {
//         window.location.href = 'login.html';
//     }
// });

// Handle logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error logging out. Please try again.');
        }
    });
}

// Mobile menu toggle (simple)
const menuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        if (navLinks) {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '80px';
            navLinks.style.right = '20px';
            navLinks.style.background = '#002911';
            navLinks.style.padding = '1rem';
            navLinks.style.borderRadius = '20px';
            navLinks.style.zIndex = '100';
        }
    });
}