// Smart Traffic Light System JavaScript

class SmartTrafficSystem {
    constructor() {
        this.currentView = 'overview';
        this.intersections = {
            1: { lightState: 'red', timeRemaining: 25 },
            2: { lightState: 'green', timeRemaining: 18 },
            3: { lightState: 'yellow', timeRemaining: 3 },
            4: { lightState: 'red', timeRemaining: 32 },
            5: { lightState: 'green', timeRemaining: 15 }
        };
        this.vehicles = [];
        this.simulationRunning = false;
        this.refreshInterval = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startSimulation();
        this.generateVehicles();
        this.updateTrafficStats();
    }

    setupEventListeners() {
        // View control buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeView(e.target.dataset.view);
            });
        });

        // Manual controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleManualControl(e);
            });
        });

        // Camera controls
        document.getElementById('expandAll')?.addEventListener('click', () => {
            this.expandAllCameras();
        });

        document.getElementById('hideAll')?.addEventListener('click', () => {
            this.hideAllCameras();
        });

        // Scenario actions
        document.querySelectorAll('.btn-apply').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyScenario(e);
            });
        });

        document.querySelectorAll('.btn-simulate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.simulateScenario(e);
            });
        });

        // Refresh scenarios
        document.getElementById('refreshScenarios')?.addEventListener('click', () => {
            this.refreshScenarios();
        });

        // Intersection hover effects
        document.querySelectorAll('.intersection').forEach(intersection => {
            intersection.addEventListener('mouseenter', (e) => {
                this.showIntersectionDetails(e.target.dataset.id);
            });

            intersection.addEventListener('mouseleave', () => {
                this.hideIntersectionDetails();
            });

            intersection.addEventListener('click', (e) => {
                this.selectIntersection(e.target.dataset.id);
            });
        });

        // Camera feed interactions
        document.querySelectorAll('.camera-feed').forEach(feed => {
            feed.addEventListener('click', (e) => {
                this.toggleCameraFeed(e.currentTarget.dataset.camera);
            });
        });
    }

    changeView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Update road map view
        const roadMap = document.getElementById('roadMap');
        if (view === 'detailed') {
            roadMap.style.transform = 'scale(1.5)';
            roadMap.style.transformOrigin = 'center';
        } else {
            roadMap.style.transform = 'scale(1)';
        }

        this.showNotification(`Chuyển sang chế độ xem ${view === 'overview' ? 'toàn tuyến' : 'chi tiết'}`, 'info');
    }

    handleManualControl(e) {
        const action = e.target.dataset.action;
        const intersectionControl = e.target.closest('.intersection-control');
        const intersectionId = intersectionControl.dataset.intersection;
        const timeDisplay = intersectionControl.querySelector('.time-display');
        
        let currentTime = parseInt(timeDisplay.textContent);
        
        if (action === 'increase') {
            currentTime = Math.min(currentTime + 5, 60);
        } else if (action === 'decrease') {
            currentTime = Math.max(currentTime - 5, 5);
        }

        timeDisplay.textContent = `${currentTime}s`;
        this.intersections[intersectionId].timeRemaining = currentTime;

        // Update the SVG display
        const svgText = document.querySelector(`.intersection[data-id="${intersectionId}"] text:last-child`);
        if (svgText) {
            svgText.textContent = `${currentTime}s`;
        }

        this.showNotification(`Đã điều chỉnh thời gian đèn Ngã tư ${intersectionId}: ${currentTime}s`, 'success');
        this.logScenarioHistory(`Điều chỉnh thủ công Ngã tư ${intersectionId}`, 'manual');
    }

    expandAllCameras() {
        document.querySelectorAll('.camera-feed').forEach(feed => {
            feed.style.transform = 'scale(1.1)';
            feed.style.zIndex = '10';
        });
        this.showNotification('Đã phóng to tất cả camera', 'info');
    }

    hideAllCameras() {
        document.querySelectorAll('.camera-feed').forEach(feed => {
            feed.style.transform = 'scale(0.8)';
            feed.style.opacity = '0.7';
        });
        this.showNotification('Đã thu nhỏ tất cả camera', 'info');
        
        // Reset after 3 seconds
        setTimeout(() => {
            document.querySelectorAll('.camera-feed').forEach(feed => {
                feed.style.transform = 'scale(1)';
                feed.style.opacity = '1';
                feed.style.zIndex = 'auto';
            });
        }, 3000);
    }

    toggleCameraFeed(cameraId) {
        const feed = document.querySelector(`[data-camera="${cameraId}"]`);
        const isExpanded = feed.classList.contains('expanded');
        
        // Reset all cameras
        document.querySelectorAll('.camera-feed').forEach(f => {
            f.classList.remove('expanded');
            f.style.transform = 'scale(1)';
            f.style.zIndex = 'auto';
        });

        if (!isExpanded) {
            feed.classList.add('expanded');
            feed.style.transform = 'scale(1.3)';
            feed.style.zIndex = '20';
            this.showNotification(`Đã phóng to Camera ${cameraId}`, 'info');
        }
    }

    applyScenario(e) {
        const scenarioCard = e.target.closest('.scenario-card');
        const scenarioTitle = scenarioCard.querySelector('h4').textContent;
        
        // Show loading state
        e.target.disabled = true;
        e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang áp dụng...';

        // Simulate applying scenario
        setTimeout(() => {
            this.implementScenario(scenarioCard);
            e.target.disabled = false;
            e.target.innerHTML = '<i class="fas fa-check"></i> Đã áp dụng';
            
            setTimeout(() => {
                e.target.innerHTML = '<i class="fas fa-play"></i> Áp dụng';
            }, 2000);

            this.showNotification(`Đã áp dụng thành công: ${scenarioTitle}`, 'success');
            this.logScenarioHistory(scenarioTitle, 'success');
        }, 2000);
    }

    simulateScenario(e) {
        const scenarioCard = e.target.closest('.scenario-card');
        const scenarioTitle = scenarioCard.querySelector('h4').textContent;

        // Show simulation modal or effect
        this.showSimulationPreview(scenarioCard);
        this.showNotification(`Đang mô phỏng: ${scenarioTitle}`, 'info');
    }

    implementScenario(scenarioCard) {
        const changes = scenarioCard.querySelectorAll('.change-item');
        
        changes.forEach(change => {
            const location = change.querySelector('.change-location').textContent;
            const action = change.querySelector('.change-action').textContent;
            
            // Parse and apply changes
            if (location.includes('Ngã tư')) {
                const intersectionId = location.match(/\d+/)[0];
                this.applyTrafficLightChange(intersectionId, action);
            }
        });

        this.updateTrafficStats();
        this.updateIntersectionDisplays();
    }

    applyTrafficLightChange(intersectionId, action) {
        const currentTime = this.intersections[intersectionId].timeRemaining;
        let newTime = currentTime;

        if (action.includes('+')) {
            const increase = parseInt(action.match(/\+(\d+)/)?.[1] || 0);
            newTime = Math.min(currentTime + increase, 60);
        } else if (action.includes('-')) {
            const decrease = parseInt(action.match(/-(\d+)/)?.[1] || 0);
            newTime = Math.max(currentTime - decrease, 5);
        }

        this.intersections[intersectionId].timeRemaining = newTime;
        
        // Update displays
        const timeDisplay = document.querySelector(`[data-intersection="${intersectionId}"] .time-display`);
        if (timeDisplay) {
            timeDisplay.textContent = `${newTime}s`;
        }

        const svgText = document.querySelector(`.intersection[data-id="${intersectionId}"] text:last-child`);
        if (svgText) {
            svgText.textContent = `${newTime}s`;
        }
    }

    showSimulationPreview(scenarioCard) {
        // Create simulation overlay
        const overlay = document.createElement('div');
        overlay.className = 'simulation-overlay';
        overlay.innerHTML = `
            <div class="simulation-modal">
                <div class="simulation-header">
                    <h3>Mô phỏng kết quả</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="simulation-content">
                    <div class="simulation-chart">
                        <canvas id="simulationChart" width="400" height="200"></canvas>
                    </div>
                    <div class="simulation-stats">
                        <div class="stat">
                            <span class="label">Thời gian chờ trung bình:</span>
                            <span class="value">-12%</span>
                        </div>
                        <div class="stat">
                            <span class="label">Mức độ tắc nghẽn:</span>
                            <span class="value">-8%</span>
                        </div>
                        <div class="stat">
                            <span class="label">Thông lượng xe:</span>
                            <span class="value">+15%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Close functionality
        overlay.querySelector('.close-btn').addEventListener('click', () => {
            overlay.remove();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    refreshScenarios() {
        const refreshBtn = document.getElementById('refreshScenarios');
        const scenariosGrid = document.querySelector('.scenarios-grid');
        
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';
        scenariosGrid.classList.add('loading');

        // Simulate API call
        setTimeout(() => {
            this.generateNewScenarios();
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Làm mới';
            scenariosGrid.classList.remove('loading');
            this.showNotification('Đã cập nhật kịch bản mới', 'success');
        }, 2000);
    }

    generateNewScenarios() {
        const scenarios = [
            {
                title: 'Kịch bản 4 - Tối ưu giờ cao điểm',
                changes: [
                    { location: 'Ngã tư 1', action: 'Đèn xanh +15s' },
                    { location: 'Ngã tư 4', action: 'Đèn đỏ -8s' }
                ],
                predictions: [
                    { icon: 'fas fa-arrow-down', text: 'Giảm 18% thời gian chờ', color: 'green' },
                    { icon: 'fas fa-arrow-down', text: 'Giảm 12% tắc nghẽn', color: 'green' }
                ]
            }
        ];

        // Add new scenario to the grid (this would typically replace existing scenarios)
        // Implementation would depend on specific requirements
    }

    showIntersectionDetails(intersectionId) {
        const intersection = this.intersections[intersectionId];
        const tooltip = this.createTooltip(`
            <strong>Ngã tư ${intersectionId}</strong><br>
            Trạng thái: ${this.translateLightState(intersection.lightState)}<br>
            Thời gian còn lại: ${intersection.timeRemaining}s<br>
            Mật độ: ${this.getRandomDensity()} xe/km
        `);
        
        document.body.appendChild(tooltip);
    }

    hideIntersectionDetails() {
        const tooltip = document.querySelector('.intersection-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    createTooltip(content) {
        const tooltip = document.createElement('div');
        tooltip.className = 'intersection-tooltip';
        tooltip.innerHTML = content;
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            max-width: 200px;
        `;

        // Position tooltip near mouse
        document.addEventListener('mousemove', (e) => {
            tooltip.style.left = e.clientX + 10 + 'px';
            tooltip.style.top = e.clientY + 10 + 'px';
        });

        return tooltip;
    }

    translateLightState(state) {
        const translations = {
            'red': 'Đèn đỏ',
            'yellow': 'Đèn vàng',
            'green': 'Đèn xanh'
        };
        return translations[state] || state;
    }

    getRandomDensity() {
        return Math.floor(Math.random() * 40) + 10;
    }

    selectIntersection(intersectionId) {
        // Remove previous selections
        document.querySelectorAll('.intersection').forEach(int => {
            int.classList.remove('selected');
        });

        // Add selection to current intersection
        document.querySelector(`[data-id="${intersectionId}"]`).classList.add('selected');
        
        this.showNotification(`Đã chọn Ngã tư ${intersectionId}`, 'info');
    }

    startSimulation() {
        this.simulationRunning = true;
        this.refreshInterval = setInterval(() => {
            this.updateTrafficLights();
            this.moveVehicles();
            this.updateDensityIndicators();
        }, 1000);
    }

    stopSimulation() {
        this.simulationRunning = false;
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    updateTrafficLights() {
        Object.keys(this.intersections).forEach(id => {
            const intersection = this.intersections[id];
            intersection.timeRemaining = Math.max(0, intersection.timeRemaining - 1);

            if (intersection.timeRemaining === 0) {
                // Switch light state
                switch (intersection.lightState) {
                    case 'red':
                        intersection.lightState = 'green';
                        intersection.timeRemaining = Math.floor(Math.random() * 30) + 20;
                        break;
                    case 'green':
                        intersection.lightState = 'yellow';
                        intersection.timeRemaining = 3;
                        break;
                    case 'yellow':
                        intersection.lightState = 'red';
                        intersection.timeRemaining = Math.floor(Math.random() * 40) + 20;
                        break;
                }
            }

            this.updateIntersectionDisplay(id);
        });
    }

    updateIntersectionDisplay(intersectionId) {
        const intersection = this.intersections[intersectionId];
        
        // Update SVG lights
        const lights = document.querySelectorAll(`.intersection[data-id="${intersectionId}"] .traffic-light`);
        lights.forEach(light => {
            light.classList.remove('active');
            if (light.classList.contains(`${intersection.lightState}-light`)) {
                light.classList.add('active');
            }
        });

        // Update time display in SVG
        const timeText = document.querySelector(`.intersection[data-id="${intersectionId}"] text:last-child`);
        if (timeText) {
            timeText.textContent = `${intersection.timeRemaining}s`;
        }

        // Update manual control display
        const manualDisplay = document.querySelector(`[data-intersection="${intersectionId}"] .time-display`);
        if (manualDisplay) {
            manualDisplay.textContent = `${intersection.timeRemaining}s`;
        }

        // Update traffic info panel
        const statusElement = document.querySelector(`.light-status:nth-child(${intersectionId}) .status`);
        if (statusElement) {
            statusElement.className = `status ${intersection.lightState}`;
            statusElement.textContent = `${this.translateLightState(intersection.lightState)} - ${intersection.timeRemaining}s`;
        }
    }

    updateIntersectionDisplays() {
        Object.keys(this.intersections).forEach(id => {
            this.updateIntersectionDisplay(id);
        });
    }

    generateVehicles() {
        const vehicleCount = Math.floor(Math.random() * 10) + 5;
        for (let i = 0; i < vehicleCount; i++) {
            this.vehicles.push({
                id: i,
                x: Math.random() * 700 + 50,
                y: 180 + Math.random() * 20,
                speed: Math.random() * 2 + 1,
                color: this.getRandomColor()
            });
        }
    }

    getRandomColor() {
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    moveVehicles() {
        this.vehicles.forEach(vehicle => {
            vehicle.x += vehicle.speed;
            if (vehicle.x > 800) {
                vehicle.x = 0;
            }

            // Update vehicle position in SVG
            const vehicleElement = document.querySelector(`[data-vehicle-id="${vehicle.id}"]`);
            if (vehicleElement) {
                vehicleElement.setAttribute('x', vehicle.x);
            }
        });
    }

    updateDensityIndicators() {
        const densityLevels = ['low', 'medium', 'high'];
        document.querySelectorAll('.density-indicator').forEach((indicator, index) => {
            const randomLevel = densityLevels[Math.floor(Math.random() * densityLevels.length)];
            indicator.className = `density-indicator ${randomLevel}`;
        });
    }

    updateTrafficStats() {
        // Update dashboard stats
        const vehicleCount = document.querySelector('.stat-value');
        if (vehicleCount && vehicleCount.textContent !== 'Normal') {
            vehicleCount.textContent = Math.floor(Math.random() * 50) + 100;
        }

        // Update density values
        document.querySelectorAll('.density-item .value').forEach(value => {
            const density = Math.floor(Math.random() * 40) + 10;
            const level = density < 20 ? 'low' : density < 35 ? 'medium' : 'high';
            value.className = `value ${level}`;
            value.textContent = `${density} xe/km`;
        });

        // Generate random alerts
        if (Math.random() > 0.7) {
            this.generateAlert();
        }
    }

    generateAlert() {
        const alertTypes = [
            { type: 'warning', title: 'Tắc nghẽn nhẹ', text: 'Ngã tư 2 - Mật độ xe tăng' },
            { type: 'info', title: 'Giao thông bình thường', text: 'Tất cả ngã tư hoạt động tốt' },
            { type: 'warning', title: 'Vi phạm phát hiện', text: 'Ngã tư 4 - Xe vượt đèn đỏ' }
        ];

        const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        this.addAlert(alert);
    }

    addAlert(alert) {
        const alertsList = document.querySelector('.alerts-list');
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alert.type}`;
        alertElement.innerHTML = `
            <i class="fas fa-${alert.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <div class="alert-content">
                <span class="alert-title">${alert.title}</span>
                <span class="alert-text">${alert.text}</span>
            </div>
            <span class="alert-time">Vừa xong</span>
        `;

        alertsList.insertBefore(alertElement, alertsList.firstChild);

        // Remove old alerts if too many
        const alerts = alertsList.querySelectorAll('.alert-item');
        if (alerts.length > 5) {
            alerts[alerts.length - 1].remove();
        }
    }

    logScenarioHistory(scenarioName, result) {
        const historyList = document.querySelector('.history-list');
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + 
                          ' - ' + now.toLocaleDateString('vi-VN');

        historyItem.innerHTML = `
            <div class="history-info">
                <span class="history-scenario">${scenarioName}</span>
                <span class="history-time">${timeString}</span>
            </div>
            <div class="history-result ${result}">
                <i class="fas fa-${result === 'success' ? 'check-circle' : result === 'manual' ? 'hand-paper' : 'exclamation-circle'}"></i>
                <span>${result === 'success' ? 'Thành công' : result === 'manual' ? 'Thủ công' : 'Một phần'}</span>
            </div>
        `;

        historyList.insertBefore(historyItem, historyList.firstChild);

        // Keep only last 10 items
        const items = historyList.querySelectorAll('.history-item');
        if (items.length > 10) {
            items[items.length - 1].remove();
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize the system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.smartTrafficSystem = new SmartTrafficSystem();
});

// Additional utility functions for API integration
class TrafficAPI {
    static async getCameraFeeds() {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { id: 1, url: '/api/camera/1/stream', status: 'online' },
                    { id: 2, url: '/api/camera/2/stream', status: 'online' },
                    { id: 3, url: '/api/camera/3/stream', status: 'online' },
                    { id: 4, url: '/api/camera/4/stream', status: 'online' },
                    { id: 5, url: '/api/camera/5/stream', status: 'online' }
                ]);
            }, 1000);
        });
    }

    static async getTrafficData() {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    intersections: [
                        { id: 1, density: 25, waitTime: 45, violations: 0 },
                        { id: 2, density: 18, waitTime: 32, violations: 1 },
                        { id: 3, density: 42, waitTime: 78, violations: 0 },
                        { id: 4, density: 15, waitTime: 28, violations: 0 },
                        { id: 5, density: 31, waitTime: 55, violations: 2 }
                    ],
                    overallStatus: 'normal'
                });
            }, 800);
        });
    }

    static async getOptimizationScenarios() {
        // Simulate AI-generated scenarios
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        id: 1,
                        name: 'Giảm tắc nghẽn',
                        changes: [
                            { intersection: 3, action: 'extend_green', duration: 10 },
                            { intersection: 1, action: 'reduce_red', duration: 5 }
                        ],
                        predicted_improvement: {
                            wait_time: -15,
                            congestion: -8,
                            throughput: 12
                        },
                        confidence: 0.85
                    }
                ]);
            }, 1200);
        });
    }

    static async applyScenario(scenarioId) {
        // Simulate applying scenario to real traffic lights
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% success rate
                    resolve({ success: true, message: 'Scenario applied successfully' });
                } else {
                    reject({ success: false, error: 'Failed to communicate with traffic lights' });
                }
            }, 2000);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SmartTrafficSystem, TrafficAPI };
}
