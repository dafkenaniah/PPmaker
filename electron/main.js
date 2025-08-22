const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Optional auto-updater (may not be available in packaged app)
let autoUpdater = null;
try {
    autoUpdater = require('electron-updater').autoUpdater;
} catch (error) {
    console.log('Auto-updater not available:', error.message);
}

// Optional electron-store (may not be available in packaged app)
let Store = null;
let store = null;
try {
    Store = require('electron-store');
    store = new Store();
} catch (error) {
    console.log('Electron-store not available, using localStorage fallback:', error.message);
    // Create a simple fallback store
    store = {
        get: (key, defaultValue) => {
            try {
                const data = fs.readFileSync(path.join(app.getPath('userData'), 'settings.json'), 'utf8');
                const settings = JSON.parse(data);
                return settings[key] !== undefined ? settings[key] : defaultValue;
            } catch {
                return defaultValue;
            }
        },
        set: (key, value) => {
            try {
                let settings = {};
                try {
                    const data = fs.readFileSync(path.join(app.getPath('userData'), 'settings.json'), 'utf8');
                    settings = JSON.parse(data);
                } catch {}
                settings[key] = value;
                fs.writeFileSync(path.join(app.getPath('userData'), 'settings.json'), JSON.stringify(settings, null, 2));
            } catch (error) {
                console.log('Failed to save setting:', error.message);
            }
        },
        delete: (key) => {
            try {
                const data = fs.readFileSync(path.join(app.getPath('userData'), 'settings.json'), 'utf8');
                const settings = JSON.parse(data);
                delete settings[key];
                fs.writeFileSync(path.join(app.getPath('userData'), 'settings.json'), JSON.stringify(settings, null, 2));
            } catch (error) {
                console.log('Failed to delete setting:', error.message);
            }
        }
    };
}

// Keep a global reference of the window object
let mainWindow;
let splashWindow;

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });
}

/**
 * Create the main application window
 */
function createMainWindow() {
    // Get saved window bounds or use defaults
    const windowBounds = store.get('windowBounds', {
        width: 1400,
        height: 1000,
        x: undefined,
        y: undefined
    });

    // Create the browser window
    mainWindow = new BrowserWindow({
        width: windowBounds.width,
        height: windowBounds.height,
        x: windowBounds.x,
        y: windowBounds.y,
        minWidth: 1000,
        minHeight: 700,
        show: false, // Don't show until ready
        icon: getAppIcon(),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            allowRunningInsecureContent: false
        },
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        backgroundColor: '#AFF8D8', // Match app background
        vibrancy: process.platform === 'darwin' ? 'under-window' : null
    });

    // Load the app
    const isDev = process.env.NODE_ENV === 'development';
    const startUrl = isDev 
        ? 'http://localhost:3001' 
        : `file://${path.join(__dirname, '../index.html')}`;
    
    mainWindow.loadURL(startUrl);

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        if (splashWindow) {
            splashWindow.close();
            splashWindow = null;
        }
        
        mainWindow.show();
        
        // Focus window on creation
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    // Save window bounds when moved or resized
    mainWindow.on('moved', saveWindowBounds);
    mainWindow.on('resized', saveWindowBounds);

    // Handle window close event (before closing)
    mainWindow.on('close', (event) => {
        // Save window bounds before closing
        saveWindowBounds();
        
        // Allow the window to close normally
        // Don't prevent default - let it close
    });

    // Handle window closed (after closing)
    mainWindow.on('closed', () => {
        mainWindow = null;
        // Force quit the app when main window closes
        app.quit();
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Prevent navigation to external sites
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== startUrl && !navigationUrl.startsWith('file://')) {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });

    return mainWindow;
}

/**
 * Create splash screen
 */
function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: getAppIcon()
    });

    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
    
    splashWindow.on('closed', () => {
        splashWindow = null;
    });

    return splashWindow;
}

/**
 * Get appropriate app icon for platform
 */
function getAppIcon() {
    if (process.platform === 'win32') {
        return path.join(__dirname, '../build/icon.ico');
    } else if (process.platform === 'darwin') {
        return path.join(__dirname, '../build/icon.icns');
    } else {
        return path.join(__dirname, '../build/icon.png');
    }
}

