// Accordion functionality
document.addEventListener('DOMContentLoaded', function() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const accordionItem = this.parentElement;
            const accordionContent = accordionItem.querySelector('.accordion-content');
            const chevronIcon = this.querySelector('.fas.fa-chevron-down');
            
            // Toggle active class
            accordionItem.classList.toggle('active');
            
            // Toggle content visibility
            if (accordionItem.classList.contains('active')) {
                accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
                chevronIcon.style.transform = 'rotate(180deg)';
            } else {
                accordionContent.style.maxHeight = '0';
                chevronIcon.style.transform = 'rotate(0deg)';
            }
        });
    });
});

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    // Search button click
    searchBtn.addEventListener('click', function() {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
        }
    });
    
    // Enter key press in search input
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
                performSearch(query);
            }
        }
    });
    
    function performSearch(query) {
        console.log('Searching for:', query);
        // Add your search logic here
        // For now, just show a simple alert
        alert(`Đang tra cứu thông tin cho biển số: ${query}`);
    }
});

// Filter buttons functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            const filterType = this.textContent.trim();
            console.log('Filter selected:', filterType);
            
            // Add your filter logic here
        });
    });
});

// Thumbnail gallery functionality
document.addEventListener('DOMContentLoaded', function() {
    const thumbnails = document.querySelectorAll('.thumbnail-item:not(.thumbnail-placeholder)');
    const mainImage = document.querySelector('.main-vehicle-image img');
    const imageTag = document.querySelector('.image-tag');
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Remove active class from all thumbnails
            thumbnails.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked thumbnail
            this.classList.add('active');
            
            // Update main image
            const newImageSrc = this.querySelector('img').src;
            const newTag = this.getAttribute('data-tag');
            
            mainImage.src = newImageSrc;
            if (imageTag && newTag) {
                imageTag.textContent = newTag;
            }
        });
    });
});

// Sidebar dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    const dropdownItems = document.querySelectorAll('.nav-item.dropdown');
    
    dropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('active');
            const dropdownContent = this.nextElementSibling;
            
            if (this.classList.contains('active')) {
                dropdownContent.style.maxHeight = dropdownContent.scrollHeight + 'px';
            } else {
                dropdownContent.style.maxHeight = '0';
            }
        });
    });
});

// Add smooth animations for stats cards
document.addEventListener('DOMContentLoaded', function() {
    const statCards = document.querySelectorAll('.stat-card');
    
    // Animate stat numbers on page load
    statCards.forEach(card => {
        const statNumber = card.querySelector('.stat-number');
        const finalNumber = statNumber.textContent;
        
        // Simple number animation (you can make this more sophisticated)
        let currentNumber = 0;
        const increment = parseInt(finalNumber.replace(/[^\d]/g, '')) / 50;
        
        const timer = setInterval(() => {
            currentNumber += increment;
            if (currentNumber >= parseInt(finalNumber.replace(/[^\d]/g, ''))) {
                statNumber.textContent = finalNumber;
                clearInterval(timer);
            } else {
                statNumber.textContent = Math.floor(currentNumber) + finalNumber.replace(/[\d]/g, '').replace(/^\d+/, '');
            }
        }, 30);
    });
});

// Hotspot map interactions
document.addEventListener('DOMContentLoaded', function() {
    const hotspots = document.querySelectorAll('.hotspot');
    
    hotspots.forEach(hotspot => {
        hotspot.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.zIndex = '10';
        });
        
        hotspot.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.zIndex = '1';
        });
        
        hotspot.addEventListener('click', function() {
            const info = this.querySelector('.hotspot-info');
            const location = info.querySelector('strong').textContent;
            alert(`Xem chi tiết vi phạm tại: ${location}`);
        });
    });
});
