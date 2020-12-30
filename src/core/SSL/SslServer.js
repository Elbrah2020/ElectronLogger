const https = require('https');
const path = require('path');
const fs = require('fs');

class SslServer {
	constructor() {
		this.options = {
			key: fs.readFileSync(path.join(__dirname, '../../../certs/selfsigned/habbo.key')),
		  cert: fs.readFileSync(path.join(__dirname, '../../../certs/selfsigned/habbo.crt')),
		  ca: fs.readFileSync(path.join(__dirname, '../../../certs/selfsigned/ca.crt'))
		}

		this.wsPort = 0;
	}

	async startServer(port, sslHandler) {
		this.server = https.createServer(this.options, (req, res) => {
			req.sslServer = this;
			sslHandler(req, res);
		});

		return await this.server.listen(port, '127.0.0.1');
	}
}

module.exports = SslServer;