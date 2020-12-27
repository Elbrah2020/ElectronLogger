const execFileSync = require('child_process').execFileSync;
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
		execFileSync(this.binPath, [ proxyAddress ]);
	}

	disableProxy() {
		execFileSync(this.binPath);
	}
}

module.exports = WindowsInetBridge;