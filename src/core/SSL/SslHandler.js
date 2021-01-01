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

				if (req.sslServer.loggerInstance.enableExperimentalStructure) {
					body = body.replace('.code.unityweb', '.code.patched.unityweb');
				}

				res.setHeader('access-control-allow-headers', 'Accept, Content-Type, Origin, X-Requested-With, Pragma, X-App-Key, Cache-Control');
				res.setHeader('access-control-allow-methods', 'POST, GET, OPTIONS');
				res.setHeader('access-control-allow-origin', '*');
				res.setHeader('access-control-expose-headers', 'ETag');
				res.end(body);
			}

			if (req.url.includes('/WebGL/habbo2020-global-prod/Build/habbo2020-global-prod.wasm.framework.unityweb?')) {
				body = body.toString().replace('webSocketState.instances[id]={url:urlStr,ws:null}', 'webSocketState.instances[id]={url:"ws://localhost:' + req.sslServer.wsPort + '/",ws:null}');

				if (req.sslServer.loggerInstance.enableExperimentalStructure) {
					body = body.replace('_JS_Log_Dump(ptr,type){', '_JS_Log_Dump(ptr,type){' + "if(type>6000&&type<7000){var instance=webSocketState.instances[0];if(!instance||!instance.ws)return;switch(type){case 6661:let i64firstByte=BigInt(HEAPU8[ptr+23]);let i64secondByte=BigInt(HEAPU8[ptr+22]);let i64thirdByte=BigInt(HEAPU8[ptr+21]);let i64fourthByte=BigInt(HEAPU8[ptr+20]);let i64fifthByte=BigInt(HEAPU8[ptr+19]);let i64sixthByte=BigInt(HEAPU8[ptr+18]);let i64seventhByte=BigInt(HEAPU8[ptr+17]);let i64eighthByte=BigInt(HEAPU8[ptr+16]);let i64=(i64firstByte<<56n)+(i64secondByte<<48n)+(i64thirdByte<<40n)+(i64fourthByte<<32n)+(i64fifthByte<<24n)+(i64sixthByte<<16n)+(i64seventhByte<<8n)+(i64eighthByte<<0n);instance.ws.send('rl.'+i64);break;case 6662:let i32firstByte=HEAPU8[ptr+19];let i32secondByte=HEAPU8[ptr+18];let i32thirdByte=HEAPU8[ptr+17];let i32fourthByte=HEAPU8[ptr+16];let i32=(i32firstByte<<24)+(i32secondByte<<16)+(i32thirdByte<<8)+(i32fourthByte<<0);instance.ws.send('ri.'+i32);break;case 6663:let i16firstByte=HEAPU8[ptr+17];let i16secondByte=HEAPU8[ptr+16];let i16=(i16firstByte<<8)+(i16secondByte<<0);instance.ws.send('rs.'+i16);break;case 6664:let boolByte=HEAPU8[ptr+16];instance.ws.send('rb.'+boolByte);break;case 6665:instance.ws.send('wl.'+ptr);break;case 6666:instance.ws.send('wi.'+ptr);break;case 6667:instance.ws.send('ws.'+ptr);break;case 6668:instance.ws.send('wb.'+ptr);break;}return;}");
				}

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

			if (req.sslServer.loggerInstance.enableExperimentalStructure && req.url.includes('/WebGL/habbo2020-global-prod/Build/habbo2020-global-prod.wasm.code.patched.unityweb')) {
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

	if (req.sslServer.loggerInstance.enableExperimentalStructure && req.url.includes('/WebGL/habbo2020-global-prod/Build/habbo2020-global-prod.wasm.code.patched.unityweb')) {
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