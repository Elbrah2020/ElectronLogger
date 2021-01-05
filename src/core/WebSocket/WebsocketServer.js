process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const HabboMessageBuilder = require('../Protocol/HabboMessageBuilder');
const BigInteger = require('../Util/BigInteger');
const HabboMessage = require('../Protocol/HabboMessage');
const ChaCha20 = require('../Crypto/JSChaCha20');
const RSA = require('../Crypto/RSA');

const { BrowserWindow, Menu, MenuItem } = require('electron').remote;
const reverse = require('buffer-reverse');
const EventEmitter = require('events');
const getPort = require('get-port');
const WebSocket = require('ws');
const path = require('path');
const tls = require('tls');
const net = require('net');
const fs = require('fs');

class WebsocketServer extends EventEmitter {
	startServer(port) {
		this.packetloggerWindow = new BrowserWindow({
			height: 600,
			width: 700,
			show: false,
			closable: false,
			webPreferences:{
				nodeIntegration: true,
				nodeIntegrationInWorker: true
			}
		});

		this.setupWindowMenu();

		this.packetloggerWindow.loadURL(`file://${__dirname}/../../view/logger.html`);

		const sslServerOptions = {
			key: fs.readFileSync(path.join(__dirname, '../../../certs/habbo/game.habbo.com.key')),
			cert: fs.readFileSync(path.join(__dirname, '../../../certs/habbo/game.habbo.com.crt')),
			requestCert: false,
			ca: []
		};

		const sslClientOptions = {
			key: fs.readFileSync(path.join(__dirname, '../../../certs/habbo/habboclient.key')),
			cert: fs.readFileSync(path.join(__dirname, '../../../certs/habbo/habboclient.crt')),
			ca: []
		};

		const serverRSA = new RSA();
		serverRSA.setPublic('BD214E4F036D35B75FEE36000F24EBBEF15D56614756D7AFBD4D186EF5445F758B284647FEB773927418EF70B95387B80B961EA56D8441D410440E3D3295539A3E86E7707609A274C02614CC2C7DF7D7720068F072E098744AFE68485C6297893F3D2BA3D7AAAAF7FA8EBF5D7AF0BA2D42E0D565B89D332DE4CF898D666096CE61698DE0FAB03A8A5E12430CB427C97194CBD221843D162C9F3ACF74DA1D80EBC37FDE442B68A0814DFEA3989FDF8129C120A8418248D7EE85D0B79FA818422E496D6FA7B5BD5DB77E588F8400CDA1A8D82EFED6C86B434BAFA6D07DFCC459D35D773F8DFAF523DFED8FCA45908D0F9ED0D4BCEAC3743AF39F11310EAF3DFF45', '10001');

		const clientRSA = new RSA();
		clientRSA.setPrivate('C22DF39849BA2F27B2B33215CCDAB81361FE712C9F6505FB547F057F32F7AE2949D65EA29D44855549095004B94B1622FA54044C2FA634ADF527790DD8833CD59AA3EB30A3DF34D6F3C36D6F750C9E036398A1A49FE073DAAF5C9C4F38FCDDD0172B60BD0C7DCA585F7A666FD953EFD4A2C880A9CF378B5036DD2D822559C8FEF050D0B4518580AE771E4C58EB062E5F9B9E8F1288AD8939D129AFB53218B07DFA5595068096940EE5C8D53C3D14915CA1AA0B03E84A3C90666AAD97F9201502BD3C03F4A21A89E722A0ACE9FEAEFA64DAA0B5A9CDD0887C1AB7BC90B37947D6ABD7F7DCE6626AB232D6F2B1410FA592C637D5B0B5C66DDB3FD1D52A6AC1BC21', '10001', '3325435A436124F681DD2D3E0CBD376AF38EBF648F7F5E79FAA19263149BA465FFAAD53663D21E847E3E53B34AD2FA3BB04FDCE9EC4B0CE91CFF8EA514F84C57BEE99A132FB6A5065122927A9F0BF9BACECAEF189B7BD5482E94681F7DD52CDF989AB65A5525F4DC1E19F14D58A30132B2C5B90E0124922F48A42D4E70641BCA85193882D983B6E464893F05C0B8E4526A753E48F78ADBAA299E1B0C9009D24C6B10D8A04B8B640885F1BCE4736FD0B3B3D1D869CAF4C535C128E7D086D00FB8B6EADEE3569D26879E446CD29CEB10513509F197157D3CE9E89D6379DA3D1E0EC9284845FE211A82F828B2A728FCCA5EC053EAE870FCE6A7B069CD432F84D6B9');

		this.packetHooks = [];

		this.wsServer = new WebSocket.Server({ port: port });

		this.wsServer.on('connection', async (ws, req) => {
			let gameEndpoint = this.getGameEndpointByOrigin(req.headers.origin);
			this.ws = ws;

			ws.diffieHellman = {};
			ws.crypto = {
				client: {},
				server: {}
			};

			ws.tlsClientGateway = net.createServer(socket => {
				ws.tlsClientSocket = socket;

				socket.on('data', data => {
					ws.clientWebsocket.send(data);
				});
			});

			await ws.tlsClientGateway.listen(await getPort());

			ws.clientWebsocket = new WebSocket(gameEndpoint);

			ws.clientWebsocket.on('open', () => {
				ws.clientWebsocket.send(Buffer.from('StartTLS'));
			});

			ws.clientWebsocket.on('message', async data => {
				if (data == 'OK') {
					while(!ws.tlsServerClearStream) {
						await new Promise(resolve => setTimeout(resolve, 200));
					}

					ws.tlsClientClearStream = tls.connect(ws.tlsClientGateway.address().port, sslClientOptions, () => {
					});

					ws.tlsClientClearStream.on('data', buffer => {
						let packets = this.parseBuffer(ws, buffer, false);

						packets.forEach(packet => {
							for(let i = 0; i < this.packetHooks.length; i++) {
								let method = this.packetHooks[i];

								if (method) {
									let methodResult = method(new HabboMessage(packet.buffer, packet.isOutgoing(), packet.name));

									if (methodResult === false)
										return;
								}
							}

							switch(packet.header) {
								case 278:
									ws.diffieHellman.prime = new BigInteger(serverRSA.verify(packet.readString()), 10);
									ws.diffieHellman.generator = new BigInteger(serverRSA.verify(packet.readString()), 10);

									let dhInitHandshake = new HabboMessageBuilder(packet.header);
									dhInitHandshake.appendString(clientRSA.sign(ws.diffieHellman.prime.toString()));
									dhInitHandshake.appendString(clientRSA.sign(ws.diffieHellman.generator.toString()));
									this.sendIncoming(ws, dhInitHandshake);
								break;
								case 279:
									ws.diffieHellman.serverPublicKey = new BigInteger(serverRSA.verify(packet.readString()), 10);
									ws.diffieHellman.serverSharedKey = ws.diffieHellman.serverPublicKey.modPow(ws.diffieHellman.mitmClientPrivateKey, ws.diffieHellman.prime);

									ws.diffieHellman.mitmServerPublicKey = ws.diffieHellman.generator.modPow(ws.diffieHellman.mitmClientPrivateKey, ws.diffieHellman.prime);
									let completeDhHandshake = new HabboMessageBuilder(packet.header);
									completeDhHandshake.appendString(clientRSA.sign(ws.diffieHellman.mitmServerPublicKey.toString()));
									completeDhHandshake.appendBoolean(false);

									this.sendIncoming(ws, completeDhHandshake);

									var serverChaChakey = Buffer.alloc(32);
									serverChaChakey.fill(0);
									Buffer.from(ws.diffieHellman.serverSharedKey.toByteArray(true)).copy(serverChaChakey);

									ws.crypto.server.incomingChaCha = new ChaCha20(serverChaChakey, ws.crypto.nonce);
									ws.crypto.server.outgoingChaCha = new ChaCha20(serverChaChakey, ws.crypto.nonce);

									var unityChaChakey = Buffer.alloc(32);
									unityChaChakey.fill(0);
									Buffer.from(ws.diffieHellman.unityClientSharedKey.toByteArray(true)).copy(unityChaChakey);

									ws.crypto.client.incomingChaCha = new ChaCha20(unityChaChakey, ws.crypto.nonce);
									ws.crypto.client.outgoingChaCha = new ChaCha20(unityChaChakey, ws.crypto.nonce);
								break;
								default:
									this.sendIncoming(ws, packet);
								break;
							}
						});
					});
				} else {
					while(!ws.tlsClientSocket) {
						await new Promise(resolve => setTimeout(resolve, 200));
					}
					ws.tlsClientSocket.write(data);
				}
			});

			ws.tlsServer = tls.createServer(sslServerOptions, tlsServerClearStream => {
				this.emit('connected');
				this.packetloggerWindow.show();

				ws.tlsServerClearStream = tlsServerClearStream;
				tlsServerClearStream.on('data', async buffer => {

					let packets = this.parseBuffer(ws, buffer, true);

					if(ws.tlsClientClearStream) {
						packets.forEach(packet => {
							for(let i = 0; i < this.packetHooks.length; i++) {
								let method = this.packetHooks[i];

								if (method) {
									let methodResult = method(new HabboMessage(packet.buffer, packet.isOutgoing(), packet.name));

									if (methodResult === false)
										return;
								}
							}

							switch(packet.header) {
								case 4000:
									let nonce = packet.readString();

									ws.crypto.nonce = '';

									for(let i = 0; i < 8; i++)
										ws.crypto.nonce += nonce.substring(i * 3, i * 3 + 2);

									ws.crypto.nonce = Buffer.from(ws.crypto.nonce, 'hex');
									this.sendOutgoing(ws, packet);
								break;
								case 208:
									ws.diffieHellman.unityClientPublicKey = new BigInteger(clientRSA.decrypt(packet.readString()), 10);
									ws.diffieHellman.mitmClientPrivateKey = new BigInteger('1835282320', 10);

									ws.diffieHellman.mitmClientPublicKey = ws.diffieHellman.generator.modPow(ws.diffieHellman.mitmClientPrivateKey, ws.diffieHellman.prime);
									ws.diffieHellman.unityClientSharedKey = ws.diffieHellman.unityClientPublicKey.modPow(ws.diffieHellman.mitmClientPrivateKey, ws.diffieHellman.prime);

									let completeDhHandshake = new HabboMessageBuilder(packet.header);
									completeDhHandshake.appendString(serverRSA.encrypt(ws.diffieHellman.mitmClientPublicKey.toString()));
									this.sendOutgoing(ws, completeDhHandshake);
								break;
								default:
									this.sendOutgoing(ws, packet);
								break;
							}
						});
					} else {
						while(!ws.tlsClientClearStream) {
							await new Promise(resolve => setTimeout(resolve, 200));
						}
						packets.forEach(packet => {
							switch(packet.header) {
								case 4000:
									let nonce = packet.readString();

									ws.crypto.nonce = '';

									for(let i = 0; i < 8; i++)
										ws.crypto.nonce += nonce.substring(i * 3, i * 3 + 2);

									ws.crypto.nonce = Buffer.from(ws.crypto.nonce, 'hex');
								break;
							}
							this.sendOutgoing(ws, packet);
						});
					}
				});
			});

			await ws.tlsServer.listen(await getPort());

			ws.tlsServerGateway = new net.Socket();
			ws.tlsServerGateway.connect(ws.tlsServer.address().port, '127.0.0.1');
			
			ws.tlsServerGateway.on('data', tlsServerGatewayData => {
				ws.send(tlsServerGatewayData);
			});

			ws.on('message', websocketInputData => {
				if (websocketInputData == 'StartTLS') {
					ws.send(Buffer.from('OK'));
				} else {
					if (typeof websocketInputData == 'string') {
						console.log(websocketInputData);
					} else {
						ws.tlsServerGateway.write(websocketInputData);
					}
				}
			});

			ws.on('close', () => {
				this.emit('disconnected');
			});

			ws.clientWebsocket.on('close', () => {
				this.emit('disconnected');
			});
		});
	}

