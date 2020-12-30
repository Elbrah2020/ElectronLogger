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
const getPort = require('get-port');

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

		this.sslServerPort = await getPort();
		this.sslProxyPort = await getPort();

		this.sslServer = new SslServer();
		this.sslProxy = new SslProxy({ host: '127.0.0.1', port: this.sslServerPort }, ['images.habbo.com', 'www.habbo.com', 'www.habbo.com.br', 'www.habbo.com.tr', 'www.habbo.de', 'www.habbo.es', 'www.habbo.fi', 'www.habbo.fr', 'www.habbo.it', 'www.habbo.nl']);

		await this.sslProxy.startServer(this.sslProxyPort);
		await this.sslServer.startServer(this.sslServerPort, SslHandler);

		this.loggingEnabled = false;
		this.emit('ready');
	}

	async startLogging() {
		if (this.loggingEnabled)
			return;

		this.windowsInetBridge.setProxy('https=127.0.0.1:' + this.sslProxyPort);

		this.websocketServer = new WebsocketServer();
		this.websocketServer.headersData = this.headersData;

		this.wsPort = await getPort();
		this.sslServer.wsPort = this.wsPort;
		this.websocketServer.startServer(this.wsPort);

		this.websocketServer.on('connected', () => {
			this.windowsInetBridge.disableProxy();
			this.emit('connected');
		});

		this.websocketServer.on('disconnected', async () => {
			this.emit('disconnected');
			await this.stopLogging();
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
			let packet = new HabboMessage(this.parseBuffer(packetData));
			this.websocketServer.sendIncoming(this.websocketServer.ws, packet);
		} else {
			alert('Please connect before sending data.');
		}
	}

	sendToServer(packetData) {
		if (this.loggingEnabled && this.websocketServer.ws) {
			let packet = new HabboMessage(this.parseBuffer(packetData));
			this.websocketServer.sendOutgoing(this.websocketServer.ws, packet);
		} else {
			alert('Please connect before sending data.');
		}
	}

	parseBuffer(buffer) {
		for (var i = 0; i <= 13; i++) {
			buffer = Util.replaceAll('[' + i + ']', String.fromCharCode(i), buffer);
		}

		return Buffer.from(buffer, 'binary');
	}

	encodeBuffer(buffer) {
		let result = "";

		for (let i = 0; i < buffer.length; i++) {
			if (buffer[i] <= 13) {
				result += "[" + buffer[i] + "]";
			} else {
				result += String.fromCharCode(buffer[i]);
			}
		}

		return result;
	}
}

module.exports = Logger;