const https = require('https');
const fs = require('fs');

class SslServer {
	constructor() {
		this.options = {
			key: fs.readFileSync('./certs/selfsigned/habbo.key'),
		  cert: fs.readFileSync('./certs/selfsigned/habbo.crt'),
		  ca: fs.readFileSync('./certs/selfsigned/ca.crt')
		}
	}

	async startServer(port, sslHandler) {
		this.server = https.createServer(this.options, sslHandler);

		return await this.server.listen(port, '127.0.0.1');
	}
}

module.exports = SslServer;