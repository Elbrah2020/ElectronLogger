const execSync = require('child_process').execSync;
const path = require('path');

class WindowsInetBridge {
	constructor() {
		this.binPath = path.join(__dirname, '../../InetOptionsCLI/InetOptionsCLI/bin/Debug/InetOptionsCLI.exe');
	}

	setProxy(proxyAddress) {
		execSync(this.binPath + ' ' + proxyAddress);
	}

	disableProxy() {
		execSync(this.binPath);
	}
}

module.exports = WindowsInetBridge;