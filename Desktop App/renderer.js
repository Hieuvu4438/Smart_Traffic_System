/**
 * Traffic Camera Monitor - Renderer Process
 * Main JavaScript file for handling UI interactions and data management
 */

// Application State
class AppState {
    constructor() {
        this.cameras = [];
        this.currentFilter = { 
            city: 'all', 
            district: 'all', 
            intersection: 'all',
            search: '' 
        };
        this.settings = this.loadSettings();
        this.alerts = [];
        this.isConnected = true;
        this.refreshInterval = null;
        this.currentTab = 'dashboard';
        this.theme = this.settings.theme || 'light';
        this.vietnamData = this.getVietnamLocationData();
    }

    loadSettings() {
        const defaultSettings = {
            refreshRate: 10,
            alertThreshold: 100,
            soundAlerts: true,
            autoRefresh: true,
            videoQuality: 'medium',
            showTimestamp: true,
            theme: 'light'
        };
        
        try {
            const saved = localStorage.getItem('trafficMonitorSettings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    }

    saveSettings() {
        localStorage.setItem('trafficMonitorSettings', JSON.stringify(this.settings));
    }

    addAlert(alert) {
        this.alerts.unshift({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...alert
        });
        
        // Keep only last 50 alerts
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(0, 50);
        }
        
        this.updateAlertDisplay();
        this.showNotification(alert.title, alert.message, alert.type);
        
        if (this.settings.soundAlerts) {
            this.playAlertSound(alert.type);
        }
    }

    updateAlertDisplay() {
        const activeAlerts = this.alerts.filter(alert => 
            (Date.now() - new Date(alert.timestamp).getTime()) < 3600000 // Last hour
        );
        
        document.getElementById('activeAlerts').textContent = activeAlerts.length;
        
        // Update alert tab
        this.renderAlerts();
    }

    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const iconMap = {
            success: 'fa-check',
            error: 'fa-exclamation-triangle',
            warning: 'fa-exclamation',
            info: 'fa-info'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${iconMap[type] || 'fa-info'}"></i>
            </div>
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    container.removeChild(notification);
                }, 300);
            }
        }, 5000);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            container.removeChild(notification);
        });
    }

    playAlertSound(type) {
        // Create audio context for alert sounds
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different frequencies for different alert types
            const frequencies = {
                high: 800,
                medium: 600,
                low: 400
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 600, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio not supported:', error);
        }
    }

    getVietnamLocationData() {
        return {
            hanoi: {
                name: 'Hà Nội',
                districts: [
                    'Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy',
                    'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân', 'Nam Từ Liêm'
                ]
            },
            hcmc: {
                name: 'TP. Hồ Chí Minh',
                districts: [
                    'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5',
                    'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10',
                    'Quận 11', 'Quận 12', 'Bình Thạnh', 'Tân Bình', 'Phú Nhuận'
                ]
            },
            danang: {
                name: 'Đà Nẵng',
                districts: [
                    'Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn',
                    'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang'
                ]
            },
            haiphong: {
                name: 'Hải Phòng',
                districts: [
                    'Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Hải An',
                    'Kiến An', 'Đồ Sơn', 'Dương Kinh'
                ]
            }
        };
    }
}

// Initialize app state
const appState = new AppState();

// Mock Data Generators
class MockDataGenerator {
    static generateCameraList() {
        return [
            {
                id: 'CAM-HN001',
                name: 'Ngã tư Hoàn Kiếm',
                location: 'Phố Đinh Tiên Hoàng - Lê Thái Tổ',
                city: 'hanoi',
                district: 'Hoàn Kiếm',
                intersection: 'major',
                imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=450&fit=crop',
                status: 'online',
                lines: 4
            },
            {
                id: 'CAM-HCM002',
                name: 'Ngã tư Nguyễn Huệ',
                location: 'Đường Nguyễn Huệ - Đồng Khởi',
                city: 'hcmc',
                district: 'Quận 1',
                intersection: 'major',
                imageUrl: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=450&fit=crop',
                status: 'online',
                lines: 6
            },
            {
                id: 'CAM-DN003',
                name: 'Cầu Rồng',
                location: 'Đường Trần Hưng Đạo - Bạch Đằng',
                city: 'danang',
                district: 'Hải Châu',
                intersection: 'major',
                imageUrl: 'https://images.unsplash.com/photo-1478691778059-04a8ba391d7b?w=800&h=450&fit=crop',
                status: 'online',
                lines: 4
            },
            {
                id: 'CAM-HN004',
                name: 'Vòng xuyến Cầu Giấy',
                location: 'Đường Cầu Giấy - Nguyễn Chánh',
                city: 'hanoi',
                district: 'Cầu Giấy',
                intersection: 'medium',
                imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=450&fit=crop',
                status: 'maintenance',
                lines: 5
            },
            {
                id: 'CAM-HCM005',
                name: 'Ngã tư Bến Thành',
                location: 'Đường Lê Lợi - Pasteur',
                city: 'hcmc',
                district: 'Quận 1',
                intersection: 'major',
                imageUrl: 'https://images.unsplash.com/photo-1570125909517-53cb21c89ff2?w=800&h=450&fit=crop',
                status: 'online',
                lines: 4
            },
            {
                id: 'CAM-HP006',
                name: 'Ngã tư Tam Bạc',
                location: 'Đường Điện Biên Phủ - Tam Bạc',
                city: 'haiphong',
                district: 'Hồng Bàng',
                intersection: 'medium',
                imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=450&fit=crop',
                status: 'online',
                lines: 3
            }
        ];
    }

