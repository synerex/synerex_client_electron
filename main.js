'use strict';
const path = require('path');
const {app, BrowserWindow, Menu, ipcMain} = require('electron');

/// const {autoUpdater} = require('electron-updater');
const {is} = require('electron-util');
const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const contextMenu = require('electron-context-menu');
//const config = require('./config');
const menu = require('./menu');

const { spawn } = require('child_process')
const ipc = require('electron').ipcMain;

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
	const win = new BrowserWindow({
		title: app.name,
		show: false,
		width: 600,
		height: 400,
		webPreferences:{
			nodeIntegration: true
		}
	});

	win.on('ready-to-show', () => {
		win.show();
	});

	win.on('closed', () => {
		// Dereference the window
		// For multiple windows store them in an array
		mainWindow = undefined;
	});

	await win.loadFile(path.join(__dirname, 'index.html'));

	return win;
};




let nodeServ = null
let sxServ = null

const setNodeCallBack = (proc) =>{
	proc.stdout.on('data', (data) =>{
		console.log('stdout:'+data)
	})
	proc.stderr.on('data', (data) =>{
		console.log('stderr:'+data)
		mainWindow.webContents.send('nodelog', data)
	})
	proc.on('close', (code) =>{
		console.log('nodeserv stopped:'+ code)
		nodeServ = null
	})
}

const setCallBack = (proc,st,cmd) =>{
	proc.stdout.on('data', (data) =>{
		console.log(st+' stdout:'+data)
	})
	proc.stderr.on('data', (data) =>{
		console.log(st+' stderr:'+data)
		mainWindow.webContents.send(cmd, data)
	})
	proc.on('close', (code) =>{
		console.log(st+' stopped:'+ code)
	})
}

const runNodeServ = ()=>{
//	const args = []
	
// how to access dom.
	if (nodeServ === null ){
		nodeServ = spawn('c:/work2019/synerex_beta/nodeserv/nodeserv.exe')
		mainWindow.webContents.send('nodeserv', '')
		setNodeCallBack(nodeServ)

	}else{ // already running.
		var r = kill(nodeServ.pid, 'SIGKILL', function(err){
			console.log("Kill err",err)
		})
//		const r = nodeServ.kill('SIGHUP'); // may killed!
		console.log("Kill Result",r)
		sleep(2000).then(() =>{
			nodeServ = spawn('c:/work2019/synerex_beta/nodeserv/nodeserv.exe')
			mainWindow.webContents.send('nodeserv', '')
			setNodeCallBack(nodeServ)
		})
	}
}

const runSynerexServ = ()=>{
	if (sxServ=== null){
		sxServ = spawn('c:/work2019/synerex_beta/server/synerex-server.exe')
		mainWindow.webContents.send('sxserver', '')
		setCallBack(sxServ,'sx','sxlog')
	}else {
		var r = kill(sxServ.pid, 'SIGKILL', function(err){
			console.log("Kill err",err)
		})
		console.log("Kill Result",r)
		sleep(2000).then(() =>{
			sxServ = spawn('c:/work2019/synerex_beta/server/synerex-server.exe')
			mainWindow.webContents.send('sxserv', '')
			setCallBack(sxServ,'sx','sxlog')
		})
	}
}



ipc.on('start-nodeserv',()=>{
	console.log("Start nodeserv from Browser");
	runNodeServ()
});
ipc.on('start-sxserver',()=>{
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
//	Menu.setApplicationMenu(menu);
	mainWindow = await createMainWindow();

//	var nodeTerm = new Terminal();
	mainWindow.webContents.send('started','')
	runNodeServ()
	runSynerexServ()
//	mainWindow.webContents.executeJavaScript(`document.querySelector('header p').textContent = 'Your favorite animal is ${favoriteAnimal}'`);
//	mainWindow.webContents.executeJavaScript(`document.querySelector('header p').textContent = 'abc'+${nodeTerm.html}`);
})();
