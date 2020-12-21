const request = require('request');

class HeadersData {
	constructor() {
		this.incoming = [];
		this.outgoing = [];
	}

	async loadHeaders() {
		return new Promise((resolve, reject) => {
			request.get({
				url: 'https://jxz.be/habbo-webgl-clients/headers.json',
				json: true
			}, (err, res, data) => {
				if(err)
					reject(err);
				data.incoming.forEach(header => {
					this.incoming[header.header] = header.name;
				});
				data.outgoing.forEach(header => {
					this.outgoing[header.header] = header.name;
				});
				resolve();
			});
		});
	}
}

module.exports = HeadersData;