const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // File operations
    saveFile: (data, defaultPath) => ipcRenderer.invoke('save-file', data, defaultPath),
    downloadPowerPoint: (fileData, filename) => ipcRenderer.invoke('download-powerpoint', fileData, filename),
    
    // App settings
    getAppSetting: (key, defaultValue) => ipcRenderer.invoke('get-app-setting', key, defaultValue),
    setAppSetting: (key, value) => ipcRenderer.invoke('set-app-setting', key, value),
    deleteAppSetting: (key) => ipcRenderer.invoke('delete-app-setting', key),
    
    // App info
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    
    // Window operations
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    
    // External links
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    
    // Notifications
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
    
    // Menu actions listener
    onMenuAction: (callback) => {
        ipcRenderer.on('menu-action', (event, action, ...args) => {
            callback(action, ...args);
        });
    },
    
    // Remove menu action listener
    removeMenuActionListener: () => {
        ipcRenderer.removeAllListeners('menu-action');
    },
    
    // Platform info
    platform: process.platform,
    isElectron: true
});

// Security: Remove Node.js globals from renderer process
delete window.require;
delete window.exports;
delete window.module;

// Log that preload script has loaded
console.log('Preload script loaded successfully');
