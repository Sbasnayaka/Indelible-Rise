// js/auth.js
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const signupForm = document.getElementById('signup-form');
const errorDiv = document.getElementById('error-message');
const successDiv = document.getElementById('success-message');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Hide previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validation
    if (!name || !email || !password) {
        errorDiv.textContent = 'Please fill all fields.';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match.';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters.';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update profile with display name
        await updateProfile(user, { displayName: name });
        
        // Create user document in Firestore (users collection)
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            displayName: name,
            createdAt: serverTimestamp(),
            xp: 0,
            streak: 0,
            lastPlayedDate: null
        });
        
        // Show success and redirect to dashboard after short delay
        successDiv.textContent = 'Account created successfully! Redirecting...';
        successDiv.style.display = 'block';
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error("Signup error:", error);
        let message = 'Signup failed. ';
        switch (error.code) {
            case 'auth/email-already-in-use':
                message += 'Email already registered. Log in instead.';
                break;
            case 'auth/invalid-email':
                message += 'Invalid email format.';
                break;
            case 'auth/weak-password':
                message += 'Password too weak. Use at least 6 characters.';
                break;
            default:
                message += error.message;
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
});