    static generateMetrics(cameraId, numLines) {
        const lines = [];
        let totalVehicles = 0;
        
        for (let i = 1; i <= numLines; i++) {
            const lineTotal = Math.floor(Math.random() * 25) + 5;
            const motorcycles = Math.floor(lineTotal * (0.4 + Math.random() * 0.3));
            const cars = Math.floor(lineTotal * (0.2 + Math.random() * 0.3));
            const trucks = Math.max(0, lineTotal - motorcycles - cars);
            
            lines.push({
                id: i,
                total: lineTotal,
                types: {
                    motorcycle: motorcycles,
                    car: cars,
                    truck: trucks
                }
            });
            
            totalVehicles += lineTotal;
        }
        
        const status = totalVehicles > appState.settings.alertThreshold ? 'alert' : 'normal';
        
        return {
            cameraId,
            totalVehicles,
            lines,
            timestamp: new Date().toISOString(),
            status
        };
    }

    static generateHistoryData(hours = 24) {
        const data = [];
        const now = new Date();
        
        for (let i = hours; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
            const baseTraffic = 50 + Math.sin((timestamp.getHours() / 24) * Math.PI * 2) * 30;
            const randomVariation = (Math.random() - 0.5) * 20;
            
            data.push({
                timestamp: timestamp.toISOString(),
                totalVehicles: Math.max(10, Math.floor(baseTraffic + randomVariation)),
                avgSpeed: Math.floor(30 + Math.random() * 30)
            });
        }
        
        return data;
    }
}

