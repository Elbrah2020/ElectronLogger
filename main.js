const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const electron = require('electron');
const path = require('path');

let mainWindow;

function createWindow () {
	mainWindow = new BrowserWindow({
		width: 600,
		height: 400,
		resizable: false,
		alwaysOnTop: false,
		show: false,
		webPreferences:{
			nodeIntegration: true,
			nodeIntegrationInWorker: true
		},
		icon: path.join(__dirname, 'icon.png')
	});

	//mainWindow.setMenu(null);

	mainWindow.loadURL(`file://${__dirname}/src/view/index.html`);

	// Open the DevTools.
	// mainWindow.webContents.openDevTools();

	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
		autoUpdater.checkForUpdatesAndNotify();
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

ipcMain.on('update_app', () => {
	autoUpdater.quitAndInstall();
});

autoUpdater.on('update-available', () => {
	console.log('update available');
});

autoUpdater.on('checking-for-update', () => {
	console.log('checking for update');
});

autoUpdater.on('error', error => {
	console.error('ERROR', error);
});