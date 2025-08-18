// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive features
    initializeDropdowns();
    initializeSearch();
    initializeThumbnailGallery();
    initializeAnimations();
});

// Dropdown functionality
function initializeDropdowns() {
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
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.violation-dropdown, .info-dropdown, .history-dropdown')) {
            violationDropdowns.forEach(dropdown => {
                const list = dropdown.querySelector('.dropdown-list');
                const icon = dropdown.querySelector('.dropdown-toggle i');
                list.style.display = 'none';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            });
        }
    });
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('violationSearch');
    const searchButton = document.querySelector('.search-button');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', function() {
            performSearch();
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Add search input animation
        searchInput.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
            this.parentElement.style.boxShadow = '0 8px 25px rgba(74, 124, 89, 0.2)';
        });
        
        searchInput.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
            this.parentElement.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        });
    }
}

function performSearch() {
    const searchInput = document.getElementById('violationSearch');
    const query = searchInput.value.trim();
    
    if (query === '') {
        showNotification('Vui lòng nhập biển số xe cần tra cứu', 'warning');
        return;
    }
    
    // Add loading state
    const searchButton = document.querySelector('.search-button');
    const originalText = searchButton.innerHTML;
    searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tìm...';
    searchButton.disabled = true;
    
    // Simulate search delay
    setTimeout(() => {
        // Reset button
        searchButton.innerHTML = originalText;
        searchButton.disabled = false;
        
        // Show mock results
        showSearchResults(query);
        showNotification(`Đã tìm thấy thông tin cho biển số: ${query}`, 'success');
    }, 1500);
}

function showSearchResults(licensePlate) {
    // This function would populate the results sections with real data
    // For now, it's a placeholder that shows mock data
    console.log(`Searching for license plate: ${licensePlate}`);
    
    // You can add code here to update the violation details, vehicle info, etc.
    // based on the search results from your backend API
}

// Thumbnail gallery functionality
function initializeThumbnailGallery() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.querySelector('.main-image img');
    
    if (thumbnails.length > 0 && mainImage) {
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', function() {
                // Remove active class from all thumbnails
                thumbnails.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked thumbnail
                this.classList.add('active');
                
                // Update main image with smooth transition
                const newImageSrc = this.querySelector('img').src;
                mainImage.style.opacity = '0';
                
                setTimeout(() => {
                    mainImage.src = newImageSrc;
                    mainImage.style.opacity = '1';
                }, 150);
            });
            
            // Add hover effect
            thumbnail.addEventListener('mouseenter', function() {
                if (!this.classList.contains('active')) {
                    this.style.transform = 'scale(1.1)';
                    this.style.boxShadow = '0 8px 20px rgba(74, 124, 89, 0.3)';
                }
            });
            
            thumbnail.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.style.transform = 'scale(1)';
                    this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                }
            });
        });
    }
}

// Animation initialization
function initializeAnimations() {
    // Add entrance animations for cards
    const cards = document.querySelectorAll('.feature-card, .detail-section');
    
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
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: all 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'error': return 'fa-times-circle';
        default: return 'fa-info-circle';
    }
}

function getNotificationColor(type) {
    switch(type) {
        case 'success': return 'linear-gradient(135deg, #4a7c59, #6b9080)';
        case 'warning': return 'linear-gradient(135deg, #f39c12, #e67e22)';
        case 'error': return 'linear-gradient(135deg, #e74c3c, #c0392b)';
        default: return 'linear-gradient(135deg, #3498db, #2980b9)';
    }
}

// Utility functions
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

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
