const {gzip, ungzip} = require('node-gzip');
const HttpProxy = require('http-proxy');
const isGzip = require('is-gzip');
const Random = require('../Util/Random');
const path = require('path');
const fs = require('fs');

const proxy = new HttpProxy();

const customLoadingImage = fs.readFileSync(path.join(__dirname, '../../../icon.png'));

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
				body = body.replace('/style.css', '/style.css?' + Random.getRandomHash());

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
				body = body.toString().replace('webSocketState.instances[id]={url:urlStr,ws:null}', 'webSocketState.instances[id]={url:"ws://localhost:3336/",ws:null}');

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

			if (req.injectVersionText) {
				body = body.toString().split(' ')[0] + ' - Powered by ElectronLogger ª';

				res.setHeader('access-control-allow-headers', 'Accept, Content-Type, Origin, X-Requested-With, Pragma, X-App-Key, Cache-Control');
				res.setHeader('access-control-allow-methods', 'POST, GET, OPTIONS');
				res.setHeader('access-control-allow-origin', '*');
				res.setHeader('access-control-expose-headers', 'ETag');
				res.end(body);
			}

			if (req.url.includes('/WebGL/habbo2020-global-prod/assets/css/style.css?')) {
				body = body.toString().replace('images/progressLogo.Dark.png', 'images/progressLogo.Patched.png');

				res.setHeader('access-control-allow-headers', 'Accept, Content-Type, Origin, X-Requested-With, Pragma, X-App-Key, Cache-Control');
				res.setHeader('access-control-allow-methods', 'POST, GET, OPTIONS');
				res.setHeader('access-control-allow-origin', '*');
				res.setHeader('access-control-expose-headers', 'ETag');
				res.setHeader('content-type', 'text/css');
				res.end(body);
			}
		});
	}
});

module.exports = (req, res) => {
	let proxyOptions = { target: 'https://' + req.headers.host };

	if (req.url.startsWith('/client/v2/')
		|| req.url.includes('/WebGL/habbo2020-global-prod/Build/habbo2020-global-prod.json?')
		|| req.url.includes('/WebGL/habbo2020-global-prod/Build/habbo2020-global-prod.wasm.framework.unityweb?')) {
		proxyOptions.selfHandleResponse = true;
		req.parseChunk = true;
	}

	if (req.url.includes('/WebGL/habbo2020-global-prod/Build/habbo2020-global-prod.data.unityweb?')) {
		req.headers.host = 'jxz.be';
		req.headers.from = 'ElectronLogger';
		proxyOptions.target = 'https://jxz.be';
		proxyOptions.selfHandleResponse = true;
		req.parseChunk = true;
	}

	if (req.url.endsWith('/WebGL/habbo2020-global-prod/StreamingAssets/Cracked.txt')) {
		req.url = req.url.replace('Cracked.txt', 'Version.txt');
		proxyOptions.selfHandleResponse = true;
		req.parseChunk = true;
		req.injectVersionText = true;
	}

	if (req.url.includes('/WebGL/habbo2020-global-prod/assets/css/style.css?')) {
		proxyOptions.selfHandleResponse = true;
		req.parseChunk = true;
	}

	if (req.url.endsWith('/WebGL/habbo2020-global-prod/assets/images/progressLogo.Patched.png')) {
		res.setHeader('access-control-allow-headers', 'Accept, Content-Type, Origin, X-Requested-With, Pragma, X-App-Key, Cache-Control');
		res.setHeader('access-control-allow-methods', 'POST, GET, OPTIONS');
		res.setHeader('access-control-allow-origin', '*');
		res.setHeader('access-control-expose-headers', 'ETag');
		res.setHeader('content-type', 'image/png');
		res.end(customLoadingImage);
		return;
	}

	proxy.web(req, res, proxyOptions);
}