/**
 * Save window bounds to store
 */
function saveWindowBounds() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        store.set('windowBounds', mainWindow.getBounds());
    }
}

/**
 * Create application menu
 */
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Presentation',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'new-presentation');
                    }
                },
                {
                    label: 'Open PowerPoint...',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            properties: ['openFile'],
                            filters: [
                                { name: 'PowerPoint Files', extensions: ['pptx', 'ppt'] },
                                { name: 'All Files', extensions: ['*'] }
                            ]
                        });

                        if (!result.canceled && result.filePaths.length > 0) {
                            mainWindow.webContents.send('menu-action', 'open-file', result.filePaths[0]);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Save Configuration',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'save-config');
                    }
                },
                {
                    label: 'Export Settings...',
                    click: async () => {
                        const result = await dialog.showSaveDialog(mainWindow, {
                            defaultPath: 'powerpoint-generator-settings.json',
                            filters: [
                                { name: 'JSON Files', extensions: ['json'] },
                                { name: 'All Files', extensions: ['*'] }
                            ]
                        });

                        if (!result.canceled) {
                            mainWindow.webContents.send('menu-action', 'export-settings', result.filePath);
                        }
                    }
                },
                {
                    label: 'Import Settings...',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            properties: ['openFile'],
                            filters: [
                                { name: 'JSON Files', extensions: ['json'] },
                                { name: 'All Files', extensions: ['*'] }
                            ]
                        });

                        if (!result.canceled && result.filePaths.length > 0) {
                            mainWindow.webContents.send('menu-action', 'import-settings', result.filePaths[0]);
                        }
                    }
                },
                { type: 'separator' },
                process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectall' },
                { type: 'separator' },
                {
                    label: 'Clear All Data',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'clear-all-data');
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
                { type: 'separator' },
                {
                    label: 'Switch to Create Tab',
                    accelerator: 'CmdOrCtrl+1',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'switch-tab', 'create');
                    }
                },
                {
                    label: 'Switch to Update Tab',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'switch-tab', 'update');
                    }
                },
                {
                    label: 'Switch to Audience Tab',
                    accelerator: 'CmdOrCtrl+3',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'switch-tab', 'audience');
                    }
                },
                {
                    label: 'Switch to Config Tab',
                    accelerator: 'CmdOrCtrl+4',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'switch-tab', 'config');
                    }
                }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Generate Outline',
                    accelerator: 'CmdOrCtrl+Enter',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'generate-outline');
                    }
                },
                {
                    label: 'Test AI Connection',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'test-connection');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Reset Application',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'reset-app');
                    }
                }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' },
                ...(process.platform === 'darwin' ? [
                    { type: 'separator' },
                    { role: 'front' }
                ] : [])
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'About PowerPoint Generator',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About PowerPoint Generator',
                            message: 'PowerPoint Generator',
                            detail: `Version: ${app.getVersion()}\nAI-Powered Presentation Creation Tool\n\nBuilt with Electron and modern web technologies.`,
                            buttons: ['OK']
                        });
                    }
                },
                {
                    label: 'Keyboard Shortcuts',
                    accelerator: 'F1',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'show-help');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Check for Updates',
                    click: () => {
                        if (autoUpdater) {
                            autoUpdater.checkForUpdatesAndNotify();
                        } else {
                            dialog.showMessageBox(mainWindow, {
                                type: 'info',
                                title: 'Updates Not Available',
                                message: 'Auto-updater is not available in this build. Please check for manual updates.',
                                buttons: ['OK']
                            });
                        }
                    }
                },
                {
                    label: 'Report Issue',
                    click: () => {
                        shell.openExternal('https://github.com/powerpoint-generator/powerpoint-generator-app/issues');
                    }
                }
            ]
        }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });

        // Window menu
        template[5].submenu = [
            { role: 'close' },
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' }
        ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

/**
 * Set up auto updater
 */
function setupAutoUpdater() {
    if (!autoUpdater) {
        console.log('Auto-updater not available in this build');
        return;
    }

    try {
        // Configure auto updater
        autoUpdater.checkForUpdatesAndNotify();

        autoUpdater.on('checking-for-update', () => {
            console.log('Checking for update...');
        });

        autoUpdater.on('update-available', (info) => {
            console.log('Update available.');
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Update Available',
                message: 'A new version is available. It will be downloaded in the background.',
                buttons: ['OK']
            });
        });

        autoUpdater.on('update-not-available', (info) => {
            console.log('Update not available.');
        });

        autoUpdater.on('error', (err) => {
            console.log('Error in auto-updater. ' + err);
        });

        autoUpdater.on('download-progress', (progressObj) => {
            let log_message = "Download speed: " + progressObj.bytesPerSecond;
            log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
            log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
            console.log(log_message);
        });

        autoUpdater.on('update-downloaded', (info) => {
            console.log('Update downloaded');
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Update Ready',
                message: 'Update downloaded. The application will restart to apply the update.',
                buttons: ['Restart Now', 'Later']
            }).then((result) => {
                if (result.response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
        });
    } catch (error) {
        console.log('Auto-updater setup failed:', error.message);
    }
}