// UI Components
class UIComponents {
    static createCameraCard(camera, metrics) {
        const statusClass = metrics.status === 'alert' ? 'alert' : '';
        const statusText = camera.status === 'online' ? 'Hoạt động' : 'Bảo trì';
        
        // Calculate total vehicles by type
        const totalByType = metrics.lines.reduce((acc, line) => {
            acc.motorcycle += line.types.motorcycle;
            acc.car += line.types.car;
            acc.truck += line.types.truck;
            return acc;
        }, { motorcycle: 0, car: 0, truck: 0 });
        
        return `
            <div class="camera-card" data-camera-id="${camera.id}">
                <div class="camera-card-actions">
                    <button class="camera-action-small edit" data-action="edit" data-camera-id="${camera.id}" title="Chỉnh sửa camera">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="camera-action-small delete" data-action="delete" data-camera-id="${camera.id}" title="Xóa camera">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="camera-header">
                    <div class="camera-info">
                        <h3>${camera.name}</h3>
                        <p>${camera.location}</p>
                    </div>
                    <div class="camera-actions">
                        <div class="camera-status">
                            <div class="status-dot ${statusClass}"></div>
                            <span>${statusText}</span>
                        </div>
                        <button class="action-btn" data-action="fullscreen" title="Toàn màn hình">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="action-btn" data-action="refresh" title="Làm mới">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="camera-video">
                    ${camera.videoUrl ? 
                        `<video src="${camera.videoUrl}" alt="${camera.name}" loading="lazy" muted>
                            Your browser does not support the video tag.
                        </video>` :
                        `<img src="${camera.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNDQgNzJIMTc2VjEwOEgxNDRWNzJaIiBmaWxsPSIjQ0NDIi8+CjxwYXRoIGQ9Ik0xMjggODRIMTkyVjk2SDEyOFY4NFoiIGZpbGw9IiNDQ0MiLz4KPHN2Zz4K'}" alt="${camera.name}" loading="lazy">`
                    }
                    <div class="video-overlay">
                        <div class="video-controls">
                            <button data-action="play" title="Phát/Dừng">
                                <i class="fas fa-play"></i>
                            </button>
                            <button data-action="fullscreen" title="Toàn màn hình">
                                <i class="fas fa-expand"></i>
                            </button>
                            <button data-action="snapshot" title="Chụp ảnh">
                                <i class="fas fa-camera"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="camera-metrics">
                    <div class="metrics-header">
                        <h4><i class="fas fa-chart-bar"></i> Số liệu trực tiếp</h4>
                        <div class="total-vehicles ${statusClass}">
                            <i class="fas fa-road"></i>
                            Tổng: ${metrics.totalVehicles} xe
                        </div>
                    </div>
                    
                    <!-- Vehicle Summary -->
                    <div class="vehicle-summary">
                        <div class="summary-item motorcycle">
                            <div class="summary-icon motorcycle">
                                <i class="fas fa-motorcycle"></i>
                            </div>
                            <div class="summary-count">${totalByType.motorcycle}</div>
                            <div class="summary-label">Xe máy</div>
                        </div>
                        <div class="summary-item car">
                            <div class="summary-icon car">
                                <i class="fas fa-car"></i>
                            </div>
                            <div class="summary-count">${totalByType.car}</div>
                            <div class="summary-label">Ô tô</div>
                        </div>
                        <div class="summary-item truck">
                            <div class="summary-icon truck">
                                <i class="fas fa-truck"></i>
                            </div>
                            <div class="summary-count">${totalByType.truck}</div>
                            <div class="summary-label">Xe tải</div>
                        </div>
                    </div>
                    
                    <div class="lines-container">
                        ${metrics.lines.map(line => `
                            <div class="line-item">
                                <div class="line-header">
                                    <h5>Làn ${line.id}</h5>
                                    <div class="line-total">${line.total}</div>
                                </div>
                                <div class="vehicle-types">
                                    <div class="vehicle-type">
                                        <div class="vehicle-icon motorcycle">
                                            <i class="fas fa-motorcycle"></i>
                                        </div>
                                        <span class="vehicle-count">${line.types.motorcycle}</span>
                                    </div>
                                    <div class="vehicle-type">
                                        <div class="vehicle-icon car">
                                            <i class="fas fa-car"></i>
                                        </div>
                                        <span class="vehicle-count">${line.types.car}</span>
                                    </div>
                                    <div class="vehicle-type">
                                        <div class="vehicle-icon truck">
                                            <i class="fas fa-truck"></i>
                                        </div>
                                        <span class="vehicle-count">${line.types.truck}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    static createAlertItem(alert) {
        const timeAgo = this.getTimeAgo(new Date(alert.timestamp));
        
        return `
            <div class="alert-item" data-alert-id="${alert.id}">
                <div class="alert-icon ${alert.type}">
                    <i class="fas ${alert.type === 'high' ? 'fa-exclamation-triangle' : 
                                   alert.type === 'medium' ? 'fa-exclamation' : 'fa-info'}"></i>
                </div>
                <div class="alert-content">
                    <h4>${alert.title}</h4>
                    <p>${alert.message}</p>
                    <div class="alert-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }

    static getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    }
}

// Data Management
class DataManager {
    static async initializeCameras() {
        try {
            // Load cameras from database
            appState.cameras = await window.electronAPI.getCameraList();
            return appState.cameras;
        } catch (error) {
            console.error('Failed to load cameras:', error);
            appState.showNotification('Error', 'Failed to load camera list', 'error');
            return [];
        }
    }
    
    // Add a separate method for loading cameras (used by camera management)
    static async loadCameras() {
        return await this.initializeCameras();
    }

    static async getMetrics(cameraId) {
        try {
            const camera = appState.cameras.find(c => c.id === cameraId);
            if (!camera) return null;
            
            // In production, this would use: await window.electronAPI.getMetrics(cameraId)
            const metrics = MockDataGenerator.generateMetrics(cameraId, camera.lines);
            
            // Check for alerts
            if (metrics.status === 'alert') {
                appState.addAlert({
                    type: 'high',
                    title: 'High Traffic Alert',
                    message: `${camera.name} has ${metrics.totalVehicles} vehicles (threshold: ${appState.settings.alertThreshold})`
                });
            }
            
            return metrics;
        } catch (error) {
            console.error('Failed to get metrics:', error);
            return null;
        }
    }

    static async getAllMetrics() {
        const metrics = {};
        
        for (const camera of appState.cameras) {
            if (camera.status === 'online') {
                metrics[camera.id] = await this.getMetrics(camera.id);
            }
        }
        
        return metrics;
    }

    static async exportData(format = 'csv') {
        try {
            const allMetrics = await this.getAllMetrics();
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            
            if (format === 'csv') {
                let csv = 'Camera ID,Camera Name,Total Vehicles,Line,Motorcycles,Cars,Trucks,Timestamp\n';
                
                for (const [cameraId, metrics] of Object.entries(allMetrics)) {
                    const camera = appState.cameras.find(c => c.id === cameraId);
                    if (metrics) {
                        for (const line of metrics.lines) {
                            csv += `${cameraId},${camera.name},${metrics.totalVehicles},${line.id},${line.types.motorcycle},${line.types.car},${line.types.truck},${metrics.timestamp}\n`;
                        }
                    }
                }
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `traffic_data_${timestamp}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                
                appState.showNotification('Success', 'Data exported successfully', 'success');
            }
        } catch (error) {
            console.error('Export failed:', error);
            appState.showNotification('Error', 'Failed to export data', 'error');
        }
    }
}

// Chart Management
class ChartManager {
    static historyChart = null;

