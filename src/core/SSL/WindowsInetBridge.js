const execSync = require('child_process').execSync;
const path = require('path');
const fs = require('fs');

class WindowsInetBridge {
	constructor() {
		this.binPath = path.join(__dirname, '../../InetOptionsCLI/InetOptionsCLI/bin/Release/InetOptionsCLI.exe');

		if (!fs.existsSync(this.binPath)) {
			alert('Please compile Windows inet dotnet project, program will shutdown now.');
			require('electron').remote.getCurrentWindow().close();
		}
	}

	setProxy(proxyAddress) {
		execSync(this.binPath + ' ' + proxyAddress);
	}

	disableProxy() {
		execSync(this.binPath);
	}
}

module.exports = WindowsInetBridge;