/**
 * Set up IPC handlers
 */
function setupIPC() {
    // Handle file operations
    ipcMain.handle('save-file', async (event, data, defaultPath) => {
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: defaultPath,
            filters: [
                { name: 'PowerPoint Files', extensions: ['pptx'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled) {
            try {
                fs.writeFileSync(result.filePath, data);
                return { success: true, filePath: result.filePath };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        return { success: false, canceled: true };
    });

    // Handle app settings
    ipcMain.handle('get-app-setting', (event, key, defaultValue) => {
        return store.get(key, defaultValue);
    });

    ipcMain.handle('set-app-setting', (event, key, value) => {
        store.set(key, value);
        return true;
    });

    ipcMain.handle('delete-app-setting', (event, key) => {
        store.delete(key);
        return true;
    });

    // Handle app info
    ipcMain.handle('get-app-info', () => {
        return {
            version: app.getVersion(),
            name: app.getName(),
            platform: process.platform,
            arch: process.arch,
            electronVersion: process.versions.electron,
            nodeVersion: process.versions.node,
            chromeVersion: process.versions.chrome
        };
    });

    // Handle window operations
    ipcMain.handle('minimize-window', () => {
        if (mainWindow) {
            mainWindow.minimize();
        }
    });

    ipcMain.handle('maximize-window', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });

    ipcMain.handle('close-window', () => {
        if (mainWindow) {
            mainWindow.close();
        }
    });

    // Handle external links
    ipcMain.handle('open-external', (event, url) => {
        shell.openExternal(url);
    });

    // Handle notifications
    ipcMain.handle('show-notification', (event, title, body) => {
        new Notification({
            title: title,
            body: body,
            icon: getAppIcon()
        }).show();
    });

    // Handle PowerPoint file download
    ipcMain.handle('download-powerpoint', async (event, fileData, filename) => {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Save PowerPoint Presentation',
            defaultPath: filename,
            filters: [
                { name: 'PowerPoint Presentations', extensions: ['pptx'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (canceled || !filePath) {
            return { success: false, canceled: true };
        }

        try {
            // The fileData is an ArrayBuffer, so we need to convert it to a Buffer
            const buffer = Buffer.from(fileData);
            fs.writeFileSync(filePath, buffer);
            return { success: true, filePath };
        } catch (error) {
            console.error('Failed to save PowerPoint file:', error);
            return { success: false, error: error.message };
        }
    });

}

// App event handlers
app.whenReady().then(() => {
    // Create splash screen first
    createSplashWindow();
    
    // Create main window after a short delay
    setTimeout(() => {
        createMainWindow();
        createMenu();
        setupAutoUpdater();
        setupIPC();
    }, 1500);

    app.on('activate', () => {
        // On macOS, re-create window when dock icon is clicked
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    // Save any pending data before quitting
    saveWindowBounds();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (process.env.NODE_ENV === 'development') {
        // In development, ignore certificate errors
        event.preventDefault();
        callback(true);
    } else {
        // In production, use default behavior
        callback(false);
    }
});

// Prevent navigation to external protocols
app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== 'http://localhost:3001' && !navigationUrl.startsWith('file://')) {
            event.preventDefault();
        }
    });
});
