const path = require('path');
const EventEmitter = require('events');
const CertificateManager = require('./SSL/CertificateManager');
const WindowsInetBridge = require('./SSL/WindowsInetBridge');
const SslServer = require('./SSL/SslServer');
const SslHandler = require('./SSL/SslHandler');
const SslProxy = require('./SSL/SslProxy');
const WebsocketServer = require('./WebSocket/WebsocketServer');
const HeadersData = require('./Util/HeadersData');
const HabboMessage = require('./Protocol/HabboMessage');
const Util = require('./Util/Util');

class Logger extends EventEmitter {
	async initialize() {
		if (!await CertificateManager.isCertTrusted('0AAA890390F92FC1562038CD97D993A6793E48A7')) {
			await CertificateManager.installCertificate(path.join(__dirname, '../../certs/selfsigned/ca.crt'));
		}

		this.headersData = new HeadersData();

		try {
			await this.headersData.loadHeaders();
		} catch {
		}

		this.windowsInetBridge = new WindowsInetBridge();

		this.sslServer = new SslServer();
		this.sslProxy = new SslProxy({ host: '127.0.0.1', port: 3335 }, ['images.habbo.com', 'www.habbo.com', 'www.habbo.com.br', 'www.habbo.com.tr', 'www.habbo.de', 'www.habbo.es', 'www.habbo.fi', 'www.habbo.fr', 'www.habbo.it', 'www.habbo.nl']);

		await this.sslProxy.startServer(3334);
		await this.sslServer.startServer(3335, SslHandler);

		this.loggingEnabled = false;
		this.emit('ready');
	}

	async startLogging() {
		this.windowsInetBridge.setProxy('https=127.0.0.1:3334');

		this.websocketServer = new WebsocketServer(this);
		this.websocketServer.headersData = this.headersData;
		this.websocketServer.startServer(3336);

		this.websocketServer.on('connected', () => {
			this.windowsInetBridge.disableProxy();
			this.emit('connected');
		});

		this.loggingEnabled = true;
		return true;
	}

	async stopLogging() {
		if (this.websocketServer.packetloggerWindow) {
			this.websocketServer.packetloggerWindow.destroy();
		}
		this.websocketServer.stop();
		this.windowsInetBridge.disableProxy();

		this.loggingEnabled = false;
		return true;
	}

	sendToClient(packetData) {
		if (this.loggingEnabled && this.websocketServer.ws) {
			let packet = new HabboMessage(this.parsePacket(packetData));
			this.websocketServer.sendIncoming(this.websocketServer.ws, packet);
		} else {
			alert('Please connect before sending data.');
		}
	}

	sendToServer(packetData) {
		if (this.loggingEnabled && this.websocketServer.ws) {
			let packet = new HabboMessage(this.parsePacket(packetData));
			this.websocketServer.sendOutgoing(this.websocketServer.ws, packet);
		} else {
			alert('Please connect before sending data.');
		}
	}

	parsePacket(packet) {
		for (var i = 0; i <= 13; i++) {
			packet = Util.replaceAll('[' + i + ']', String.fromCharCode(i), packet);
		}

		return Buffer.from(packet, 'binary');
	}
}

module.exports = Logger;