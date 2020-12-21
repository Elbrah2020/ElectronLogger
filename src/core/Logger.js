const EventEmitter = require('events');
const CertificateManager = require('./SSL/CertificateManager');
const WindowsInetBridge = require('./SSL/WindowsInetBridge');
const SslServer = require('./SSL/SslServer');
const SslHandler = require('./SSL/SslHandler');
const SslProxy = require('./SSL/SslProxy');
const WebsocketServer = require('./WebSocket/WebsocketServer');
const HeadersData = require('./Util/HeadersData');
const HabboMessage = require('./Protocol/HabboMessage');

class Logger extends EventEmitter {
	async initialize() {
		if (!await CertificateManager.isCertTrusted('0AAA890390F92FC1562038CD97D993A6793E48A7')) {
			await CertificateManager.installCertificate('./certs/selfsigned/ca.crt');
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

		this.emit('ready');
	}

	async startLogging() {
		await this.windowsInetBridge.setProxy('https=127.0.0.1:3334');

		this.websocketServer = new WebsocketServer();
		this.websocketServer.headersData = this.headersData;
		this.websocketServer.startServer(3336);

		this.websocketServer.on('connected', () => {
			this.emit('connected');
		});

		return true;
	}

	async stopLogging() {
		if (this.websocketServer.packetloggerWindow) {
			this.websocketServer.packetloggerWindow.destroy();
		}
		this.websocketServer.stop();
		await this.windowsInetBridge.disableProxy();
	}

	sendToClient(packetData) {
		let packet = new HabboMessage(parsePacket(packetData));
		this.websocketServer.sendIncoming(this.websocketServer.ws, packet);
	}

	sendToServer(packetData) {
		let packet = new HabboMessage(parsePacket(packetData));
		this.websocketServer.sendOutgoing(this.websocketServer.ws, packet);
	}
}

function replaceAll(find, replace, string) {
	return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function parsePacket(packet) {
	for (var i = 0; i <= 13; i++) {
		packet = replaceAll('[' + i + ']', String.fromCharCode(i), packet);
	}

	return Buffer.from(packet, 'binary');
}

module.exports = Logger;