const net = require('net');
const parser = require('http-string-parser');

class SslProxy {
	constructor(target, redirectHosts) {
		this.redirectHosts = redirectHosts;
		this.target = target;
	}

	async startServer(port) {
		this.server = net.createServer(socket => {
			socket.on('data', data => {
				let request = data.toString();
				if (request.startsWith('CONNECT ')) {
					try {
						let parsedRequest = parser.parseRequest(request);
						if (!parsedRequest.uri)
							die();

						let connectionInfo = parsedRequest.uri.split(':');

						if (this.redirectHosts.includes(connectionInfo[0])) {
							connectionInfo[0] = this.target.host;
							connectionInfo[1] = this.target.port;
						}

						socket.client = new net.Socket();

						socket.client.connect(parseInt(connectionInfo[1]), connectionInfo[0], () => {
							socket.write('HTTP/1.1 200 Connection established\n\n');
							socket.pipe(socket.client);
							socket.client.pipe(socket);
						});

						socket.client.on('close', () => {
							socket.destroy();
						});

						socket.client.on('error', () => {
							socket.destroy();
						});
					} catch {
						socket.destroy();
						if (socket.client)
							socket.client.destroy();
					}
				}
			});

			socket.on('error', () => {
				socket.destroy();
				if (socket.client)
					socket.client.destroy();
			});

			socket.on('close', () => {
				if (socket.client)
					socket.client.destroy();
			});
		});

		return await this.server.listen(port, '127.0.0.1');
	}

	async stopServer() {
		return await this.server.close();
	}
}

module.exports = SslProxy;