	getGameEndpointByOrigin(origin) {
		switch(origin) {
			case 'https://www.habbo.com':
				return 'wss://game-us.habbo.com:30001/websocket';
			break;
			case 'https://www.habbo.com.br':
				return 'wss://game-br.habbo.com:30001/websocket';
			break;
			case 'https://www.habbo.com.tr':
				return 'wss://game-tr.habbo.com:30001/websocket';
			break;
			case 'https://www.habbo.de':
				return 'wss://game-de.habbo.com:30001/websocket';
			break;
			case 'https://www.habbo.es':
				return 'wss://game-es.habbo.com:30001/websocket';
			break;
			case 'https://www.habbo.fi':
				return 'wss://game-fi.habbo.com:30001/websocket';
			break;
			case 'https://www.habbo.fr':
				return 'wss://game-fr.habbo.com:30001/websocket';
			break;
			case 'https://www.habbo.it':
				return 'wss://game-it.habbo.com:30001/websocket';
			break;
			case 'https://www.habbo.nl':
				return 'wss://game-nl.habbo.com:30001/websocket';
			break;
			case 'https://sandbox.habbo.com':
				return 'wss://game-s2.habbo.com:30001/websocket';
			break;
		}
	}

	sendOutgoing(ws, packet) {
		this.sendPacket(ws, packet, true);
	}

