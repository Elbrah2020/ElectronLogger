class Util {
	static replaceAll(find, replace, string) {
		return string.replace(new RegExp(Util.escapeRegExp(find), 'g'), replace);
	}

	static escapeRegExp(string) {
		return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	}
}

module.exports = Util;