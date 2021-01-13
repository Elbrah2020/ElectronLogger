const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const electron = require('electron');
const path = require('path');

const WindowsInetBridge = require('./src/core/SSL/WindowsInetBridge');

let mainWindow;

function createWindow () {
	mainWindow = new BrowserWindow({
		width: 600,
		height: 400,
		resizable: false,
		alwaysOnTop: false,
		webPreferences:{
			nodeIntegration: true,
			nodeIntegrationInWorker: true,
			enableRemoteModule: true
		},
		icon: path.join(__dirname, 'icon.png')
	});

	//mainWindow.setMenu(null);

	mainWindow.loadURL(`file://${__dirname}/src/view/index.html`);

	// Open the DevTools.
	// mainWindow.webContents.openDevTools();

	mainWindow.on('closed', () => {
		mainWindow = null;
		
		let windowsInetBridge = new WindowsInetBridge();
		windowsInetBridge.disableProxy();
		process.exit(0);
	});
}

app.on('ready', () => {
	createWindow();
});

app.on('window-all-closed', () => {
	app.quit();
});

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow();
	}
});

app.allowRendererProcessReuse = false;

ipcMain.on('check_update', () => {
	autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.on('update_app', () => {
	autoUpdater.quitAndInstall();
});

autoUpdater.on('update-available', () => {
	mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-not-available', () => {
	mainWindow.webContents.send('update_not_available');
});

autoUpdater.on('checking-for-update', () => {
	mainWindow.webContents.send('checking_for_update');
});

autoUpdater.on('update-downloaded', () => {
	mainWindow.webContents.send('update_downloaded');
});

autoUpdater.on('error', error => {
	mainWindow.webContents.send('update_error', error);
});