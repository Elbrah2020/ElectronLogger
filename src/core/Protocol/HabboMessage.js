class HabboMessage {
	constructor(buffer) {
		this.position = 0;
		this.buffer = buffer;
		this.length = this.readInt();
		this.header = this.readShort();
	}

	setIncoming() {
		this.incoming = true;
	}

	setOutgoing() {
		this.outgoing = true;
	}

	readLong() {
		let long = this.buffer.readBigInt64BE(this.position);
		this.position += 8;

		return long;
	}

	readInt() {
		let int = this.buffer.readInt32BE(this.position);
		this.position += 4;

		return int;
	}

	readShort() {
		let short = this.buffer.readInt16BE(this.position);
		this.position += 2;

		return short;
	}

	readString() {
		let length = this.readShort();

		let str = this.buffer.slice(this.position, this.position + length).toString();
		this.position += length;

		return str;
	}

	readBuffer(length) {
		let readedBuffer = this.buffer.slice(this.position, this.position + length);
		this.position += length;

		return readedBuffer;
	}

	readBool() {
		if (this.position == this.buffer.length - 1)
			throw 'Not enough bytes';


		let bool = this.buffer[0] == 1;
		this.position += 1;

		return bool;
	}

	get() {
		return this.buffer;
	}

	getHeader() {
		return this.header;
	}

	getMessageBody(fullPacket) {
		let result = "";

		for (let i = fullPacket ? 0 : 6; i < this.buffer.length; i++) {
			if (this.buffer[i] <= 13) {
				result += "[" + this.buffer[i] + "]";
			} else {
				result += String.fromCharCode(this.buffer[i]);
			}
		}

		return result;
	}
}

module.exports = HabboMessage;