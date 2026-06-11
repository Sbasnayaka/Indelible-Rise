// js/login.js
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// DOM elements
const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const errorDiv = document.getElementById('login-error');
const forgotLink = document.getElementById('forgot-password');

// Password visibility toggle
const toggleBtn = document.getElementById('toggle-password');
const eyeIcon = document.getElementById('eye-icon');

toggleBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    // Toggle icon
    if (type === 'text') {
        eyeIcon.src = 'assets/icon/eye-open.png';
    } else {
        eyeIcon.src = 'assets/icon/eye-close.png';
    }
});

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // Already logged in – redirect to dashboard
        window.location.href = 'dashboard.html';
    }
});

// Handle login submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    errorDiv.style.display = 'none';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        errorDiv.textContent = 'Please enter both email and password.';
        errorDiv.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Success – redirect will happen automatically via onAuthStateChanged
        // But we can also redirect manually:
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        let message = 'Login failed. ';
        switch (error.code) {
            case 'auth/user-not-found':
                message += 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                message += 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                message += 'Invalid email format.';
                break;
            case 'auth/too-many-requests':
                message += 'Too many failed attempts. Try again later.';
                break;
            default:
                message += error.message;
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});

// Forgot password handler
forgotLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
        errorDiv.textContent = 'Please enter your email address first.';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        alert(`Password reset email sent to ${email}. Check your inbox.`);
    } catch (error) {
        console.error('Reset error:', error);
        let msg = 'Unable to send reset email. ';
        if (error.code === 'auth/user-not-found') {
            msg += 'No account with this email.';
        } else {
            msg += error.message;
        }
        errorDiv.textContent = msg;
        errorDiv.style.display = 'block';
    }
});