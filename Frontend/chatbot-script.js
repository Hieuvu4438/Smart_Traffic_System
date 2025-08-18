// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive features
    initializeRouteSearch();
    initializeTransportSelection();
    initializeRouteCards();
    initializeTrafficHours();
    initializePredictionCards();
    initializeAnimations();
    
    // Animated counters
    const counters = document.querySelectorAll('.stat-number, .value');
    
    const animateCounter = (counter) => {
        const target = +counter.getAttribute('data-target');
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = 2000; // ms
        let start = 0;
        const stepTime = Math.abs(Math.floor(duration / target)) || 1;

        const timer = setInterval(() => {
            start += 1;
            counter.innerText = start + suffix;
            if (start >= target) {
                counter.innerText = target + suffix;
                clearInterval(timer);
            }
        }, stepTime);
    };

    const observerOptions = {
        root: null,
        threshold: 0.1
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });

    // Sidebar dropdown
    const dropdowns = document.querySelectorAll('.sidebar-nav .dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', (e) => {
            e.preventDefault();
            const content = dropdown.nextElementSibling;
            dropdown.classList.toggle('open');
            if (content && content.classList.contains('dropdown-content')) {
                if (dropdown.classList.contains('open')) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'none';
                }
            }
        });
    });

    // Particle generation for hero section
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'particles';
        heroSection.prepend(particleContainer); // Prepend to be behind content

        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 12}s`;
            particle.style.animationDuration = `${7 + Math.random() * 8}s`; // Vary duration
            particle.style.setProperty('--x-end', `${Math.random() * 100}vw`);
            particleContainer.appendChild(particle);
        }
    }

    // Last updated timestamp
    const lastUpdated = document.querySelector('.last-updated');
    if(lastUpdated) {
        lastUpdated.textContent = 'vài giây trước';
        setInterval(() => {
            // This is just for demo purposes to keep it fresh
            lastUpdated.textContent = 'vài giây trước';
        }, 60000); // Update every minute
    }
});

// Route Search Functionality
function initializeRouteSearch() {
    const routeInputs = document.querySelectorAll('.route-input');
    const clearBtns = document.querySelectorAll('.clear-btn');
    const micBtn = document.querySelector('.mic-btn');
    
    // Input focus effects
    routeInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
            this.parentElement.style.boxShadow = '0 8px 25px rgba(74, 124, 89, 0.2)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = '';
            this.parentElement.style.boxShadow = '';
        });
    });
    
    // Clear button functionality
    clearBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.route-input');
            input.value = '';
            input.focus();
            
            // Add clear animation
            this.style.transform = 'scale(0.8)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Microphone functionality
    if (micBtn) {
        micBtn.addEventListener('click', function() {
            showNotification('Chức năng nhận dạng giọng nói đang được phát triển', 'info');
            
            // Add mic animation
            this.style.color = '#e74c3c';
            this.style.transform = 'scale(1.2)';
            setTimeout(() => {
                this.style.color = '';
                this.style.transform = '';
            }, 300);
        });
    }
}

// Transport Selection
function initializeTransportSelection() {
    const transportBtns = document.querySelectorAll('.transport-btn');
    
    transportBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            transportBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Add selection animation
            this.style.transform = 'scale(0.9)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Update route suggestions based on transport type
            updateRouteSuggestions(this);
        });
    });
}

// Route Cards Selection
function initializeRouteCards() {
    const routeCards = document.querySelectorAll('.route-card');
    
    routeCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove active class from all cards
            routeCards.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked card
            this.classList.add('active');
            
            // Update route details
            updateRouteDetails(this);
            
            showNotification('Đã chọn tuyến đường: ' + this.querySelector('.route-badge').textContent, 'success');
        });
    });
}

// Traffic Hours Chart
function initializeTrafficHours() {
    const hourBars = document.querySelectorAll('.hour-bar');
    
    hourBars.forEach(bar => {
        bar.addEventListener('click', function() {
            // Remove active class from all bars
            hourBars.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked bar
            this.classList.add('active');
            
            // Show traffic info for selected hour
            const hour = this.querySelector('span').textContent;
            showTrafficInfo(hour);
        });
        
        // Hover effects
        bar.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        bar.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

// Prediction Cards Interactions
function initializePredictionCards() {
    const predictionCards = document.querySelectorAll('.prediction-card');
    const actionBtns = document.querySelectorAll('.action-btn');
    
    predictionCards.forEach(card => {
        // Card hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Action button functionality
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const action = this.textContent.trim();
            handleActionClick(action, this);
            
            // Button animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// Animation Effects
function initializeAnimations() {
    // Intersection Observer for scroll animations
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
    const animateElements = document.querySelectorAll('.route-card, .prediction-card, .stat-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
    
    // Floating animation for cards
    startFloatingAnimation();
    
    // Traffic density animation
    animateTrafficDensity();
}

// Floating Animation
function startFloatingAnimation() {
    const floatingElements = document.querySelectorAll('.small-card, .prediction-card');
    
    floatingElements.forEach((element, index) => {
        element.style.animation = `float 6s ease-in-out infinite ${index * 0.5}s`;
    });
}

// Traffic Density Animation
function animateTrafficDensity() {
    const densityElements = document.querySelectorAll('.density');
    
    densityElements.forEach(element => {
        const text = element.textContent;
        const match = text.match(/(\d+)%/);
        
        if (match) {
            const percentage = parseInt(match[1]);
            animatePercentage(element, percentage);
        }
    });
}

// Helper Functions
function updateRouteSuggestions(transportBtn) {
    const transportType = transportBtn.querySelector('i').className;
    console.log('Selected transport:', transportType);
    
    // Update route cards based on transport type
    const routeCards = document.querySelectorAll('.route-card');
    routeCards.forEach(card => {
        // Add transport-specific styling or content updates
        card.style.borderColor = getTransportColor(transportType);
    });
}

function updateRouteDetails(selectedCard) {
    const routeType = selectedCard.querySelector('.route-badge').textContent;
    const routeHeader = document.querySelector('.route-header h2');
    
    // Update header with selected route
    if (routeHeader) {
        routeHeader.style.color = '#e74c3c';
        setTimeout(() => {
            routeHeader.style.color = '';
        }, 1000);
    }
    
    // Update map and segments based on selection
    updateRouteMap(routeType);
}

function updateRouteMap(routeType) {
    const routeMap = document.querySelector('.route-map img');
    
    if (routeMap) {
        // Add loading effect
        routeMap.style.opacity = '0.5';
        routeMap.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            routeMap.style.opacity = '';
            routeMap.style.transform = '';
        }, 500);
    }
}

function showTrafficInfo(hour) {
    const trafficLevels = {
        '11:00': 'Giao thông nhẹ nhàng',
        '12:00': 'Bắt đầu tăng mật độ',
        '13:00': 'Giờ cao điểm - rất đông',
        '14:00': 'Vẫn đông, bắt đầu giảm'
    };
    
    const info = trafficLevels[hour] || 'Thông tin không có sẵn';
    showNotification(`${hour}: ${info}`, 'info');
}

function handleActionClick(action, button) {
    const card = button.closest('.prediction-card');
    const roadName = card.querySelector('h3').textContent;
    
    switch(true) {
        case action.includes('Tìm đường khác'):
            showNotification(`Đang tìm đường thay thế cho ${roadName}...`, 'info');
            setTimeout(() => {
                showNotification('Đã tìm thấy 3 tuyến đường thay thế!', 'success');
            }, 2000);
            break;
            
        case action.includes('Theo dõi'):
            showNotification(`Đã bật theo dõi cho ${roadName}`, 'success');
            button.innerHTML = '<i class="fas fa-check"></i> Đang theo dõi';
            button.style.background = '#27ae60';
            break;
            
        case action.includes('Xem lộ trình'):
            showNotification(`Đang mở chi tiết lộ trình ${roadName}...`, 'info');
            break;
            
        case action.includes('Thống kê'):
            showNotification(`Đang tải thống kê cho ${roadName}...`, 'info');
            break;
            
        case action.includes('Bắt đầu điều hướng'):
            showNotification(`Bắt đầu điều hướng trên ${roadName}`, 'success');
            break;
            
        case action.includes('Lưu tuyến đường'):
            showNotification(`Đã lưu tuyến đường ${roadName}`, 'success');
            button.innerHTML = '<i class="fas fa-heart"></i> Đã lưu';
            button.style.background = '#e74c3c';
            break;
            
        default:
            showNotification('Chức năng đang được phát triển', 'info');
    }
}

function getTransportColor(transportType) {
    const colors = {
        'fa-truck': '#3498db',
        'fa-bicycle': '#27ae60',
        'fa-bed': '#9b59b6',
        'fa-route': '#f39c12',
        'fa-ship': '#2980b9',
        'fa-running': '#e67e22'
    };
    
    return colors[transportType] || '#4a7c59';
}

function animatePercentage(element, targetPercentage) {
    let currentPercentage = 0;
    const increment = targetPercentage / 50;
    
    const timer = setInterval(() => {
        currentPercentage += increment;
        
        if (currentPercentage >= targetPercentage) {
            currentPercentage = targetPercentage;
            clearInterval(timer);
        }
        
        const text = element.textContent.replace(/\d+%/, Math.round(currentPercentage) + '%');
        element.textContent = text;
    }, 50);
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${icons[type]}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 5px;
            margin-left: 10px;
            border-radius: 50%;
            transition: all 0.3s ease;
        ">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .notification button:hover {
            background: rgba(255, 255, 255, 0.2) !important;
        }
    `;
    
    if (!document.querySelector('#notification-styles')) {
        style.id = 'notification-styles';
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
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

// Search Box Functionality
const searchBox = document.querySelector('.search-box input');
const searchButton = document.querySelector('.search-box button');

if (searchBox && searchButton) {
    searchButton.addEventListener('click', function() {
        const query = searchBox.value.trim();
        if (query) {
            showNotification(`Đang tìm kiếm: ${query}`, 'info');
            searchBox.value = '';
        }
    });
    
    searchBox.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });
}

// Expand Map Button
const expandBtn = document.querySelector('.expand-btn');
if (expandBtn) {
    expandBtn.addEventListener('click', function() {
        const routeMap = document.querySelector('.route-map');
        
        if (routeMap.classList.contains('expanded')) {
            routeMap.classList.remove('expanded');
            this.textContent = 'Mở rộng';
        } else {
            routeMap.classList.add('expanded');
            this.textContent = 'Thu gọn';
        }
        
        showNotification('Chế độ xem bản đồ đã thay đổi', 'info');
    });
}

// Route Alternative Items
const routeItems = document.querySelectorAll('.route-item');
routeItems.forEach(item => {
    item.addEventListener('click', function() {
        routeItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        const routeName = this.querySelector('h5').textContent;
        showNotification(`Đã chọn ${routeName}`, 'success');
    });
});

// Console log for debugging
console.log('Chatbot page scripts loaded successfully!');
