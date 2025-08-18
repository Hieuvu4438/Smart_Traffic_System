const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png'), // Optional: Add your app icon
        titleBarStyle: 'default',
        show: false, // Don't show until ready
        backgroundColor: '#f5f5f5'
    });

    // Load the app
    mainWindow.loadFile('index.html');

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    // Emitted when the window is closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Camera storage (in production, use database)
let cameraDatabase = [
    { 
        id: 'CAM-HN001', 
        name: 'Ngã tư Hoàn Kiếm', 
        location: 'Phố Đinh Tiên Hoàng - Lê Thái Tổ',
        city: 'hanoi',
        district: 'Hoàn Kiếm',
        intersection: 'major',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        streamType: 'http',
        status: 'online',
        lines: 4,
        createdAt: new Date().toISOString()
    },
    { 
        id: 'CAM-HCM002', 
        name: 'Ngã tư Nguyễn Huệ', 
        location: 'Đường Nguyễn Huệ - Đồng Khởi',
        city: 'hcmc',
        district: 'Quận 1',
        intersection: 'major',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
        streamType: 'http',
        status: 'online',
        lines: 6,
        createdAt: new Date().toISOString()
    },
    { 
        id: 'CAM-DN003', 
        name: 'Cầu Rồng', 
        location: 'Đường Trần Hưng Đạo - Bạch Đằng',
        city: 'danang',
        district: 'Hải Châu',
        intersection: 'major',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
        streamType: 'http',
        status: 'online',
        lines: 4,
        createdAt: new Date().toISOString()
    },
    { 
        id: 'CAM-HN004', 
        name: 'Vòng xuyến Cầu Giấy', 
        location: 'Đường Cầu Giấy - Nguyễn Chánh',
        city: 'hanoi',
        district: 'Cầu Giấy',
        intersection: 'medium',
        videoUrl: '',
        streamType: 'http',
        status: 'maintenance',
        lines: 5,
        createdAt: new Date().toISOString()
    }
];

// IPC handlers for communication with renderer process
ipcMain.handle('getMetrics', async (event, cameraId) => {
    // Mock data - replace with actual backend calls
    return generateMockMetrics(cameraId);
});

ipcMain.handle('getCameraList', async () => {
    return cameraDatabase;
});

// Add new camera
ipcMain.handle('addCamera', async (event, cameraData) => {
    try {
        // Generate unique ID
        const timestamp = Date.now();
        const cityPrefix = cameraData.city.toUpperCase().substring(0, 2);
        const newId = `CAM-${cityPrefix}${timestamp.toString().slice(-3)}`;
        
        const newCamera = {
            id: newId,
            name: cameraData.name,
            location: cameraData.location,
            city: cameraData.city,
            district: cameraData.district,
            intersection: cameraData.intersection || 'medium',
            videoUrl: cameraData.videoUrl || '',
            streamType: cameraData.streamType || 'http',
            status: cameraData.videoUrl ? 'online' : 'offline',
            lines: cameraData.lines || 3,
            createdAt: new Date().toISOString()
        };
        
        cameraDatabase.push(newCamera);
        console.log(`Camera added: ${newId}`);
        
        return { 
            success: true, 
            camera: newCamera,
            message: `Camera ${newId} đã được thêm thành công` 
        };
    } catch (error) {
        console.error('Error adding camera:', error);
        return { 
            success: false, 
            message: 'Không thể thêm camera: ' + error.message 
        };
    }
});

// Delete camera
ipcMain.handle('deleteCamera', async (event, cameraId) => {
    try {
        const index = cameraDatabase.findIndex(cam => cam.id === cameraId);
        if (index === -1) {
            return { 
                success: false, 
                message: 'Không tìm thấy camera' 
            };
        }
        
        const deletedCamera = cameraDatabase.splice(index, 1)[0];
        console.log(`Camera deleted: ${cameraId}`);
        
        return { 
            success: true,
            camera: deletedCamera,
            message: `Camera ${cameraId} đã được xóa thành công` 
        };
    } catch (error) {
        console.error('Error deleting camera:', error);
        return { 
            success: false, 
            message: 'Không thể xóa camera: ' + error.message 
        };
    }
});

