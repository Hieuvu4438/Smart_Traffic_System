// DOM elements
const dropdownToggles = document.querySelectorAll('.dropdown');
const sidebarDropdowns = document.querySelectorAll('.sidebar .dropdown');
const violationDropdowns = document.querySelectorAll('.violation-dropdown, .info-dropdown, .history-dropdown');

// Sidebar dropdown functionality
sidebarDropdowns.forEach(dropdown => {
    dropdown.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Toggle active class
        this.classList.toggle('active');
        
        // Close other dropdowns
        sidebarDropdowns.forEach(other => {
            if (other !== this) {
                other.classList.remove('active');
            }
        });
    });
});

// Vehicle info dropdown functionality
violationDropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    const list = dropdown.querySelector('.dropdown-list');
    const icon = toggle.querySelector('i');
    
    // Initially hide all dropdown lists
    list.style.display = 'none';
    
    toggle.addEventListener('click', function() {
        const isOpen = list.style.display === 'block';
        
        // Close all other dropdowns
        violationDropdowns.forEach(other => {
            const otherList = other.querySelector('.dropdown-list');
            const otherIcon = other.querySelector('.dropdown-toggle i');
            otherList.style.display = 'none';
            otherIcon.classList.remove('fa-chevron-down');
            otherIcon.classList.add('fa-chevron-up');
        });
        
        // Toggle current dropdown
        if (isOpen) {
            list.style.display = 'none';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            list.style.display = 'block';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    });
});

// Search functionality
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');

function performSearch() {
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm) {
        console.log('Searching for:', searchTerm);
        
        // Show loading state
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Simulate search delay
        setTimeout(() => {
            searchBtn.innerHTML = '<i class="fas fa-search"></i>';
            
            // Here you would typically make an API call to search for the license plate
            // For now, we'll just show the vehicle info
            showVehicleInfo(searchTerm);
        }, 1500);
    }
}

function showVehicleInfo(licensePlate) {
    const vehicleInfo = document.querySelector('.vehicle-info');
    
    // Add animation class
    vehicleInfo.style.opacity = '0';
    vehicleInfo.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        vehicleInfo.style.transition = 'all 0.5s ease';
        vehicleInfo.style.opacity = '1';
        vehicleInfo.style.transform = 'translateY(0)';
    }, 100);
    
    // Update the license plate in the info section if needed
    const plateElement = document.querySelector('.dropdown-list li');
    if (plateElement && licensePlate) {
        plateElement.textContent = `Biển số xe: ${licensePlate}`;
    }
}

// Search event listeners
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Thumbnail image switching
const thumbnails = document.querySelectorAll('.thumbnail img');
const mainImage = document.querySelector('.main-image img');

thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', function() {
        const newSrc = this.src;
        
        // Add fade effect
        mainImage.style.opacity = '0.5';
        
        setTimeout(() => {
            mainImage.src = newSrc;
            mainImage.style.opacity = '1';
        }, 150);
        
        // Update active thumbnail
        thumbnails.forEach(thumb => thumb.parentElement.classList.remove('active'));
        this.parentElement.classList.add('active');
    });
});

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

// Feature card interactions
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px)';
        this.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(-5px)';
        this.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
    });
});

// Read more link interactions
const readMoreLinks = document.querySelectorAll('.read-more');
readMoreLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Read more clicked for:', this.closest('.feature-card').querySelector('h3').textContent);
    });
});

// Mobile menu functionality
function createMobileMenu() {
    if (window.innerWidth <= 768) {
        const nav = document.querySelector('.nav-menu');
        if (!document.querySelector('.mobile-menu-toggle')) {
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
}

// Initialize mobile menu on load and resize
window.addEventListener('load', createMobileMenu);
window.addEventListener('resize', createMobileMenu);

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .vehicle-details').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

console.log('Violation page initialized successfully!');
