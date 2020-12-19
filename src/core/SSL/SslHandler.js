const {gzip, ungzip} = require('node-gzip');
const HttpProxy = require('http-proxy');
const isGzip = require('is-gzip');
const Random = require('../Util/Random');
const fs = require('fs');

const proxy = new HttpProxy();

proxy.on('proxyRes', (proxyRes, req, res) => {
	if (req.parseChunk) {
		var body = [];
		proxyRes.on('data', chunk => {
			body.push(chunk);
		});
		proxyRes.on('end', async () => {
			body = Buffer.concat(body);

			if (isGzip(body)) {
				body = await ungzip(body);
			}

			if (req.url.startsWith('/client/v2/')) {
				body = body.toString().replace('habbo2020-global-prod.json', 'habbo2020-global-prod.json?' + Random.getRandomHash());

				res.end(body);
			}

			if (req.url.includes('/WebGL/habbo2020-global-prod/Build/habbo2020-global-prod.json?')) {
				body = body.toString().replace('.data.unityweb', '.data.unityweb?' + Random.getRandomHash());
				body = body.replace('.framework.unityweb', '.framework.unityweb?' + Random.getRandomHash());

				res.setHeader('access-control-allow-headers', 'Accept, Content-Type, Origin, X-Requested-With, Pragma, X-App-Key, Cache-Control');
				res.setHeader('access-control-allow-methods', 'POST, GET, OPTIONS');
				res.setHeader('access-control-allow-origin', '*');
				res.setHeader('access-control-expose-headers', 'ETag');
				res.end(body);
			}

			if (req.url.includes('/WebGL/habbo2020-global-prod/Build/habbo2020-global-prod.wasm.framework.unityweb?')) {
				body = body.toString().replace('webSocketState.instances[id]={url:urlStr,ws:null}', 'webSocketState.instances[id]={url:"ws://localhost:30001/",ws:null}');

				res.setHeader('access-control-allow-headers', 'Accept, Content-Type, Origin, X-Requested-With, Pragma, X-App-Key, Cache-Control');
				res.setHeader('access-control-allow-methods', 'POST, GET, OPTIONS');
				res.setHeader('access-control-allow-origin', '*');
				res.setHeader('access-control-expose-headers', 'ETag');
				res.end(body);
			}

			if (req.url.includes('/WebGL/habbo2020-global-prod/Build/habbo2020-global-prod.data.unityweb?')) {
				res.setHeader('access-control-allow-headers', 'Accept, Content-Type, Origin, X-Requested-With, Pragma, X-App-Key, Cache-Control');
				res.setHeader('access-control-allow-methods', 'POST, GET, OPTIONS');
				res.setHeader('access-control-allow-origin', '*');
				res.setHeader('access-control-expose-headers', 'ETag');

				res.end(body);
			}
		});
	}
});

module.exports = (req, res) => {
	console.log(req.url);
	let proxyOptions = { target: 'https://' + req.headers.host }

	if (req.url.startsWith('/client/v2/')
		|| req.url.includes('/WebGL/habbo2020-global-prod/Build/habbo2020-global-prod.json?')
		|| req.url.includes('/WebGL/habbo2020-global-prod/Build/habbo2020-global-prod.wasm.framework.unityweb?')) {
		proxyOptions.selfHandleResponse = true;
		req.parseChunk = true;
	}

	if (req.url.includes('/WebGL/habbo2020-global-prod/Build/habbo2020-global-prod.data.unityweb?')) {
		req.headers.host = 'jxz.be';
		proxyOptions.target = 'https://jxz.be';
		proxyOptions.selfHandleResponse = true;
		req.parseChunk = true;
	}

	proxy.web(req, res, proxyOptions);
}