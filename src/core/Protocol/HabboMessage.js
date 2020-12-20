class HabboMessage {
	constructor(buffer) {
		this.buffer = buffer;
		this.originalBuffer = Buffer.alloc(this.buffer.length);
		this.buffer.copy(this.originalBuffer);
		this.length = this.readInt();
		this.header = this.readShort();
	}

	setIncoming() {
		this.incoming = true;
	}

	setOutgoing() {
		this.outgoing = true;
	}

	readInt() {
		try {
			let int = this.buffer.readUInt32BE(0);
			this.buffer = this.buffer.slice(4);

			return int;
		} catch (e) {
		}
		return -1;
	}

	readShort() {
		try {
			let short = this.buffer.readUInt16BE(0);
			this.buffer = this.buffer.slice(2);

			return short;
		} catch (e) {
		}

		return -1;
	}

	readString() {
		try {
			let length = this.readShort();
			let str = this.buffer.slice(0, length).toString();
			this.buffer = this.buffer.slice(length);

			return str;
		} catch (e) {
		}

		return null;
	}

	readBuffer(length) {
		try {
			let readedBuffer = this.buffer.slice(0, length);
			this.buffer = this.buffer.slice(length);

			return readedBuffer;
		} catch (e) {
		}

		return null;
	}

	readBool() {
		try {
			let bool = this.buffer[0] == 1;
			this.buffer = this.buffer.slice(1);

			return bool;
		} catch (e) {
		}

		return false;
	}

	getHeader() {
		return this.header;
	}

	getMessageBody(fullPacket) {
		let result = "";

		for (let i = fullPacket ? 0 : 6; i < this.originalBuffer.length; i++) {
			if (this.originalBuffer[i] <= 13) {
				result += "[" + this.originalBuffer[i] + "]";
			} else {
				result += String.fromCharCode(this.originalBuffer[i]);
			}
		}

		return result;
	}
}

module.exports = HabboMessage;