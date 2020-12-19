const crypto = require('crypto');

class Random {
	static getRandomHash() {
		let current_date = (new Date()).valueOf().toString();
		let random = Math.random().toString();
		return crypto.createHash('sha1').update(current_date + random).digest('hex');
	}
}

module.exports = Random;