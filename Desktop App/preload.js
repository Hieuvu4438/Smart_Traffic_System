const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Camera and metrics operations
    getMetrics: (cameraId) => ipcRenderer.invoke('getMetrics', cameraId),
    getCameraList: () => ipcRenderer.invoke('getCameraList'),
    getTrafficHistory: (cameraId, timeRange) => ipcRenderer.invoke('getTrafficHistory', cameraId, timeRange),
    
    // Camera management operations
    addCamera: (cameraData) => ipcRenderer.invoke('addCamera', cameraData),
    deleteCamera: (cameraId) => ipcRenderer.invoke('deleteCamera', cameraId),
    updateCamera: (cameraId, updateData) => ipcRenderer.invoke('updateCamera', cameraId, updateData),
    
    // Stream testing
    testCameraStream: (videoUrl, streamType) => ipcRenderer.invoke('testCameraStream', videoUrl, streamType),
    
    // Database persistence
    saveCameraDatabase: () => ipcRenderer.invoke('saveCameraDatabase'),
    loadCameraDatabase: () => ipcRenderer.invoke('loadCameraDatabase'),
    
    // Data export
    exportData: (data, format) => ipcRenderer.invoke('exportData', data, format),
    
    // App utilities
    getVersion: () => ipcRenderer.invoke('getVersion'),
    
    // Event listeners
    onMetricsUpdate: (callback) => {
        ipcRenderer.on('metrics-update', callback);
        return () => ipcRenderer.removeListener('metrics-update', callback);
    },
    
    onCameraStatusChange: (callback) => {
        ipcRenderer.on('camera-status-change', callback);
        return () => ipcRenderer.removeListener('camera-status-change', callback);
    }
});
