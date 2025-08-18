// Advanced Smart Traffic Management System JavaScript

class AdvancedTrafficSystem {
    constructor() {
        this.currentView = 'full';
        this.isSimulationRunning = true;
        this.autoOptimizeEnabled = true;
        this.emergencyMode = false;
        
        // Traffic data simulation
        this.intersections = {
            1: { 
                lightState: 'red', 
                timeRemaining: 25, 
                vehicleCount: 23,
                queueLength: 60,
                averageSpeed: 25,
                density: 'medium'
            },
            2: { 
                lightState: 'green', 
                timeRemaining: 18, 
                vehicleCount: 19,
                queueLength: 40,
                averageSpeed: 32,
                density: 'low'
            },
            3: { 
                lightState: 'yellow', 
                timeRemaining: 3, 
                vehicleCount: 45,
                queueLength: 85,
                averageSpeed: 15,
                density: 'high'
            },
            4: { 
                lightState: 'red', 
                timeRemaining: 32, 
                vehicleCount: 12,
                queueLength: 25,
                averageSpeed: 35,
                density: 'low'
            },
            5: { 
                lightState: 'green', 
                timeRemaining: 15, 
                vehicleCount: 16,
                queueLength: 30,
                averageSpeed: 30,
                density: 'low'
            }
        };
        
        this.performanceMetrics = {
            totalVehicles: 247,
            avgSpeed: 28.5,
            waitingTime: 38,
            efficiency: 91,
            violations: 2
        };
        
        this.refreshInterval = null;
        this.aiAnalysisInterval = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startSimulation();
        this.startAIAnalysis();
        this.updateAllDisplays();
        this.initializeRealtimeUpdates();
    }

