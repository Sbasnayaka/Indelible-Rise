// js/notification.js – Custom notification system

/**
 * Show a custom notification popup
 * @param {string} message - The message to display
 * @param {string} type - 'success' (green) or 'error' (red)
 * @param {number} duration - Auto-close delay in ms (0 = never auto-close)
 */
export function showNotification(message, type = 'info', duration = 3500) {
    const notif = document.getElementById('custom-notification');
    const msgEl = document.getElementById('notification-message');
    const closeBtn = notif.querySelector('.notification-close');

    if (!notif || !msgEl) {
        console.warn('Notification elements not found');
        return;
    }

    // Remove previous classes
    notif.classList.remove('success', 'error', 'show');

    // Set message and type
    msgEl.textContent = message;
    if (type === 'success') {
        notif.classList.add('success');
    } else if (type === 'error') {
        notif.classList.add('error');
    }

    // Show the notification
    notif.classList.add('show');

    // Auto-close timer
    let timer = null;
    if (duration > 0) {
        timer = setTimeout(() => {
            hideNotification();
        }, duration);
    }

    // Close on button click
    closeBtn.onclick = function() {
        clearTimeout(timer);
        hideNotification();
    };

    // Also close on click outside the content (optional)
    notif.addEventListener('click', function(e) {
        if (e.target === notif) {
            clearTimeout(timer);
            hideNotification();
        }
    });
}

function hideNotification() {
    const notif = document.getElementById('custom-notification');
    if (notif) {
        notif.classList.remove('show');
        // Remove glow classes after animation ends
        setTimeout(() => {
            notif.classList.remove('success', 'error');
        }, 5000);
    }
}

// Make it globally available if needed (for non-module scripts)
window.showNotification = showNotification;