    static async initializeHistoryChart() {
        const ctx = document.getElementById('historyChart');
        if (!ctx) return;

        const data = MockDataGenerator.generateHistoryData(24);
        
        this.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
                datasets: [{
                    label: 'Total Vehicles',
                    data: data.map(d => d.totalVehicles),
                    borderColor: 'rgb(0, 102, 204)',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Average Speed (km/h)',
                    data: data.map(d => d.avgSpeed),
                    borderColor: 'rgb(0, 204, 102)',
                    backgroundColor: 'rgba(0, 204, 102, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Traffic History (Last 24 Hours)'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Number of Vehicles'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Speed (km/h)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                interaction: {
                    intersect: false
                }
            }
        });
    }

    static updateHistoryChart(timeRange) {
        if (!this.historyChart) return;

        const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 168;
        const data = MockDataGenerator.generateHistoryData(hours);
        
        this.historyChart.data.labels = data.map(d => {
            const date = new Date(d.timestamp);
            return hours > 24 ? 
                date.toLocaleDateString([], { month: 'short', day: 'numeric' }) :
                date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });
        
        this.historyChart.data.datasets[0].data = data.map(d => d.totalVehicles);
        this.historyChart.data.datasets[1].data = data.map(d => d.avgSpeed);
        this.historyChart.update();
    }
}

// Event Handlers
class EventHandlers {
    static setupSidebarToggle() {
        const toggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        
        toggle?.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    static setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearch');
        
        searchInput?.addEventListener('input', (e) => {
            appState.currentFilter.search = e.target.value.toLowerCase();
            DashboardManager.filterAndRenderCameras();
        });
        
        clearBtn?.addEventListener('click', () => {
            searchInput.value = '';
            appState.currentFilter.search = '';
            DashboardManager.filterAndRenderCameras();
        });
    }

    static setupFilters() {
        // City filters
        const cityFilters = document.querySelectorAll('input[name="city"]');
        cityFilters.forEach(filter => {
            filter.addEventListener('change', (e) => {
                appState.currentFilter.city = e.target.value;
                this.updateDistrictFilters(e.target.value);
                DashboardManager.filterAndRenderCameras();
            });
        });

        // District filters
        const districtFilters = document.querySelectorAll('input[name="district"]');
        districtFilters.forEach(filter => {
            filter.addEventListener('change', (e) => {
                appState.currentFilter.district = e.target.value;
                DashboardManager.filterAndRenderCameras();
            });
        });

        // Intersection filters
        const intersectionFilters = document.querySelectorAll('input[name="intersection"]');
        intersectionFilters.forEach(filter => {
            filter.addEventListener('change', (e) => {
                appState.currentFilter.intersection = e.target.value;
                DashboardManager.filterAndRenderCameras();
            });
        });

        // Initialize district filters
        this.updateDistrictFilters('all');
    }

    static updateDistrictFilters(city) {
        const districtContainer = document.getElementById('districtFilters');
        if (!districtContainer) return;

        let html = `
            <label class="filter-option">
                <input type="radio" name="district" value="all" checked>
                <span>Tất cả quận/huyện</span>
            </label>
        `;

        if (city !== 'all' && appState.vietnamData[city]) {
            appState.vietnamData[city].districts.forEach(district => {
                html += `
                    <label class="filter-option">
                        <input type="radio" name="district" value="${district.toLowerCase()}">
                        <span>${district}</span>
                    </label>
                `;
            });
        }

        districtContainer.innerHTML = html;

        // Re-attach event listeners
        const newDistrictFilters = districtContainer.querySelectorAll('input[name="district"]');
        newDistrictFilters.forEach(filter => {
            filter.addEventListener('change', (e) => {
                appState.currentFilter.district = e.target.value;
                DashboardManager.filterAndRenderCameras();
            });
        });

        // Reset district filter
        appState.currentFilter.district = 'all';
    }

    static setupTabs() {
        const tabs = document.querySelectorAll('.nav-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    static switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
        
        // Update breadcrumb with Vietnamese text
        const tabNames = {
            dashboard: 'Bảng điều khiển',
            history: 'Lịch sử',
            alerts: 'Cảnh báo',
            settings: 'Cài đặt'
        };
        
        document.getElementById('currentView').textContent = tabNames[tabName] || tabName;
        
        appState.currentTab = tabName;
        
        // Initialize tab-specific content
        if (tabName === 'history') {
            ChartManager.initializeHistoryChart();
        } else if (tabName === 'alerts') {
            appState.renderAlerts();
        }
    }

    static setupRefresh() {
        const refreshBtn = document.getElementById('refreshBtn');
        
        refreshBtn?.addEventListener('click', async () => {
            await DashboardManager.refreshAllData();
        });
    }

    static setupExport() {
        const exportBtn = document.getElementById('exportBtn');
        
        exportBtn?.addEventListener('click', async () => {
            await DataManager.exportData('csv');
        });
    }

    static setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        
        themeToggle?.addEventListener('click', () => {
            appState.theme = appState.theme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', appState.theme);
            appState.settings.theme = appState.theme;
            appState.saveSettings();
            
            const icon = themeToggle.querySelector('i');
            icon.className = `fas fa-${appState.theme === 'light' ? 'moon' : 'sun'}`;
        });
    }