    setupEventListeners() {
        // View control buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeView(e.target.dataset.view);
            });
        });

        // Simulation controls
        document.getElementById('pauseSimulation')?.addEventListener('click', () => {
            this.toggleSimulation();
        });

        document.getElementById('resetSimulation')?.addEventListener('click', () => {
            this.resetSimulation();
        });

        document.getElementById('exportData')?.addEventListener('click', () => {
            this.exportData();
        });

        // Manual intersection controls
        document.querySelectorAll('.ctrl-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleManualControl(e);
            });
        });

        // Global controls
        document.getElementById('optimizeAll')?.addEventListener('click', () => {
            this.optimizeAllIntersections();
        });

        document.getElementById('emergencyMode')?.addEventListener('click', () => {
            this.toggleEmergencyMode();
        });

        document.getElementById('syncAll')?.addEventListener('click', () => {
            this.synchronizeAllLights();
        });

        // AI optimization controls
        document.getElementById('autoOptimize')?.addEventListener('click', () => {
            this.toggleAutoOptimize();
        });

        document.getElementById('manualMode')?.addEventListener('click', () => {
            this.setManualMode();
        });

        document.getElementById('emergencyOverride')?.addEventListener('click', () => {
            this.activateEmergencyOverride();
        });

        // Camera controls
        document.getElementById('expandAllCameras')?.addEventListener('click', () => {
            this.expandAllCameras();
        });

        document.getElementById('gridView')?.addEventListener('click', () => {
            this.setCameraGridView();
        });

        document.getElementById('focusView')?.addEventListener('click', () => {
            this.setCameraFocusView();
        });

        // Recommendation actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleRecommendationAction(e);
            });
        });

        // Alert actions
        document.querySelectorAll('.alert-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleAlertAction(e);
            });
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterHistory(e.target.dataset.filter);
            });
        });

        // Time selector
        document.querySelector('.time-selector')?.addEventListener('change', (e) => {
            this.updatePerformanceTimeframe(e.target.value);
        });

        // Refresh buttons
        document.getElementById('refreshRecommendations')?.addEventListener('click', () => {
            this.refreshAIRecommendations();
        });

        document.getElementById('clearAlerts')?.addEventListener('click', () => {
            this.clearAllAlerts();
        });

        // Camera feed interactions
        document.querySelectorAll('.camera-feed-modern').forEach(feed => {
            feed.addEventListener('click', (e) => {
                this.toggleCameraFocus(e.currentTarget.dataset.camera);
            });
        });

        // Intersection hover effects
        document.querySelectorAll('.intersection-group').forEach(group => {
            group.addEventListener('mouseenter', (e) => {
                this.showIntersectionDetails(e.currentTarget.dataset.id);
            });

            group.addEventListener('mouseleave', () => {
                this.hideIntersectionDetails();
            });

            group.addEventListener('click', (e) => {
                this.selectIntersection(e.currentTarget.dataset.id);
            });
        });
    }

    changeView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

        // Apply view transformation
        const roadMap = document.getElementById('roadSimulation');
        if (roadMap) {
            switch(view) {
                case 'full':
                    roadMap.style.transform = 'scale(1)';
                    break;
                case 'focus':
                    roadMap.style.transform = 'scale(1.2)';
                    break;
                case '3d':
                    roadMap.style.transform = 'perspective(1000px) rotateX(15deg) scale(1.1)';
                    break;
            }
        }

        this.showNotification(`Chuyển sang chế độ xem ${this.getViewName(view)}`, 'info');
    }

    getViewName(view) {
        const names = {
            'full': 'toàn tuyến',
            'focus': 'tập trung',
            '3d': '3D'
        };
        return names[view] || view;
    }

    toggleSimulation() {
        this.isSimulationRunning = !this.isSimulationRunning;
        const btn = document.getElementById('pauseSimulation');
        
        if (btn) {
            if (this.isSimulationRunning) {
                btn.innerHTML = '<i class="fas fa-pause"></i>';
                this.startSimulation();
            } else {
                btn.innerHTML = '<i class="fas fa-play"></i>';
                this.stopSimulation();
            }
        }

        this.showNotification(
            this.isSimulationRunning ? 'Mô phỏng đã được tiếp tục' : 'Mô phỏng đã tạm dừng',
            this.isSimulationRunning ? 'success' : 'warning'
        );
    }

    resetSimulation() {
        // Reset all intersection data
        Object.keys(this.intersections).forEach(id => {
            this.intersections[id] = {
                lightState: Math.random() > 0.5 ? 'red' : 'green',
                timeRemaining: Math.floor(Math.random() * 40) + 10,
                vehicleCount: Math.floor(Math.random() * 30) + 5,
                queueLength: Math.floor(Math.random() * 60) + 10,
                averageSpeed: Math.floor(Math.random() * 20) + 20,
                density: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
            };
        });

        this.updateAllDisplays();
        this.showNotification('Mô phỏng đã được đặt lại', 'info');
    }

    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            intersections: this.intersections,
            performanceMetrics: this.performanceMetrics,
            systemStatus: {
                simulationRunning: this.isSimulationRunning,
                autoOptimizeEnabled: this.autoOptimizeEnabled,
                emergencyMode: this.emergencyMode
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `traffic-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Dữ liệu đã được xuất thành công', 'success');
    }

    handleManualControl(e) {
        const action = e.target.dataset.action;
        const intersectionId = e.target.closest('.intersection-control-advanced').dataset.intersection;
        const intersection = this.intersections[intersectionId];
        
        if (!intersection) return;

        switch(action) {
            case 'increase':
                intersection.timeRemaining = Math.min(intersection.timeRemaining + 5, 60);
                break;
            case 'decrease':
                intersection.timeRemaining = Math.max(intersection.timeRemaining - 5, 5);
                break;
            case 'emergency':
                this.activateIntersectionEmergency(intersectionId);
                return;
        }

        this.updateIntersectionDisplay(intersectionId);
        this.showNotification(
            `Đã điều chỉnh thời gian Ngã tư ${intersectionId}: ${intersection.timeRemaining}s`,
            'success'
        );
    }

    optimizeAllIntersections() {
        this.showNotification('AI đang tối ưu hóa toàn bộ tuyến đường...', 'info');
        
        // Simulate AI optimization
        setTimeout(() => {
            Object.keys(this.intersections).forEach(id => {
                const intersection = this.intersections[id];
                
                // AI optimization logic simulation
                if (intersection.density === 'high') {
                    intersection.timeRemaining += 10;
                } else if (intersection.density === 'low') {
                    intersection.timeRemaining = Math.max(intersection.timeRemaining - 5, 15);
                }
                
                // Update queue length and speed based on optimization
                intersection.queueLength = Math.max(intersection.queueLength - 10, 5);
                intersection.averageSpeed = Math.min(intersection.averageSpeed + 5, 40);
            });

            // Update overall performance
            this.performanceMetrics.waitingTime = Math.max(this.performanceMetrics.waitingTime - 8, 20);
            this.performanceMetrics.efficiency = Math.min(this.performanceMetrics.efficiency + 5, 98);

            this.updateAllDisplays();
            this.addHistoryItem(
                'Tối ưu hóa toàn tuyến bằng AI',
                'success',
                'Giảm 18% thời gian chờ, tăng 5% hiệu suất'
            );
            this.showNotification('Tối ưu hóa hoàn tất - Hiệu suất tăng 5%', 'success');
        }, 2000);
    }

    toggleEmergencyMode() {
        this.emergencyMode = !this.emergencyMode;
        const btn = document.getElementById('emergencyMode');
        
        if (btn) {
            if (this.emergencyMode) {
                btn.classList.add('active');
                btn.style.background = '#ef4444';
                // Set all lights to emergency pattern
                Object.keys(this.intersections).forEach(id => {
                    this.intersections[id].lightState = 'yellow';
                    this.intersections[id].timeRemaining = 5;
                });
            } else {
                btn.classList.remove('active');
                btn.style.background = '';
                // Return to normal operation
                this.resetToNormalOperation();
            }
        }

        this.updateAllDisplays();
        this.showNotification(
            this.emergencyMode ? 'Chế độ khẩn cấp đã kích hoạt' : 'Đã thoát khỏi chế độ khẩn cấp',
            this.emergencyMode ? 'warning' : 'success'
        );
    }

    synchronizeAllLights() {
        this.showNotification('Đang đồng bộ hóa tất cả đèn giao thông...', 'info');
        
        setTimeout(() => {
            // Implement wave synchronization
            const baseTime = 30;
            const phaseDelay = 8;
            
            Object.keys(this.intersections).forEach((id, index) => {
                const intersection = this.intersections[id];
                intersection.timeRemaining = baseTime - (index * phaseDelay);
                intersection.lightState = index % 2 === 0 ? 'green' : 'red';
            });

            this.updateAllDisplays();
            this.addHistoryItem(
                'Đồng bộ hóa đèn giao thông',
                'success',
                'Tạo sóng xanh cho toàn tuyến'
            );
            this.showNotification('Đồng bộ hóa hoàn tất - Sóng xanh đã được tạo', 'success');
        }, 1500);
    }

    toggleAutoOptimize() {
        this.autoOptimizeEnabled = !this.autoOptimizeEnabled;
        const btn = document.getElementById('autoOptimize');
        
        if (btn) {
            if (this.autoOptimizeEnabled) {
                btn.classList.add('active');
                this.startAIAnalysis();
            } else {
                btn.classList.remove('active');
                this.stopAIAnalysis();
            }
        }

        this.showNotification(
            this.autoOptimizeEnabled ? 'Tối ưu tự động đã bật' : 'Tối ưu tự động đã tắt',
            this.autoOptimizeEnabled ? 'success' : 'warning'
        );
    }

    setManualMode() {
        this.autoOptimizeEnabled = false;
        this.stopAIAnalysis();
        
        // Update UI
        document.getElementById('autoOptimize')?.classList.remove('active');
        document.getElementById('manualMode')?.classList.add('active');
        
        this.showNotification('Chuyển sang chế độ điều khiển thủ công', 'info');
    }

    activateEmergencyOverride() {
        this.showNotification('Kích hoạt ghi đè khẩn cấp...', 'warning');
        
        // Stop all automated systems
        this.autoOptimizeEnabled = false;
        this.stopAIAnalysis();
        
        // Set emergency pattern
        Object.keys(this.intersections).forEach(id => {
            this.intersections[id].lightState = 'red';
            this.intersections[id].timeRemaining = 60;
        });

        this.updateAllDisplays();
        this.addHistoryItem(
            'Ghi đè khẩn cấp được kích hoạt',
            'warning',
            'Tất cả đèn chuyển sang đỏ'
        );
    }

    expandAllCameras() {
        document.querySelectorAll('.camera-feed-modern').forEach(feed => {
            feed.style.transform = 'scale(1.05)';
            feed.style.zIndex = '10';
        });
        
        setTimeout(() => {
            document.querySelectorAll('.camera-feed-modern').forEach(feed => {
                feed.style.transform = '';
                feed.style.zIndex = '';
            });
        }, 3000);

        this.showNotification('Đã phóng to tất cả camera', 'info');
    }

    setCameraGridView() {
        const grid = document.querySelector('.camera-grid-advanced');
        if (grid) {
            grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
            grid.style.gap = '12px';
        }
        this.showNotification('Chuyển sang chế độ lưới camera', 'info');
    }

    setCameraFocusView() {
        const grid = document.querySelector('.camera-grid-advanced');
        if (grid) {
            grid.style.gridTemplateColumns = '1fr';
            grid.style.gap = '16px';
        }
        this.showNotification('Chuyển sang chế độ tập trung camera', 'info');
    }

    handleRecommendationAction(e) {
        const action = e.target.dataset.action;
        const scenario = e.target.dataset.scenario;
        
        switch(action) {
            case 'apply':
                this.applyRecommendation(scenario);
                break;
            case 'simulate':
                this.simulateRecommendation(scenario);
                break;
            case 'schedule':
                this.scheduleRecommendation(scenario);
                break;
        }
    }

    applyRecommendation(scenario) {
        this.showNotification(`Đang áp dụng kịch bản ${scenario}...`, 'info');
        
        setTimeout(() => {
            // Apply scenario changes based on scenario number
            switch(scenario) {
                case '1':
                    this.intersections[3].timeRemaining += 15;
                    this.intersections[1].timeRemaining -= 8;
                    this.intersections[2].timeRemaining -= 5;
                    break;
                case '2':
                    this.intersections[2].timeRemaining += 5;
                    this.intersections[4].timeRemaining -= 3;
                    break;
                case '3':
                    // Schedule for later
                    break;
            }

            this.updateAllDisplays();
            this.addHistoryItem(
                `Kịch bản ${scenario} - Tối ưu AI`,
                'success',
                'Cải thiện hiệu suất giao thông'
            );
            this.showNotification(`Kịch bản ${scenario} đã được áp dụng thành công`, 'success');
        }, 1500);
    }

    simulateRecommendation(scenario) {
        this.showNotification(`Đang mô phỏng kịch bản ${scenario}...`, 'info');
        
        // Create simulation preview modal
        const modal = this.createSimulationModal(scenario);
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
    }

    scheduleRecommendation(scenario) {
        const time = prompt('Nhập thời gian áp dụng (HH:MM):');
        if (time) {
            this.showNotification(`Kịch bản ${scenario} đã được lên lịch lúc ${time}`, 'success');
            this.addHistoryItem(
                `Lên lịch kịch bản ${scenario}`,
                'scheduled',
                `Sẽ áp dụng lúc ${time}`
            );
        }
    }

    handleAlertAction(e) {
        const action = e.target.textContent.toLowerCase();
        const alertItem = e.target.closest('.alert-item-modern');
        
        if (action.includes('tối ưu')) {
            this.optimizeAllIntersections();
        } else if (action.includes('chi tiết')) {
            this.showAlertDetails(alertItem);
        } else if (action.includes('ảnh')) {
            this.showViolationImage();
        }
    }

    filterHistory(filter) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');

        // Filter timeline items
        document.querySelectorAll('.timeline-item').forEach(item => {
            if (filter === 'all') {
                item.style.display = 'block';
            } else {
                const hasClass = item.classList.contains(filter);
                item.style.display = hasClass ? 'block' : 'none';
            }
        });

        this.showNotification(`Lọc lịch sử: ${this.getFilterName(filter)}`, 'info');
    }

    getFilterName(filter) {
        const names = {
            'all': 'Tất cả',
            'success': 'Thành công',
            'partial': 'Một phần',
            'failed': 'Thất bại'
        };
        return names[filter] || filter;
    }

    updatePerformanceTimeframe(timeframe) {
        this.showNotification(`Cập nhật dữ liệu: ${this.getTimeframeName(timeframe)}`, 'info');
        
        // Simulate data update based on timeframe
        setTimeout(() => {
            this.updatePerformanceCharts();
        }, 500);
    }

    getTimeframeName(timeframe) {
        const names = {
            'realtime': 'Thời gian thực',
            '1hour': '1 giờ qua',
            '24hours': '24 giờ qua',
            '7days': '7 ngày qua'
        };
        return names[timeframe] || timeframe;
    }

    refreshAIRecommendations() {
        const btn = document.getElementById('refreshRecommendations');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';
            btn.disabled = true;
        }

        setTimeout(() => {
            this.generateNewRecommendations();
            if (btn) {
                btn.innerHTML = '<i class="fas fa-sync-alt"></i> Làm mới';
                btn.disabled = false;
            }
            this.showNotification('Đã cập nhật đề xuất mới từ AI', 'success');
        }, 2000);
    }

    clearAllAlerts() {
        document.querySelectorAll('.alert-item-modern').forEach(alert => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateX(100%)';
            setTimeout(() => {
                alert.remove();
            }, 300);
        });

        setTimeout(() => {
            this.showNotification('Đã xóa tất cả cảnh báo', 'info');
        }, 300);
    }

    toggleCameraFocus(cameraId) {
        // Remove focus from all cameras
        document.querySelectorAll('.camera-feed-modern').forEach(feed => {
            feed.classList.remove('focused');
        });

        // Add focus to selected camera
        const targetCamera = document.querySelector(`[data-camera="${cameraId}"]`);
        if (targetCamera) {
            targetCamera.classList.add('focused');
            targetCamera.scrollIntoView({ behavior: 'smooth' });
        }

        this.showNotification(`Tập trung vào Camera ${cameraId}`, 'info');
    }

    showIntersectionDetails(intersectionId) {
        const intersection = this.intersections[intersectionId];
        if (!intersection) return;

        const tooltip = this.createTooltip(`
            <strong>Ngã tư ${intersectionId}</strong><br>
            Trạng thái: ${this.translateLightState(intersection.lightState)}<br>
            Thời gian còn lại: ${intersection.timeRemaining}s<br>
            Số xe: ${intersection.vehicleCount}<br>
            Hàng đợi: ${intersection.queueLength}%<br>
            Tốc độ TB: ${intersection.averageSpeed} km/h<br>
            Mật độ: ${this.translateDensity(intersection.density)}
        `);
        
        document.body.appendChild(tooltip);
    }

    hideIntersectionDetails() {
        const tooltip = document.querySelector('.intersection-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    selectIntersection(intersectionId) {
        // Remove previous selections
        document.querySelectorAll('.intersection-group').forEach(group => {
            group.classList.remove('selected');
        });

        // Add selection to current intersection
        document.querySelector(`[data-id="${intersectionId}"]`)?.classList.add('selected');
        
        this.showNotification(`Đã chọn Ngã tư ${intersectionId}`, 'info');
        
        // Scroll to corresponding control
        const control = document.querySelector(`[data-intersection="${intersectionId}"]`);
        if (control) {
            control.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    startSimulation() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            if (this.isSimulationRunning) {
                this.updateTrafficLights();
                this.updateVehicleMovement();
                this.updatePerformanceMetrics();
                this.updateRealTimeDisplays();
            }
        }, 1000);
    }

    stopSimulation() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    startAIAnalysis() {
        if (this.aiAnalysisInterval) {
            clearInterval(this.aiAnalysisInterval);
        }
        
        this.aiAnalysisInterval = setInterval(() => {
            if (this.autoOptimizeEnabled) {
                this.performAIAnalysis();
            }
        }, 30000); // Every 30 seconds
    }

    stopAIAnalysis() {
        if (this.aiAnalysisInterval) {
            clearInterval(this.aiAnalysisInterval);
            this.aiAnalysisInterval = null;
        }
    }

    updateTrafficLights() {
        Object.keys(this.intersections).forEach(id => {
            const intersection = this.intersections[id];
            
            if (intersection.timeRemaining > 0) {
                intersection.timeRemaining--;
            } else {
                // Switch light state
                switch(intersection.lightState) {
                    case 'red':
                        intersection.lightState = 'green';
                        intersection.timeRemaining = Math.floor(Math.random() * 20) + 15;
                        break;
                    case 'green':
                        intersection.lightState = 'yellow';
                        intersection.timeRemaining = 3;
                        break;
                    case 'yellow':
                        intersection.lightState = 'red';
                        intersection.timeRemaining = Math.floor(Math.random() * 30) + 20;
                        break;
                }
            }
            
            this.updateIntersectionDisplay(id);
        });
    }

    updateVehicleMovement() {
        // Simulate vehicle movement and count changes
        Object.keys(this.intersections).forEach(id => {
            const intersection = this.intersections[id];
            
            // Simulate vehicle flow based on light state
            if (intersection.lightState === 'green') {
                intersection.vehicleCount = Math.max(intersection.vehicleCount - Math.floor(Math.random() * 3), 5);
                intersection.queueLength = Math.max(intersection.queueLength - 5, 10);
            } else if (intersection.lightState === 'red') {
                intersection.vehicleCount += Math.floor(Math.random() * 2);
                intersection.queueLength = Math.min(intersection.queueLength + 3, 100);
            }
            
            // Update speed based on congestion
            if (intersection.queueLength > 70) {
                intersection.averageSpeed = Math.max(intersection.averageSpeed - 1, 10);
                intersection.density = 'high';
            } else if (intersection.queueLength < 30) {
                intersection.averageSpeed = Math.min(intersection.averageSpeed + 1, 40);
                intersection.density = 'low';
            } else {
                intersection.density = 'medium';
            }
        });
    }

    updatePerformanceMetrics() {
        // Calculate overall metrics from intersection data
        const intersectionValues = Object.values(this.intersections);
        
        this.performanceMetrics.totalVehicles = intersectionValues.reduce((sum, i) => sum + i.vehicleCount, 0);
        this.performanceMetrics.avgSpeed = Math.round(
            intersectionValues.reduce((sum, i) => sum + i.averageSpeed, 0) / intersectionValues.length * 10
        ) / 10;
        
        const avgQueueLength = intersectionValues.reduce((sum, i) => sum + i.queueLength, 0) / intersectionValues.length;
        this.performanceMetrics.waitingTime = Math.round(avgQueueLength * 0.6); // Approximate wait time
        this.performanceMetrics.efficiency = Math.max(100 - avgQueueLength, 60);
    }

    updateRealTimeDisplays() {
        // Update time displays
        document.getElementById('lastUpdateTime').textContent = new Date().toLocaleTimeString('vi-VN');
        
        // Update performance metrics
        document.getElementById('totalVehicles').textContent = this.performanceMetrics.totalVehicles;
        document.getElementById('avgSpeed').textContent = this.performanceMetrics.avgSpeed;
        document.getElementById('waitingTime').textContent = this.performanceMetrics.waitingTime;
        document.getElementById('efficiency').textContent = this.performanceMetrics.efficiency + '%';
        document.getElementById('violations').textContent = this.performanceMetrics.violations;
    }

    updateAllDisplays() {
        this.updateRealTimeDisplays();
        this.updateIntersectionDisplays();
        this.updateCameraDisplays();
        this.updateTrafficAnalytics();
        this.updatePerformanceCharts();
    }

    updateIntersectionDisplay(intersectionId) {
        const intersection = this.intersections[intersectionId];
        
        // Update SVG display
        const svgGroup = document.querySelector(`[data-id="${intersectionId}"]`);
        if (svgGroup) {
            // Update traffic lights
            const lights = svgGroup.querySelectorAll('.traffic-light');
            lights.forEach(light => {
                light.classList.remove('active');
                if (light.classList.contains(`${intersection.lightState}-light`)) {
                    light.classList.add('active');
                }
            });
            
            // Update time display
            const timeText = svgGroup.querySelector('.time-remaining');
            if (timeText) {
                timeText.textContent = `${intersection.timeRemaining}s`;
            }
            
            // Update queue indicator
            const queueIndicator = svgGroup.querySelector('.queue-indicator');
            if (queueIndicator) {
                queueIndicator.style.width = `${intersection.queueLength}%`;
            }
        }
        
        // Update control panel
        const controlPanel = document.querySelector(`[data-intersection="${intersectionId}"]`);
        if (controlPanel) {
            const timeValue = controlPanel.querySelector('.time-value');
            if (timeValue) {
                timeValue.textContent = intersection.timeRemaining;
            }
            
            const statusDot = controlPanel.querySelector('.status-dot');
            const currentState = controlPanel.querySelector('.current-state');
            if (statusDot && currentState) {
                statusDot.className = `status-dot ${intersection.lightState}`;
                currentState.textContent = this.translateLightState(intersection.lightState);
            }
        }
        
        // Update traffic light status grid
        const statusItem = document.querySelector(`[data-intersection="${intersectionId}"]`);
        if (statusItem) {
            const lights = statusItem.querySelectorAll('.light');
            lights.forEach(light => {
                light.classList.remove('active');
                if (light.classList.contains(intersection.lightState)) {
                    light.classList.add('active');
                }
            });
            
            const currentState = statusItem.querySelector('.current-state');
            const timeRemaining = statusItem.querySelector('.time-remaining');
            if (currentState) currentState.textContent = `Đèn ${this.translateLightState(intersection.lightState)}`;
            if (timeRemaining) timeRemaining.textContent = `${intersection.timeRemaining}s còn lại`;
        }
    }

    updateIntersectionDisplays() {
        Object.keys(this.intersections).forEach(id => {
            this.updateIntersectionDisplay(id);
        });
    }

    updateCameraDisplays() {
        Object.keys(this.intersections).forEach(id => {
            const camera = document.querySelector(`[data-camera="${id}"]`);
            if (camera) {
                const detectionCount = camera.querySelector('.detection-count');
                if (detectionCount) {
                    detectionCount.textContent = `${this.intersections[id].vehicleCount} xe`;
                }
                
                // Update detection status based on vehicle count
                const detectionStatus = camera.querySelector('.detection-status');
                if (detectionStatus) {
                    if (this.intersections[id].vehicleCount > 30) {
                        detectionStatus.classList.add('congested');
                    } else {
                        detectionStatus.classList.remove('congested');
                    }
                }
                
                // Update AI indicator based on congestion
                const aiIndicator = camera.querySelector('.ai-indicator');
                if (aiIndicator && this.intersections[id].density === 'high') {
                    aiIndicator.classList.add('alert');
                } else if (aiIndicator) {
                    aiIndicator.classList.remove('alert');
                }
                
                // Update metrics
                const metrics = camera.querySelectorAll('.metric-value');
                if (metrics.length >= 3) {
                    const vehicleData = this.generateVehicleBreakdown(this.intersections[id].vehicleCount);
                    metrics[0].textContent = vehicleData.cars;
                    metrics[1].textContent = vehicleData.motorbikes;
                    metrics[2].textContent = vehicleData.trucks;
                }
            }
        });
    }

    updateTrafficAnalytics() {
        // Update density analysis
        Object.keys(this.intersections).forEach((id, index) => {
            const intersection = this.intersections[id];
            const densityItem = document.querySelectorAll('.density-analysis-item')[index];
            
            if (densityItem) {
                const densityFill = densityItem.querySelector('.density-fill');
                const densityValue = densityItem.querySelector('.density-value');
                const statusBadge = densityItem.querySelector('.status-badge');
                
                if (densityFill) {
                    const percentage = this.getDensityPercentage(intersection.density);
                    densityFill.style.width = `${percentage}%`;
                    densityFill.className = `density-fill ${intersection.density}`;
                }
                
                if (densityValue) {
                    densityValue.textContent = `${Math.round(intersection.queueLength * 0.6)} xe/km`;
                }
                
                if (statusBadge) {
                    statusBadge.className = `status-badge ${this.getDensityStatusClass(intersection.density)}`;
                    statusBadge.textContent = this.translateDensity(intersection.density);
                }
            }
        });
    }

    updatePerformanceCharts() {
        // Update mini charts in performance metrics
        document.querySelectorAll('.metric-chart').forEach(chart => {
            const bars = chart.querySelectorAll('.chart-bar');
            bars.forEach(bar => {
                const height = Math.random() * 80 + 20;
                bar.style.height = `${height}%`;
            });
        });
    }

    performAIAnalysis() {
        // Simulate AI analysis for congested intersections
        Object.keys(this.intersections).forEach(id => {
            const intersection = this.intersections[id];
            
            if (intersection.density === 'high' && intersection.queueLength > 70) {
                // Auto-optimize high congestion areas
                if (intersection.lightState === 'red') {
                    intersection.timeRemaining = Math.max(intersection.timeRemaining - 5, 5);
                } else if (intersection.lightState === 'green') {
                    intersection.timeRemaining += 10;
                }
                
                this.updateIntersectionDisplay(id);
                this.generateAlert('AI Tối ưu', `Tự động điều chỉnh Ngã tư ${id} do tắc nghẽn`);
            }
        });
    }

    generateAlert(title, description, type = 'info') {
        const alertsContainer = document.querySelector('.alerts-content');
        if (!alertsContainer) return;

        const alert = document.createElement('div');
        alert.className = `alert-item-modern ${type === 'warning' ? 'medium-priority' : 'low-priority'}`;
        alert.innerHTML = `
            <div class="alert-indicator">
                <i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            </div>
            <div class="alert-content-modern">
                <div class="alert-header">
                    <span class="alert-title">${title}</span>
                    <span class="alert-time">Vừa xong</span>
                </div>
                <div class="alert-description">${description}</div>
            </div>
        `;

        alertsContainer.insertBefore(alert, alertsContainer.firstChild);

        // Remove old alerts if too many
        const alerts = alertsContainer.querySelectorAll('.alert-item-modern');
        if (alerts.length > 5) {
            alerts[alerts.length - 1].remove();
        }
    }

    generateNewRecommendations() {
        // Simulate generating new AI recommendations
        const scenarios = [
            {
                title: 'Kịch bản mới - Tối ưu giờ cao điểm',
                changes: ['Ngã tư 1: +12s', 'Ngã tư 3: +8s', 'Ngã tư 5: -5s'],
                results: ['Giảm 25% thời gian chờ', 'Tăng 18% thông lượng']
            }
        ];
        
        // Implementation would update the recommendations grid
        this.showNotification('Đã tạo kịch bản tối ưu mới', 'success');
    }

    generateVehicleBreakdown(totalVehicles) {
        const cars = Math.floor(totalVehicles * 0.6);
        const motorbikes = Math.floor(totalVehicles * 0.3);
        const trucks = totalVehicles - cars - motorbikes;
        
        return { cars, motorbikes, trucks };
    }

    getDensityPercentage(density) {
        const percentages = { low: 30, medium: 60, high: 85 };
        return percentages[density] || 50;
    }

    getDensityStatusClass(density) {
        const classes = { low: 'smooth', medium: 'moderate', high: 'congested' };
        return classes[density] || 'moderate';
    }

    translateLightState(state) {
        const translations = { red: 'đỏ', yellow: 'vàng', green: 'xanh' };
        return translations[state] || state;
    }

    translateDensity(density) {
        const translations = { low: 'Thông thoáng', medium: 'Vừa phải', high: 'Tắc nghẽn' };
        return translations[density] || density;
    }

    addHistoryItem(title, status, description) {
        const historyContainer = document.querySelector('.history-timeline');
        if (!historyContainer) return;

        const item = document.createElement('div');
        item.className = `timeline-item ${status}`;
        item.innerHTML = `
            <div class="timeline-marker ${status}">
                <i class="fas fa-${status === 'success' ? 'check' : status === 'warning' ? 'exclamation-triangle' : 'info'}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <span class="timeline-title">${title}</span>
                    <span class="timeline-time">${new Date().toLocaleTimeString('vi-VN')} - Hôm nay</span>
                </div>
                <div class="timeline-description">${description}</div>
                <div class="timeline-results">
                    <span class="result-badge ${status}">Đã áp dụng</span>
                </div>
            </div>
        `;

        historyContainer.insertBefore(item, historyContainer.firstChild);

        // Keep only last 10 items
        const items = historyContainer.querySelectorAll('.timeline-item');
        if (items.length > 10) {
            items[items.length - 1].remove();
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
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            max-width: 250px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        `;

        // Position tooltip near mouse
        document.addEventListener('mousemove', (e) => {
            if (tooltip.parentNode) {
                tooltip.style.left = `${e.clientX + 15}px`;
                tooltip.style.top = `${e.clientY - 10}px`;
            }
        });

        return tooltip;
    }

    createSimulationModal(scenario) {
        const modal = document.createElement('div');
        modal.className = 'simulation-modal-overlay';
        modal.innerHTML = `
            <div class="simulation-modal">
                <div class="modal-header">
                    <h3>Mô phỏng Kịch bản ${scenario}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="simulation-preview">
                        <h4>Dự đoán kết quả:</h4>
                        <div class="result-metrics">
                            <div class="metric">
                                <span class="metric-label">Thời gian chờ:</span>
                                <span class="metric-value positive">-18%</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Thông lượng:</span>
                                <span class="metric-value positive">+12%</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Tắc nghẽn:</span>
                                <span class="metric-value positive">-15%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Close functionality
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 300);
            }
        });

        return modal;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            z-index: 1500;
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(100%);
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 350px;
            font-weight: 500;
            backdrop-filter: blur(10px);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 400);
        }, 4000);
    }

    initializeRealtimeUpdates() {
        // Update time every second
        setInterval(() => {
            document.getElementById('lastUpdateTime').textContent = new Date().toLocaleTimeString('vi-VN');
        }, 1000);

        // Simulate random events
        setInterval(() => {
            if (Math.random() > 0.8) {
                this.generateRandomEvent();
            }
        }, 15000);
    }

    generateRandomEvent() {
        const events = [
            { type: 'violation', message: 'Phát hiện vi phạm vượt đèn đỏ tại Ngã tư 2' },
            { type: 'congestion', message: 'Tắc nghẽn nhẹ phát hiện tại Ngã tư 4' },
            { type: 'optimization', message: 'AI đã tối ưu tự động chu kỳ đèn Ngã tư 1' },
            { type: 'clear', message: 'Giao thông đã trở lại bình thường tại Ngã tư 3' }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        this.generateAlert('Sự kiện tự động', event.message, event.type === 'violation' ? 'warning' : 'info');
    }

    // Emergency functions
    activateIntersectionEmergency(intersectionId) {
        const intersection = this.intersections[intersectionId];
        intersection.lightState = 'red';
        intersection.timeRemaining = 60;
        
        this.updateIntersectionDisplay(intersectionId);
        this.showNotification(`Kích hoạt khẩn cấp tại Ngã tư ${intersectionId}`, 'warning');
        this.addHistoryItem(
            `Khẩn cấp Ngã tư ${intersectionId}`,
            'warning',
            'Chuyển sang đèn đỏ khẩn cấp'
        );
    }

    resetToNormalOperation() {
        Object.keys(this.intersections).forEach(id => {
            const intersection = this.intersections[id];
            intersection.lightState = Math.random() > 0.5 ? 'red' : 'green';
            intersection.timeRemaining = Math.floor(Math.random() * 30) + 20;
        });
        
        this.updateAllDisplays();
    }

    // Data export and analysis
    exportSystemReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalVehicles: this.performanceMetrics.totalVehicles,
                averageWaitTime: this.performanceMetrics.waitingTime,
                systemEfficiency: this.performanceMetrics.efficiency,
                violationsDetected: this.performanceMetrics.violations
            },
            intersections: this.intersections,
            recommendations: this.getActiveRecommendations(),
            alerts: this.getActiveAlerts()
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `traffic-report-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getActiveRecommendations() {
        // Return current AI recommendations
        return [];
    }

    getActiveAlerts() {
        // Return current active alerts
        return [];
    }
}

// Initialize the advanced system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.advancedTrafficSystem = new AdvancedTrafficSystem();
    
    // Add some additional event listeners for advanced features
    document.addEventListener('keydown', (e) => {
        // Keyboard shortcuts
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            window.advancedTrafficSystem.exportSystemReport();
        }
        
        if (e.key === 'Escape') {
            // Close any open modals
            document.querySelectorAll('.simulation-modal-overlay').forEach(modal => {
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 300);
            });
        }
    });
    
    // Add visibility change handler
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause some heavy operations when tab is not visible
            window.advancedTrafficSystem.isSimulationRunning = false;
        } else {
            // Resume when tab becomes visible again
            window.advancedTrafficSystem.isSimulationRunning = true;
        }
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedTrafficSystem };
}
