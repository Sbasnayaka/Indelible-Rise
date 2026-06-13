// ===== MOBILE MENU TOGGLE - WORKING VERSION =====
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

// ===== SCROLL ANIMATION FOR DETECTIFY SECTION =====
function animateOnScroll() {
    const section = document.querySelector('.detectify-section');
    if (!section) return;
    
    const rect = section.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight - 100 && rect.bottom > 100;
    
    if (isVisible && !section.classList.contains('animated')) {
        section.classList.add('animated');
    }
}

// Run on scroll and on load
window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', animateOnScroll);