const path = require('path');

class WindowsInetBridge {
	constructor() {
		const namespace = 'INETOptions';
		const baseNetAppPath = path.join(__dirname, '../../inetoptions/' + namespace + '/bin/Debug/netcoreapp2.0');
		console.log(baseNetAppPath);
		process.env.EDGE_USE_CORECLR = 1;
		process.env.EDGE_APP_ROOT = baseNetAppPath;
		const edge = require('electron-edge-js');

		const baseDll = path.join(baseNetAppPath, namespace + '.dll');

		this.setProxyBridge = edge.func({
			assemblyFile: baseDll,
			typeName: namespace + '.Binding',
			methodName: 'SetProxy'
		});

		this.disableProxyBridge = edge.func({
			assemblyFile: baseDll,
			typeName: namespace + '.Binding',
			methodName: 'DisableProxy'
		});
	}

	async setProxy(proxyAddress) {
		return new Promise((resolve, reject) => {
			this.setProxyBridge(proxyAddress, (error, result) => {
				if (error)
					reject(error);
				resolve(result);
			});
		});
	}

	async disableProxy() {
		return new Promise((resolve, reject) => {
			this.disableProxyBridge('x', (error, result) => {
				if (error)
					reject(error);
				resolve(result);
			});
		});
	}
}

module.exports = WindowsInetBridge;