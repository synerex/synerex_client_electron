'use strict';
const path = require('path');
const { app, BrowserWindow, Menu, ipcMain } = require('electron');

/// const {autoUpdater} = require('electron-updater');
const { is } = require('electron-util');
const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const contextMenu = require('electron-context-menu');
const WindowStateKeeper = require('electron-window-state');
const FS = require("fs-extra");

const config = require('./config');
const menu = require('./menu');

const { spawn } = require('child_process')
const ipc = require('electron').ipcMain;

// for killing sub processes
const kill = require('tree-kill')


unhandled();
debug();
contextMenu();

// Note: Must match `build.appId` in package.json
app.setAppUserModelId('net.synerex.client.electron');

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
// if (!is.development) {
// 	const FOUR_HOURS = 1000 * 60 * 60 * 4;
// 	setInterval(() => {
// 		autoUpdater.checkForUpdates();
// 	}, FOUR_HOURS);
//
// 	autoUpdater.checkForUpdates();
// }

// Prevent window from being garbage collected
let mainWindow;

function sleep(time) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, time);
	});
}

const createMainWindow = async () => {
	let configDir = path.join(app.getPath('appData'), 'SynerexClient');
	FS.existsSync(configDir) || FS.mkdirSync(configDir);

	let mainWindowState = WindowStateKeeper({
		defaultWidth: 640,
		defaultHeight: 480,
		path: configDir,
		file: 'config.json'
	});

	let options = {
		title: app.name,
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
		minWidth: 600,
		minHeight: 400,
		//		icon: Path.join(__dirname, 'appicon.png'),
		webPreferences: {
			nodeIntegration: true
		},
		show: false
	};


	const win = new BrowserWindow(
		options
	);

	win.on('ready-to-show', () => {
		win.show();
	});

	win.on('closed', () => {
		// Dereference the window
		// For multiple windows store them in an array
		mainWindow = undefined;
	});

	await win.loadFile(path.join(__dirname, 'index.html'));

	mainWindowState.manage(win);

	return win;
};




let nodeServ = null
let sxServ = null

const setNodeCallBack = (proc) => {
	proc.stdout.on('data', (data) => {
		console.log('stdout:' + data)
	})
	proc.stderr.on('data', (data) => {
		console.log('stderr:' + data)
		mainWindow.webContents.send('nodelog', data)
	})
	proc.on('close', (code) => {
		console.log('nodeserv stopped:' + code)
		nodeServ = null
	})
}

const setCallBack = (proc, st, cmd) => {
	proc.stdout.on('data', (data) => {
		console.log(st + ' stdout:' + data)
	})
	proc.stderr.on('data', (data) => {
		console.log(st + ' stderr:' + data)
		mainWindow.webContents.send(cmd, data)
	})
	proc.on('close', (code) => {
		console.log(st + ' stopped:' + code)
	})
}

const runNodeServ = () => {
	//	const args = []
	const sxdir = config.get('SynerexDir');
	let nodeName = sxdir+'\\nodeserv\\nodeserv.exe';
	if (process.platform === 'darwin') {
		nodeName = spath.join(sxdir,'/nodeserv/nodeserv');
	}

	if (nodeServ === null) {
		try {
			FS.statSync(nodeName);
			nodeServ = spawn(nodeName);
			mainWindow.webContents.send('nodeserv', '')
			setNodeCallBack(nodeServ)

		} catch (err) {
			mainWindow.webContents.send('nodeserv', '')
			mainWindow.webContents.send('nodelog', 'Cant open ' + nodeName)
		}

	} else { // already running.
		var r = kill(nodeServ.pid, 'SIGKILL', function (err) {
			console.log("Kill err", err)
		})
		//		const r = nodeServ.kill('SIGHUP'); // may killed!
		console.log("Kill Result", r)
		sleep(2000).then(() => {
			nodeServ = spawn(nodeName)
			mainWindow.webContents.send('nodeserv', '')
			setNodeCallBack(nodeServ)
		})
	}
}

const runSynerexServ = () => {
	const sxdir = config.get('SynerexDir');
	let sxName = sxdir+'\\server\\synerex-server.exe';
	if (process.platform === 'darwin') {
		sxName = spath.join(sxdir,'/server/synerex-server');
	}

	if (sxServ === null) {
		try {
			FS.statSync(sxName);
			sxServ = spawn(sxName)
			mainWindow.webContents.send('sxserv', '')
			setCallBack(sxServ, 'sx', 'sxlog')
		} catch (err) {
			mainWindow.webContents.send('sxserv', '')
			mainWindow.webContents.send('sxlog', 'Cant open ' + sxName)
		}
	} else {
		var r = kill(sxServ.pid, 'SIGKILL', function (err) {
			console.log("Kill err", err)
		})
		console.log("Kill Result", r)
		sleep(2000).then(() => {
			sxServ = spawn(sxName)
			mainWindow.webContents.send('sxserv', '')
			setCallBack(sxServ, 'sx', 'sxlog')
		})
	}
}



ipc.on('start-nodeserv', () => {
	console.log("Start nodeserv from Browser");
	runNodeServ()
});
ipc.on('start-sxserver', () => {
	console.log("Start Synerex Server from Browser");
	runSynerexServ()
});


// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
	app.quit();
}

app.on('second-instance', () => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}

		mainWindow.show();
	}
});

app.on('window-all-closed', () => {
	if (!is.macos) {
		app.quit();
	}
});

app.on('activate', async () => {
	if (!mainWindow) {
		mainWindow = await createMainWindow();
	}
});

(async () => {
	await app.whenReady();
	Menu.setApplicationMenu(menu);
	mainWindow = await createMainWindow();
//	mainWindow.setMenu(null);

	//	var nodeTerm = new Terminal();
	mainWindow.webContents.send('started', '')
	runNodeServ()
	runSynerexServ()
	//	mainWindow.webContents.executeJavaScript(`document.querySelector('header p').textContent = 'Your favorite animal is ${favoriteAnimal}'`);
	//	mainWindow.webContents.executeJavaScript(`document.querySelector('header p').textContent = 'abc'+${nodeTerm.html}`);
})();
