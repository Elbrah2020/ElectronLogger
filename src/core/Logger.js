const EventEmitter = require('events');
const CertificateManager = require('./SSL/CertificateManager');
const WindowsInetBridge = require('./SSL/WindowsInetBridge');
const SslServer = require('./SSL/SslServer');
const SslHandler = require('./SSL/SslHandler');

class Logger extends EventEmitter {
	async initialize() {
		if (!await CertificateManager.isCertTrusted('0AAA890390F92FC1562038CD97D993A6793E48A7')) {
			await CertificateManager.installCertificate('./certs/selfsigned/ca.crt');
		}
		this.emit('ready');
		this.windowsInetBridge = new WindowsInetBridge();

		console.log(await this.windowsInetBridge.setProxy('https=127.0.0.1:3334'));
		this.sslServer = new SslServer();
		this.sslServer.startServer(3335, SslHandler);

		//console.log(await this.windowsInetBridge.disableProxy());
	}
}

module.exports = Logger;