// Update camera
ipcMain.handle('updateCamera', async (event, cameraId, updateData) => {
    try {
        const camera = cameraDatabase.find(cam => cam.id === cameraId);
        if (!camera) {
            return { 
                success: false, 
                message: 'Không tìm thấy camera' 
            };
        }
        
        // Update camera properties
        Object.assign(camera, updateData, {
            updatedAt: new Date().toISOString()
        });
        
        console.log(`Camera updated: ${cameraId}`);
        
        return { 
            success: true,
            camera: camera,
            message: `Camera ${cameraId} đã được cập nhật thành công` 
        };
    } catch (error) {
        console.error('Error updating camera:', error);
        return { 
            success: false, 
            message: 'Không thể cập nhật camera: ' + error.message 
        };
    }
});

ipcMain.handle('getTrafficHistory', async (cameraId, timeRange) => {
    // Mock history data - replace with actual backend calls
    return generateMockHistory(cameraId, timeRange);
});

ipcMain.handle('exportData', async (data, format) => {
    // Handle data export - replace with actual implementation
    console.log('Exporting data:', format);
    return { success: true, message: 'Data exported successfully' };
});

// Test camera stream URL
ipcMain.handle('testCameraStream', async (event, videoUrl, streamType) => {
    try {
        // In production, you would actually test the stream
        // For now, simulate testing
        console.log(`Testing stream: ${videoUrl} (${streamType})`);
        
        // Simulate different test results
        const random = Math.random();
        if (random > 0.8) {
            return {
                success: false,
                message: 'Không thể kết nối đến stream'
            };
        }
        
        return {
            success: true,
            message: 'Stream hoạt động bình thường',
            info: {
                latency: Math.floor(Math.random() * 100) + 50,
                quality: ['720p', '1080p', '4K'][Math.floor(Math.random() * 3)],
                fps: [25, 30, 60][Math.floor(Math.random() * 3)]
            }
        };
    } catch (error) {
        return {
            success: false,
            message: 'Lỗi khi test stream: ' + error.message
        };
    }
});

// Save camera database to file (in production, use real database)
ipcMain.handle('saveCameraDatabase', async () => {
    try {
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.join(__dirname, 'cameras.json');
        
        fs.writeFileSync(dbPath, JSON.stringify(cameraDatabase, null, 2));
        return { success: true, message: 'Database saved successfully' };
    } catch (error) {
        console.error('Error saving database:', error);
        return { success: false, message: 'Error saving database' };
    }
});

// Load camera database from file
ipcMain.handle('loadCameraDatabase', async () => {
    try {
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.join(__dirname, 'cameras.json');
        
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            cameraDatabase = JSON.parse(data);
            return { success: true, cameras: cameraDatabase };
        }
        
        return { success: true, cameras: cameraDatabase };
    } catch (error) {
        console.error('Error loading database:', error);
        return { success: false, message: 'Error loading database' };
    }
});

// Get app version
ipcMain.handle('getVersion', async () => {
    return require('./package.json').version;
});

// Mock data generators (remove when backend is integrated)
function generateMockMetrics(cameraId) {
    const baseCount = Math.floor(Math.random() * 100) + 50;
    const numLines = Math.floor(Math.random() * 4) + 2; // 2-5 lines
    
    const lines = [];
    for (let i = 1; i <= numLines; i++) {
        const lineTotal = Math.floor(Math.random() * 20) + 5;
        const motorcycles = Math.floor(lineTotal * 0.6);
        const cars = Math.floor(lineTotal * 0.3);
        const trucks = lineTotal - motorcycles - cars;
        
        lines.push({
            id: i,
            total: lineTotal,
            types: {
                motorcycle: motorcycles,
                car: cars,
                truck: Math.max(0, trucks)
            }
        });
    }
    
    return {
        cameraId,
        totalVehicles: lines.reduce((sum, line) => sum + line.total, 0),
        lines,
        timestamp: new Date().toISOString(),
        status: Math.random() > 0.8 ? 'alert' : 'normal' // 20% chance of alert
    };
}

function generateMockHistory(cameraId, timeRange) {
    const history = [];
    const now = new Date();
    const hoursBack = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 1;
    
    for (let i = hoursBack; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
        history.push({
            timestamp: timestamp.toISOString(),
            totalVehicles: Math.floor(Math.random() * 150) + 50,
            avgSpeed: Math.floor(Math.random() * 40) + 30 // km/h
        });
    }
    
    return history;
}
