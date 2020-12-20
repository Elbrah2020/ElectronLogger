class HabboMessageBuilder {
	constructor(header) {
		this.header = header;
		this.buffer = Buffer.alloc(2);
		this.buffer.writeUInt16BE(header, 0);
	}

	appendRawBytes(buffer) {
		this.buffer = Buffer.concat([this.buffer, buffer]);
	}

	appendString(str) {
    let stringBuffer = Buffer.from(str);
    let lengthBuffer = Buffer.alloc(2);
    lengthBuffer.writeUInt16BE(stringBuffer.length, 0);

    this.buffer = Buffer.concat([this.buffer, lengthBuffer, stringBuffer]);
  }

	appendChar(char) {
		let buffer = Buffer.alloc(String.fromCharCode(char));

		this.buffer = Buffer.concat([this.buffer, buffer]);
	}

	appendInt(value) {
		let buffer = Buffer.alloc(4);
		buffer.writeInt32BE(value, 0);

		this.buffer = Buffer.concat([this.buffer, buffer]);
	}

	appendShort(value) {
		let buffer = Buffer.alloc(2);
		buffer.writeUInt16BE(value, 0);

		this.buffer = Buffer.concat([this.buffer, buffer]);
	}

	appendBoolean(value) {
		let buffer = Buffer.alloc(1);
		buffer.write(String.fromCharCode(value ? 1 : 0), 0);

		this.buffer = Buffer.concat([this.buffer, buffer]);
	}

	getMessageBody() {
		let result = "";

		for (let i = 0; i < this.buffer.length; i++) {
			if (this.buffer[i] <= 13) {
				result += "[" + this.buffer[i] + "]";
			} else {
				result += String.fromCharCode(this.buffer[i]);
			}
		}

		return result;
	}

	getHeader() {
		return this.header;
	}

	get() {
		let buffer = Buffer.alloc(4);
		buffer.writeUInt32BE(this.buffer.length, 0);

		return Buffer.concat([buffer, this.buffer]);
	}
}

module.exports = HabboMessageBuilder;