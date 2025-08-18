// DOM elements
const searchInput = document.querySelector('.district-search');
const cameraTypeSelect = document.querySelector('.camera-type-select');
const cameraItems = document.querySelectorAll('.camera-item');
const favoriteStars = document.querySelectorAll('.favorite');

// Search functionality
function filterCameras() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedType = cameraTypeSelect.value;
    
    cameraItems.forEach(item => {
        const cameraName = item.querySelector('h4').textContent.toLowerCase();
        const cameraAddress = item.querySelector('p').textContent.toLowerCase();
        
        const matchesSearch = cameraName.includes(searchTerm) || cameraAddress.includes(searchTerm);
        const matchesType = selectedType === '' || true; // Add type filtering logic here
        
        if (matchesSearch && matchesType) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Event listeners for search
searchInput.addEventListener('input', filterCameras);
cameraTypeSelect.addEventListener('change', filterCameras);

// Favorite functionality
favoriteStars.forEach(star => {
    star.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (this.classList.contains('fas')) {
            this.classList.remove('fas');
            this.classList.add('far');
        } else {
            this.classList.remove('far');
            this.classList.add('fas');
        }
    });
});

// Camera item selection
cameraItems.forEach(item => {
    item.addEventListener('click', function() {
        // Remove active class from all items
        cameraItems.forEach(i => i.classList.remove('active'));
        
        // Add active class to clicked item
        this.classList.add('active');
        
        // Here you would typically load the camera feed
        console.log('Selected camera:', this.querySelector('h4').textContent);
    });
});

// Service card navigation
const serviceCards = document.querySelectorAll('.service-card');
serviceCards.forEach(card => {
    card.addEventListener('click', function() {
        const serviceName = this.querySelector('h3').textContent;
        console.log('Navigating to:', serviceName);
        
        // Add navigation logic here
        // For example: window.location.href = '/service-page';
    });
});

// Live indicator animation enhancement
function updateTimestamp() {
    const timestamp = document.querySelector('.timestamp');
    if (timestamp) {
        const now = new Date();
        const formattedTime = now.toLocaleString('sv-SE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).replace(' ', ' ');
        timestamp.textContent = formattedTime;
    }
}

// Update timestamp every second
setInterval(updateTimestamp, 1000);

// Smooth scrolling for navigation links
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        if (this.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Header scroll effect
let lastScrollTop = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down
        header.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up
        header.style.transform = 'translateY(0)';
    }
    
    lastScrollTop = scrollTop;
});

// Add CSS for header transition
header.style.transition = 'transform 0.3s ease-in-out';

// Mobile menu toggle (if needed)
function createMobileMenu() {
    if (window.innerWidth <= 768) {
        const nav = document.querySelector('.nav-menu');
        const menuButton = document.createElement('button');
        menuButton.innerHTML = '<i class="fas fa-bars"></i>';
        menuButton.className = 'mobile-menu-toggle';
        
        // Add mobile menu styles
        const style = document.createElement('style');
        style.textContent = `
            .mobile-menu-toggle {
                display: none;
                background: none;
                border: none;
                font-size: 24px;
                color: #4a7c59;
                cursor: pointer;
            }
            
            @media (max-width: 768px) {
                .mobile-menu-toggle {
                    display: block;
                }
                
                .nav-menu {
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    flex-direction: column;
                    padding: 20px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                }
                
                .nav-menu.active {
                    display: flex;
                }
            }
        `;
        document.head.appendChild(style);
        
        menuButton.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
        
        nav.parentNode.insertBefore(menuButton, nav);
    }
}

// Initialize mobile menu on load and resize
window.addEventListener('load', createMobileMenu);
window.addEventListener('resize', createMobileMenu);

// Loading animation for camera feeds
function showLoadingAnimation(element) {
    const placeholder = element.querySelector('.camera-placeholder');
    if (placeholder) {
        placeholder.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Simulate loading time
        setTimeout(() => {
            placeholder.innerHTML = '<i class="fas fa-image"></i>';
        }, 2000);
    }
}

// Initialize loading animations
document.querySelectorAll('.camera-frame').forEach(frame => {
    showLoadingAnimation(frame);
});

console.log('Traffic Management System initialized successfully!');