    static setupSettings() {
        const settingsInputs = document.querySelectorAll('#settingsTab input, #settingsTab select');
        
        settingsInputs.forEach(input => {
            const settingName = input.id.replace(/([A-Z])/g, (match, char, index) => 
                index > 0 ? char : char.toLowerCase()
            );
            
            if (input.type === 'checkbox') {
                input.checked = appState.settings[settingName];
                input.addEventListener('change', (e) => {
                    appState.settings[settingName] = e.target.checked;
                });
            } else {
                input.value = appState.settings[settingName];
                input.addEventListener('change', (e) => {
                    appState.settings[settingName] = e.target.value;
                });
            }
        });
        
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            appState.saveSettings();
            appState.showNotification('Success', 'Settings saved successfully', 'success');
            
            // Restart refresh interval if rate changed
            if (appState.refreshInterval) {
                clearInterval(appState.refreshInterval);
                DashboardManager.startAutoRefresh();
            }
        });
        
        document.getElementById('clearDataBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all local data?')) {
                localStorage.clear();
                appState.showNotification('Success', 'Local data cleared', 'success');
            }
        });
    }

    static setupHistoryControls() {
        const timeRangeSelect = document.getElementById('historyTimeRange');
        const cameraSelect = document.getElementById('historyCameraSelect');
        
        timeRangeSelect?.addEventListener('change', (e) => {
            ChartManager.updateHistoryChart(e.target.value);
        });
        
        // Populate camera select options
        if (cameraSelect) {
            cameraSelect.innerHTML = '<option value="all">All Cameras</option>';
            appState.cameras.forEach(camera => {
                const option = document.createElement('option');
                option.value = camera.id;
                option.textContent = camera.name;
                cameraSelect.appendChild(option);
            });
        }
    }

    static setupModal() {
        const modal = document.getElementById('fullscreenModal');
        const closeBtn = document.getElementById('modalClose');
        
        closeBtn?.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    static setupCameraActions() {
        document.addEventListener('click', async (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            const cameraCard = e.target.closest('.camera-card');
            
            if (!action || !cameraCard) return;
            
            const cameraId = cameraCard.dataset.cameraId;
            const camera = appState.cameras.find(c => c.id === cameraId);
            
            switch (action) {
                case 'fullscreen':
                    this.openFullscreenModal(camera);
                    break;
                case 'refresh':
                    await DashboardManager.refreshCameraData(cameraId);
                    break;
                case 'snapshot':
                    this.takeSnapshot(camera);
                    break;
                case 'play':
                    // Toggle play/pause (placeholder for video functionality)
                    appState.showNotification('Info', 'Video controls will be available with live streams', 'info');
                    break;
            }
        });
    }

    static openFullscreenModal(camera) {
        const modal = document.getElementById('fullscreenModal');
        const title = document.getElementById('modalCameraTitle');
        const image = document.getElementById('fullscreenImage');
        const metrics = document.getElementById('fullscreenMetrics');
        
        title.textContent = `${camera.name} - Live Feed`;
        image.src = camera.imageUrl;
        image.alt = camera.name;
        
        // Get current metrics for this camera
        DataManager.getMetrics(camera.id).then(cameraMetrics => {
            if (cameraMetrics) {
                metrics.innerHTML = `
                    <div class="metric-card">
                        <h4>Current Status</h4>
                        <div class="metric-grid">
                            <div class="metric-item">
                                <span class="metric-label">Total Vehicles:</span>
                                <span class="metric-value">${cameraMetrics.totalVehicles}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value">${cameraMetrics.status}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Last Update:</span>
                                <span class="metric-value">${new Date(cameraMetrics.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <h4>Line Details</h4>
                        <div class="lines-detail">
                            ${cameraMetrics.lines.map(line => `
                                <div class="line-detail">
                                    <h5>Line ${line.id} (${line.total} vehicles)</h5>
                                    <div class="vehicle-breakdown">
                                        <div><i class="fas fa-motorcycle"></i> ${line.types.motorcycle}</div>
                                        <div><i class="fas fa-car"></i> ${line.types.car}</div>
                                        <div><i class="fas fa-truck"></i> ${line.types.truck}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        modal.classList.add('active');
    }

    static takeSnapshot(camera) {
        // Create a canvas to capture the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Add timestamp overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, 10, 200, 30);
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.fillText(new Date().toLocaleString(), 15, 30);
            
            // Download the snapshot
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${camera.id}_snapshot_${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
                
                appState.showNotification('Success', 'Snapshot saved successfully', 'success');
            });
        };
        
        img.src = camera.imageUrl;
    }
}

// Dashboard Management
class DashboardManager {
    static currentMetrics = {};

    static async initialize() {
        // Load camera database first
        try {
            const dbResult = await window.electronAPI.loadCameraDatabase();
            if (dbResult.success && dbResult.cameras) {
                appState.cameras = dbResult.cameras;
                console.log('Loaded cameras from database:', appState.cameras.length);
            }
        } catch (error) {
            console.warn('Could not load camera database, using defaults:', error);
            // Fall back to getting camera list from main process
            await DataManager.initializeCameras();
        }
        
        // If no cameras loaded, initialize with defaults
        if (!appState.cameras || appState.cameras.length === 0) {
            await DataManager.initializeCameras();
        }
        
        await this.renderDashboard();
        this.startAutoRefresh();
        this.updateSystemStats();
    }

    static async renderDashboard() {
        const grid = document.getElementById('dashboardGrid');
        if (!grid) return;

        this.showLoading(true);
        
        try {
            const filteredCameras = this.getFilteredCameras();
            const metricsPromises = filteredCameras.map(camera => 
                DataManager.getMetrics(camera.id)
            );
            
            const allMetrics = await Promise.all(metricsPromises);
            
            grid.innerHTML = filteredCameras.map((camera, index) => {
                const metrics = allMetrics[index];
                if (metrics) {
                    this.currentMetrics[camera.id] = metrics;
                    return UIComponents.createCameraCard(camera, metrics);
                }
                return '';
            }).join('');
            
            this.updateLastUpdateTime();
        } catch (error) {
            console.error('Failed to render dashboard:', error);
            appState.showNotification('Error', 'Failed to load dashboard data', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    static getFilteredCameras() {
        return appState.cameras.filter(camera => {
            const matchesCity = appState.currentFilter.city === 'all' || 
                              camera.city === appState.currentFilter.city;
            
            const matchesDistrict = appState.currentFilter.district === 'all' || 
                                  camera.district.toLowerCase().includes(appState.currentFilter.district);
            
            const matchesIntersection = appState.currentFilter.intersection === 'all' || 
                                      camera.intersection === appState.currentFilter.intersection;
            
            const matchesSearch = !appState.currentFilter.search || 
                                camera.name.toLowerCase().includes(appState.currentFilter.search) ||
                                camera.id.toLowerCase().includes(appState.currentFilter.search) ||
                                camera.location.toLowerCase().includes(appState.currentFilter.search) ||
                                camera.district.toLowerCase().includes(appState.currentFilter.search);
            
            return matchesCity && matchesDistrict && matchesIntersection && matchesSearch;
        });
    }

    static async filterAndRenderCameras() {
        await this.renderDashboard();
    }

    static async refreshAllData() {
        await this.renderDashboard();
        appState.showNotification('Success', 'Data refreshed successfully', 'success');
    }

    static async refreshCameraData(cameraId) {
        const metrics = await DataManager.getMetrics(cameraId);
        if (metrics) {
            this.currentMetrics[cameraId] = metrics;
            
            // Update the specific camera card
            const cameraCard = document.querySelector(`[data-camera-id="${cameraId}"]`);
            if (cameraCard) {
                const camera = appState.cameras.find(c => c.id === cameraId);
                cameraCard.outerHTML = UIComponents.createCameraCard(camera, metrics);
            }
            
            this.updateLastUpdateTime();
            appState.showNotification('Success', `${cameraId} data refreshed`, 'success');
        }
    }

    static startAutoRefresh() {
        if (appState.refreshInterval) {
            clearInterval(appState.refreshInterval);
        }
        
        if (appState.settings.autoRefresh) {
            appState.refreshInterval = setInterval(() => {
                if (appState.currentTab === 'dashboard') {
                    this.renderDashboard();
                }
            }, appState.settings.refreshRate * 1000);
        }
    }

    static updateSystemStats() {
        const activeCameras = appState.cameras.filter(c => c.status === 'online').length;
        const totalVehicles = Object.values(this.currentMetrics)
            .reduce((sum, metrics) => sum + (metrics?.totalVehicles || 0), 0);
        
        document.getElementById('activeCameras').textContent = activeCameras;
        document.getElementById('totalVehicles').textContent = totalVehicles;
        
        // Update time
        const updateTimeEl = document.getElementById('updateTime');
        if (updateTimeEl) {
            updateTimeEl.textContent = new Date().toLocaleTimeString('vi-VN');
        }
        
        // Update connection status
        const statusIcon = document.getElementById('connectionStatus');
        const statusText = document.getElementById('connectionText');
        
        if (appState.isConnected) {
            statusIcon.style.color = 'var(--accent-green)';
            statusText.textContent = 'Đã kết nối';
        } else {
            statusIcon.style.color = 'var(--accent-red)';
            statusText.textContent = 'Mất kết nối';
        }
    }

    static updateLastUpdateTime() {
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = new Date().toLocaleTimeString('vi-VN');
        }
    }

    static showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
        }
    }
}

// Extend AppState with render methods
appState.renderAlerts = function() {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;
    
    if (this.alerts.length === 0) {
        alertsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No alerts at this time</p>
            </div>
        `;
        return;
    }
    
    alertsList.innerHTML = this.alerts
        .map(alert => UIComponents.createAlertItem(alert))
        .join('');
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', appState.theme);
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        themeIcon.className = `fas fa-${appState.theme === 'light' ? 'moon' : 'sun'}`;
    }
    
    // Setup all event handlers
    EventHandlers.setupSidebarToggle();
    EventHandlers.setupSearch();
    EventHandlers.setupFilters();
    EventHandlers.setupTabs();
    EventHandlers.setupRefresh();
    EventHandlers.setupExport();
    EventHandlers.setupThemeToggle();
    EventHandlers.setupSettings();
    EventHandlers.setupHistoryControls();
    EventHandlers.setupModal();
    EventHandlers.setupCameraActions();
    
    // Setup camera management
    CameraManager.setupEventListeners();
    
    // Initialize dashboard
    await DashboardManager.initialize();
    
    // Show welcome message
    setTimeout(() => {
        appState.showNotification(
            'Chào mừng!', 
            'Hệ thống giám sát giao thông đã sẵn sàng hoạt động', 
            'success'
        );
    }, 1000);
    
    // Simulate some initial alerts for demo
    setTimeout(() => {
        appState.addAlert({
            type: 'medium',
            title: 'Hệ thống khởi động',
            message: 'Tất cả camera đã hoạt động và đang giám sát giao thông'
        });
    }, 2000);
});

// Handle window events
window.addEventListener('beforeunload', () => {
    if (appState.refreshInterval) {
        clearInterval(appState.refreshInterval);
    }
});

// Camera Management Class
class CameraManager {
    static currentEditingCameraId = null;
    
    static async openAddCameraModal() {
        const modal = document.getElementById('cameraModal');
        const title = document.getElementById('cameraModalTitle');
        const form = document.getElementById('cameraForm');
        const saveBtn = document.getElementById('saveCameraBtnText');
        
        // Reset form
        form.reset();
        title.textContent = 'Thêm Camera Mới';
        saveBtn.textContent = 'Thêm Camera';
        this.currentEditingCameraId = null;
        
        // Clear test results
        const testResult = document.getElementById('streamTestResult');
        testResult.style.display = 'none';
        
        modal.style.display = 'flex';
        
        // Focus on first input
        setTimeout(() => {
            document.getElementById('cameraName').focus();
        }, 100);
    }
    
    static async openEditCameraModal(cameraId) {
        const camera = appState.cameras.find(c => c.id === cameraId);
        if (!camera) return;
        
        const modal = document.getElementById('cameraModal');
        const title = document.getElementById('cameraModalTitle');
        const form = document.getElementById('cameraForm');
        const saveBtn = document.getElementById('saveCameraBtnText');
        
        // Populate form with camera data
        document.getElementById('cameraName').value = camera.name;
        document.getElementById('cameraLocation').value = camera.location;
        document.getElementById('cameraCity').value = camera.city;
        document.getElementById('cameraDistrict').value = camera.district;
        document.getElementById('cameraIntersection').value = camera.intersection || 'medium';
        document.getElementById('cameraLines').value = camera.lines || 3;
        document.getElementById('cameraVideoUrl').value = camera.videoUrl || '';
        document.getElementById('cameraStreamType').value = camera.streamType || 'http';
        
        title.textContent = 'Chỉnh Sửa Camera';
        saveBtn.textContent = 'Cập Nhật';
        this.currentEditingCameraId = cameraId;
        
        // Clear test results
        const testResult = document.getElementById('streamTestResult');
        testResult.style.display = 'none';
        
        modal.style.display = 'flex';
    }
    
    static async closeModal() {
        const modal = document.getElementById('cameraModal');
        modal.style.display = 'none';
        this.currentEditingCameraId = null;
    }
    
    static async testStream() {
        const urlInput = document.getElementById('cameraVideoUrl');
        const streamTypeSelect = document.getElementById('cameraStreamType');
        const testBtn = document.getElementById('testStreamBtn');
        const testResult = document.getElementById('streamTestResult');
        
        const url = urlInput.value.trim();
        if (!url) {
            this.showTestResult('Vui lòng nhập URL stream', 'error');
            return;
        }
        
        testBtn.disabled = true;
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        this.showTestResult('Đang kiểm tra stream...', 'loading');
        
        try {
            const result = await window.electronAPI.testCameraStream(url, streamTypeSelect.value);
            
            if (result.success) {
                let message = result.message;
                if (result.info) {
                    message += ` (${result.info.quality}, ${result.info.fps}fps, ${result.info.latency}ms)`;
                }
                this.showTestResult(message, 'success');
            } else {
                this.showTestResult(result.message, 'error');
            }
        } catch (error) {
            this.showTestResult('Lỗi khi test stream: ' + error.message, 'error');
        } finally {
            testBtn.disabled = false;
            testBtn.innerHTML = '<i class="fas fa-play"></i> Test';
        }
    }
    
    static showTestResult(message, type) {
        const testResult = document.getElementById('streamTestResult');
        testResult.textContent = message;
        testResult.className = `stream-test-result ${type}`;
        testResult.style.display = 'block';
    }
    
    static async saveCamera(formData) {
        try {
            const cameraData = {
                name: formData.get('name'),
                location: formData.get('location'),
                city: formData.get('city'),
                district: formData.get('district'),
                intersection: formData.get('intersection'),
                lines: parseInt(formData.get('lines')) || 3,
                videoUrl: formData.get('videoUrl'),
                streamType: formData.get('streamType')
            };
            
            let result;
            if (this.currentEditingCameraId) {
                // Update existing camera
                result = await window.electronAPI.updateCamera(this.currentEditingCameraId, cameraData);
            } else {
                // Add new camera
                result = await window.electronAPI.addCamera(cameraData);
            }
            
            if (result.success) {
                appState.showNotification('Thành công', result.message, 'success');
                this.closeModal();
                
                // Refresh camera list
                await DataManager.loadCameras();
                UIComponents.populateFilterOptions();
                DashboardManager.renderDashboard();
                
                // Show save button
                document.getElementById('saveDatabaseBtn').style.display = 'block';
            } else {
                appState.showNotification('Lỗi', result.message, 'error');
            }
        } catch (error) {
            console.error('Error saving camera:', error);
            appState.showNotification('Lỗi', 'Không thể lưu camera: ' + error.message, 'error');
        }
    }
    
    static async deleteCamera(cameraId) {
        const camera = appState.cameras.find(c => c.id === cameraId);
        if (!camera) return;
        
        const confirmed = confirm(`Bạn có chắc chắn muốn xóa camera "${camera.name}"?`);
        if (!confirmed) return;
        
        try {
            const result = await window.electronAPI.deleteCamera(cameraId);
            
            if (result.success) {
                appState.showNotification('Thành công', result.message, 'success');
                
                // Refresh camera list
                await DataManager.loadCameras();
                UIComponents.populateFilterOptions();
                DashboardManager.renderDashboard();
                
                // Show save button
                document.getElementById('saveDatabaseBtn').style.display = 'block';
            } else {
                appState.showNotification('Lỗi', result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting camera:', error);
            appState.showNotification('Lỗi', 'Không thể xóa camera: ' + error.message, 'error');
        }
    }
    
    static async saveDatabase() {
        try {
            const result = await window.electronAPI.saveCameraDatabase();
            
            if (result.success) {
                appState.showNotification('Thành công', 'Đã lưu cơ sở dữ liệu', 'success');
                document.getElementById('saveDatabaseBtn').style.display = 'none';
            } else {
                appState.showNotification('Lỗi', result.message, 'error');
            }
        } catch (error) {
            console.error('Error saving database:', error);
            appState.showNotification('Lỗi', 'Không thể lưu cơ sở dữ liệu', 'error');
        }
    }
    
    static setupEventListeners() {
        console.log('Setting up camera management event listeners...');
        
        // Add camera button
        const addCameraBtn = document.getElementById('addCameraBtn');
        if (addCameraBtn) {
            addCameraBtn.addEventListener('click', () => {
                console.log('Add camera button clicked');
                this.openAddCameraModal();
            });
            console.log('Add camera button listener added');
        } else {
            console.error('Add camera button not found');
        }
        
        // Save database button
        const saveDatabaseBtn = document.getElementById('saveDatabaseBtn');
        if (saveDatabaseBtn) {
            saveDatabaseBtn.addEventListener('click', () => {
                console.log('Save database button clicked');
                this.saveDatabase();
            });
            console.log('Save database button listener added');
        } else {
            console.error('Save database button not found');
        }
        
        // Modal close buttons
        const cameraModalClose = document.getElementById('cameraModalClose');
        if (cameraModalClose) {
            cameraModalClose.addEventListener('click', () => {
                console.log('Camera modal close button clicked');
                this.closeModal();
            });
        }
        
        const cancelCameraBtn = document.getElementById('cancelCameraBtn');
        if (cancelCameraBtn) {
            cancelCameraBtn.addEventListener('click', () => {
                console.log('Cancel camera button clicked');
                this.closeModal();
            });
        }
        
        // Test stream button
        document.getElementById('testStreamBtn').addEventListener('click', () => {
            this.testStream();
        });
        
        // Form submission
        document.getElementById('cameraForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Basic validation
            const nameInput = document.getElementById('cameraName');
            const locationInput = document.getElementById('cameraLocation');
            const citySelect = document.getElementById('cameraCity');
            const districtInput = document.getElementById('cameraDistrict');
            
            if (!nameInput.value.trim()) {
                appState.showNotification('Lỗi', 'Vui lòng nhập tên camera', 'error');
                nameInput.focus();
                return;
            }
            
            if (!locationInput.value.trim()) {
                appState.showNotification('Lỗi', 'Vui lòng nhập địa chỉ camera', 'error');
                locationInput.focus();
                return;
            }
            
            if (!citySelect.value) {
                appState.showNotification('Lỗi', 'Vui lòng chọn thành phố', 'error');
                citySelect.focus();
                return;
            }
            
            if (!districtInput.value.trim()) {
                appState.showNotification('Lỗi', 'Vui lòng nhập quận/huyện', 'error');
                districtInput.focus();
                return;
            }
            
            const formData = new FormData(e.target);
            this.saveCamera(formData);
        });
        
        // Camera action buttons (edit/delete) - delegate event handling
        document.addEventListener('click', (e) => {
            if (e.target.closest('.camera-action-small')) {
                const button = e.target.closest('.camera-action-small');
                const action = button.dataset.action;
                const cameraId = button.dataset.cameraId;
                
                if (action === 'edit') {
                    this.openEditCameraModal(cameraId);
                } else if (action === 'delete') {
                    this.deleteCamera(cameraId);
                }
            }
        });
        
        // Close modal when clicking outside
        document.getElementById('cameraModal').addEventListener('click', (e) => {
            if (e.target.id === 'cameraModal') {
                this.closeModal();
            }
        });
    }
}

// Error handling
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    appState.showNotification('Error', 'An unexpected error occurred', 'error');
});

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppState, DataManager, DashboardManager, UIComponents };
}
