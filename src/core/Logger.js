const EventEmitter = require('events');
const CertificateManager = require('./SSL/CertificateManager');
const WindowsInetBridge = require('./SSL/WindowsInetBridge');
const SslServer = require('./SSL/SslServer');
const SslHandler = require('./SSL/SslHandler');
const SslProxy = require('./SSL/SslProxy');

class Logger extends EventEmitter {
	async initialize() {
		if (!await CertificateManager.isCertTrusted('0AAA890390F92FC1562038CD97D993A6793E48A7')) {
			await CertificateManager.installCertificate('./certs/selfsigned/ca.crt');
		}
		this.emit('ready');
		this.windowsInetBridge = new WindowsInetBridge();

		this.sslServer = new SslServer();
		this.sslProxy = new SslProxy({ host: '127.0.0.1', port: 3335 }, ['images.habbo.com', 'www.habbo.com', 'www.habbo.com.br', 'www.habbo.com.tr', 'www.habbo.de', 'www.habbo.es', 'www.habbo.fi', 'www.habbo.fr', 'www.habbo.it', 'www.habbo.nl']);

		await this.sslProxy.startServer(3334);
		await this.sslServer.startServer(3335, SslHandler);
	}

	async startLogging() {
		await this.windowsInetBridge.setProxy('https=127.0.0.1:3334')
		return true;
	}

	async stopLogging() {
		await this.windowsInetBridge.disableProxy();
	}
}

module.exports = Logger;