	sendIncoming(ws, packet) {
		this.sendPacket(ws, packet, false);
	}

	sendPacket(ws, packet, isOutgoing) {
		let target = isOutgoing ? ws.tlsClientClearStream : ws.tlsServerClearStream;

		if (isOutgoing) {
			this.packetloggerWindow.webContents.send('outgoingMessage', packet.getMessageBody(true), packet.header, packet.name);
		} else {
			this.packetloggerWindow.webContents.send('incomingMessage', packet.getMessageBody(true), packet.header, packet.name);
		}

		let buffer = packet.get();

		if (isOutgoing && ws.crypto.server.outgoingChaCha) {
			let headerBytes = reverse(buffer.slice(4, 6));

			reverse(ws.crypto.server.outgoingChaCha.encrypt(headerBytes)).copy(buffer, 4);
		} else if (ws.crypto.client.outgoingChaCha) {
			let headerBytes = reverse(buffer.slice(4, 6));

			reverse(ws.crypto.client.outgoingChaCha.encrypt(headerBytes)).copy(buffer, 4);
		}

		target.write(buffer);
	}

	parseBuffer(ws, buffer, isOutgoing) {
		let countPackets = 0;
		let maxPackets = 50;
		let packets = [];

		if (isOutgoing) {
			if (ws.outgoingBuffer) {
				buffer = Buffer.concat([ws.outgoingBuffer, buffer]);
				ws.outgoingBuffer = null;
			}
		} else {
			if (ws.incomingBuffer) {
				buffer = Buffer.concat([ws.incomingBuffer, buffer]);
				ws.incomingBuffer = null;
			}
		}

		while (buffer.length > 3) {
			if (countPackets++ >= maxPackets) {
				return packets;
			}

			let length = buffer.readInt32BE(0) + 4;

			if (length > buffer.length) {
				if (isOutgoing) {
					if (ws.outgoingBuffer) {
						ws.outgoingBuffer = Buffer.concat([ws.outgoingBuffer, buffer]);
					} else {
						ws.outgoingBuffer = buffer;
					}
				} else {
					if (ws.incomingBuffer) {
						ws.incomingBuffer = Buffer.concat([ws.incomingBuffer, buffer]);
					} else {
						ws.incomingBuffer = buffer;
					}
				}
				return packets;
			}

			let packet = buffer.slice(0, length);

			if (isOutgoing && ws.crypto.client.incomingChaCha) {
				let headerBytes = reverse(packet.slice(4, 6));
				
				reverse(ws.crypto.client.incomingChaCha.decrypt(headerBytes)).copy(packet, 4);
			} else if (ws.crypto.server.incomingChaCha) {
				let headerBytes = reverse(packet.slice(4, 6));
				
				reverse(ws.crypto.server.incomingChaCha.decrypt(headerBytes)).copy(packet, 4);
			}

			let packetHeader = packet.readInt16BE(4);

			packets.push(new HabboMessage(packet, isOutgoing, (isOutgoing ? this.headersData.outgoing[packetHeader] : this.headersData.incoming[packetHeader])));

			buffer = buffer.slice(length);
		}

		return packets;
	}

