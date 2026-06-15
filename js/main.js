
// ===== MOBILE MENU TOGGLE =====
document.addEventListener('DOMContentLoaded', function() {
    var menuBtn = document.querySelector('.mobile-menu-btn');
    var navLinks = document.querySelector('.nav-links');
    
    var isOpen = false;
    
    menuBtn.onclick = function(e) {
        e.stopPropagation();
        
        if (!isOpen) {
            // Open menu
            navLinks.style.display = 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '70px';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.backgroundColor = '#002911';
            navLinks.style.padding = '1rem 0';
            navLinks.style.zIndex = '1000';
            navLinks.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
            menuBtn.innerHTML = '<i class="fas fa-times"></i>';
            isOpen = true;
        } else {
            // Close menu
            navLinks.style.display = '';
            menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            isOpen = false;
        }
    };
    
    // Click outside to close
    document.onclick = function(e) {
        if (isOpen && !navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
            navLinks.style.display = '';
            menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            isOpen = false;
        }
    };
});


// Use Intersection Observer for smooth fade-in when elements come into view
const fadeElements = document.querySelectorAll('.hero-title-card, .hero-description-card, .left-quote-card, .right-main-card, .detectify-showcase');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

fadeElements.forEach(el => {
    el.classList.add('fade-in-hidden');
    observer.observe(el);
});
