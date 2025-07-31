/**
 * Main JavaScript file for K-Style Learning website
 * Handles navigation, mobile menu, and general UI interactions
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeNavigation();
    initializeMobileMenu();
    initializeScrollEffects();
    initializeAccessibility();
    
    console.log('K-Style Learning website initialized successfully');
});

/**
 * Initialize navigation functionality
 */
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Set active navigation link
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Handle dropdown navigation
    const dropdownToggles = document.querySelectorAll('.nav-dropdown');
    dropdownToggles.forEach(dropdown => {
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Handle keyboard navigation
        dropdown.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                dropdown.classList.toggle('active');
            }
            if (e.key === 'Escape') {
                dropdown.classList.remove('active');
            }
        });
    });
}

/**
 * Initialize mobile menu functionality
 */
function initializeMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const body = document.body;
    
    if (!navToggle || !navMenu) return;
    
    navToggle.addEventListener('click', () => {
        const isActive = navMenu.classList.contains('active');
        
        if (isActive) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });
    
    // Close mobile menu when clicking on links
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            closeMobileMenu();
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    function openMobileMenu() {
        navMenu.classList.add('active');
        navToggle.classList.add('active');
        body.style.overflow = 'hidden';
        navToggle.setAttribute('aria-expanded', 'true');
    }
    
    function closeMobileMenu() {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
        body.style.overflow = '';
        navToggle.setAttribute('aria-expanded', 'false');
    }
}

/**
 * Initialize scroll effects and animations
 */
function initializeScrollEffects() {
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Header scroll effect
    let lastScrollY = window.scrollY;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollY = currentScrollY;
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .quick-card, .path-step');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

/**
 * Initialize accessibility features
 */
function initializeAccessibility() {
    // Add skip link functionality
    addSkipLink();
    
    // Keyboard navigation for interactive elements
    const interactiveElements = document.querySelectorAll('.btn, .feature-card, .quick-card');
    interactiveElements.forEach(element => {
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                element.click();
            }
        });
    });
    
    // Focus management
    const focusableElements = document.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    
    // Trap focus in mobile menu when open
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && navMenu.classList.contains('active')) {
                const focusableInMenu = navMenu.querySelectorAll(
                    'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
                );
                const firstFocusable = focusableInMenu[0];
                const lastFocusable = focusableInMenu[focusableInMenu.length - 1];
                
                if (e.shiftKey && document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        });
    }
    
    function addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.setAttribute('tabindex', '1');
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add id to main content if it doesn't exist
        const mainContent = document.querySelector('.main');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }
}

/**
 * Utility functions
 */

// Debounce function for performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Local storage utilities
const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    },
    
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Failed to read from localStorage:', e);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Failed to remove from localStorage:', e);
        }
    }
};

// Export utilities for use in other scripts
window.KStyleUtils = {
    debounce,
    throttle,
    storage
};

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`Page loaded in ${loadTime}ms`);
        
        // Track Core Web Vitals if available
        if ('web-vital' in window) {
            // This would integrate with web-vitals library if included
            console.log('Web Vitals tracking available');
        }
    });
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
    // In production, you might want to send this to an error tracking service
});

// Service Worker registration for PWA functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment if you add a service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}