	registerPacketHook(method) {
		if (typeof method != 'function')
			return;

		return this.packetHooks.push(method) - 1;
	}

	unregisterPacketHook(index) {
		delete this.packetHooks[index];
	}

	async stop() {
		return await this.wsServer.close();
	}

	setupWindowMenu() {
		const menu = new Menu();

		const displayIncomingMenuItem = new MenuItem({
			label: 'Display incoming',
			type: 'checkbox',
			accelerator: 'Ctrl+I',
			checked: true,
			click: () => {
				this.packetloggerWindow.webContents.send('triggerIncomingLogging');
			}
		});

		const displayOutgoingMenuItem = new MenuItem({
			label: 'Display outgoing',
			type: 'checkbox',
			accelerator: 'Ctrl+O',
			checked: true,
			click: () => {
				this.packetloggerWindow.webContents.send('triggerOutgoingLogging');
			}
		});

		const triggerAutoscrollMenuItem = new MenuItem({
			label: 'Auto scrolling',
			type: 'checkbox',
			accelerator: 'Ctrl+S',
			checked: true,
			click: () => {
				this.packetloggerWindow.webContents.send('triggerAutoscroll');
			}
		});

		const triggerAlwaysOnTopMenuItem = new MenuItem({
			label: 'Always on top',
			type: 'checkbox',
			accelerator: 'Ctrl+T',
			checked: false,
			click: () => {
				this.packetloggerWindow.setAlwaysOnTop(!this.packetloggerWindow.isAlwaysOnTop());
			}
		});

		menu.append(new MenuItem({
			label: 'File',
			submenu: [{
				label: 'Clear log',
				accelerator: 'Ctrl+E',
				click: () => {
					this.packetloggerWindow.webContents.send('clearLogs');
				}
			}]
		}));

		menu.append(new MenuItem({
			label: 'Display',
			submenu: [ displayIncomingMenuItem, displayOutgoingMenuItem, triggerAutoscrollMenuItem, triggerAlwaysOnTopMenuItem ]
		}));

		this.packetloggerWindow.setMenu(menu);
	}
}

module.exports = WebsocketServer;