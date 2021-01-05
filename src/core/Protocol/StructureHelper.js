class StructureHelper {
	constructor(packetloggerWindow) {
		this.writeQueue = [];
		this.readQueue = [];

		this.incomingPacketQueue = [];
		this.outgoingPacketQueue = [];

		this.packetloggerWindow = packetloggerWindow;
	}

	parse(structureStr) {
		if (structureStr[0] == 'r') {
			this.readQueue.push(structureStr.split('.'));
			console.log(structureStr);
			this.processIncomingQueue();
		} else if (structureStr[0] == 'w') {
			this.writeQueue.push(structureStr.split('.'));
			//console.log(structureStr);
			this.processOutgoingQueue();
		}
	}

	processOutgoingQueue() {
		if (this.outgoingPacketQueue.length > 0) {
			//for (let i = 0; i < this.outgoingPacketQueue.length; i++) {
			let i = 0;
			let packet = this.outgoingPacketQueue[i];
			packet.position = 6;

			let structure = '{l}{u:' + packet.header + '}';

			if (packet.remainingBytes() == 0) {
				this.writeQueue.shift();
				this.writeQueue.shift();
				this.outgoingPacketQueue.shift();

				packet.structure = structure;

				this.sendToWindow(packet);

				//console.log(structure);
				//continue;
				return;
			}

			//console.log(JSON.stringify(this.writeQueue));
			var j;
			for(j = 1; j < this.writeQueue.length; j++) {
				let write = this.writeQueue[j];
				let nextWrite = this.writeQueue[j + 1];

				//console.log(packet.remainingBytes());

				if (packet.remainingBytes() == 0) {
					break;
				}

				//console.log(write, packet.remainingBytes());

				switch(write[0]) {
					case 'ws':
						let short = packet.readShort();
						let isString = false;

						if (!nextWrite) {
							return;
						}

						if (packet.remainingBytes() > 0) {
							if (nextWrite[0] == 'ws') {
								if (packet.remainingBytes() >= 2) {
									let shortBytes = this.encodeShort(nextWrite[1]);
									let nextBytes = packet.readBuffer(2);
									packet.position -= 2;

									if(!shortBytes.equals(nextBytes)) {
										isString = true;
									}
								} else {
									isString = true;
								}
							} else if (nextWrite[0] == 'wi') {
								if (packet.remainingBytes() >= 4) {
									let intBytes = this.encodeShort(nextWrite[1]);
									let nextBytes = packet.readBuffer(4);
									packet.position -= 4;

									if(!intBytes.equals(nextBytes)) {
										isString = true;
									}
								} else {
									isString = true;
								}
							} else if (nextWrite[0] == 'wl') {
								if (packet.remainingBytes() >= 8) {
									let nextBytes = packet.readBuffer(8);
									packet.position -= 8;

									if (!(/[\x00-\x1F]/.test(nextBytes.toString()))) {
										isString = true;
									}
								} else {
									isString = true;
								}
							} else if (nextWrite[0] == 'wb') {
								let nextBytes = packet.readBuffer(1);
								packet.position -= 1;

								if (nextBytes[0] != nextWrite[1]) {
									isString = true;
								}
							}
						}

						if (isString) {
							packet.position -= 2;
							structure += '{s:' + packet.readString() + '}';
						} else {
							structure += '{u:' + short + '}';
						}
					break;
					case 'wi':
						//console.log('TRYING TO READ32 FOR ' + packet.header + ', remaining:' + packet.remainingBytes(), 'structure:' + structure);
						let integer = packet.readInt();
						structure += '{i:' + integer + '}';
					break;
					case 'wl':
						//console.log('TRYING TO READ64 FOR ' + packet.header + ', remaining:' + packet.remainingBytes(), 'structure:' + structure);
						let long = packet.readLong();
						structure += '{l:' + long + '}';
					break;
					case 'wb':
						let bool = packet.readBool();

						structure += bool ? '{b:True}' : '{b:False}';
					break;
				}
			}

			while(j + 1 > 0) {
				this.writeQueue.shift();
				j--;
			}

			this.outgoingPacketQueue.shift();
			//console.log(this.writeQueue);
			packet.structure = structure;
			//console.log(structure);
			this.sendToWindow(packet);
		}
	}

	processIncomingQueue() {
		if (this.incomingPacketQueue.length > 0) {
			let i = 0;
			let packet = this.incomingPacketQueue[i];
			packet.position = 6;

			let structure = '{l}{u:' + packet.header + '}';

			if (packet.remainingBytes() == 0) {
				this.readQueue.shift();
				this.readQueue.shift();
				this.incomingPacketQueue.shift();

				packet.structure = structure;

				console.log(structure);

				//this.sendToWindow(packet);
				return;
			}

			//console.log(JSON.stringify(this.readQueue));

			var j;
			for(j = 0; j < this.readQueue.length; j++) {
				let read = this.readQueue[j];
				let nextRead = this.readQueue[j + 1];

				if (packet.remainingBytes() == 0) {
					break;
				}

				if ((j == 0 && read[0] != 'ri') || (j == 1 && read[0] != 'rs')) {
					console.log('READ MISMATCH', j, read);
					return;
				}

				if (j == 0 && read[1] != packet.length) {
					console.log('LENGTH MISMATCH', read[1], packet.length);
				}

				if (j == 1 && ((packet.header == 290 && packet.remainingBytes() == 3) || (packet.header == 517 && packet.remainingBytes() == 1))) {
					this.readQueue.shift();
					this.readQueue.shift();
					this.incomingPacketQueue.shift();

					packet.structure = structure;

					console.log(structure);

					//this.sendToWindow(packet);
					return;
				}

				if (j <= 1)
					continue;

				if (!nextRead) {
					return;
				}

				switch(read[0]) {
					case 'rs':
						let short = packet.readShort();
						let isString = false;

						if (packet.remainingBytes() > 0) {
							if (nextRead[0] == 'rs') {
								if (packet.remainingBytes() >= 2) {
									let shortBytes = this.encodeShort(nextRead[1]);
									let nextBytes = packet.readBuffer(2);
									packet.position -= 2;

									//console.log(shortBytes, nextBytes, !(/[\x00-\x1F]/.test(nextBytes.toString())));
									//if(!shortBytes.equals(nextBytes)) {
									if (!(/[\x00-\x1F]/.test(nextBytes.toString()))) {
										isString = true;
									}
								} else {
									isString = true;
								}
							} else if (nextRead[0] == 'ri') {
								if (packet.remainingBytes() >= 4) {
									let intBytes = this.encodeShort(nextRead[1]);
									let nextBytes = packet.readBuffer(4);
									packet.position -= 4;

									//if(!intBytes.equals(nextBytes)) {
									if (!(/[\x00-\x1F]/.test(nextBytes.toString()))) {
										isString = true;
									}
								} else {
									isString = true;
								}
							} else if (nextRead[0] == 'rl') {
								if (packet.remainingBytes() >= 8) {
									let longBytes = this.encodeLong(nextRead[1]);
									let nextBytes = packet.readBuffer(8);
									packet.position -= 8;

									if(!longBytes.equals(nextBytes)) {
										isString = true;
									}
								} else {
									isString = true;
								}
							} else if (nextRead[0] == 'rb') {
								let nextBytes = packet.readBuffer(1);
								packet.position -= 1;

								if (nextBytes[0] != nextRead[1]) {
									isString = true;
								}
							}
						}

						if (isString) {
							packet.position -= 2;
							structure += '{s:' + packet.readString() + '}';
						} else {
							structure += '{u:' + short + '}';
						}
					break;
					case 'ri':
						console.log('TRYING TO READ32 FOR ' + packet.header + ', remaining:' + packet.remainingBytes(), 'structure:' + structure);
						let integer = packet.readInt();
						structure += '{i:' + integer + '}';
					break;
					case 'rl':
						console.log('TRYING TO READ64 FOR ' + packet.header + ', remaining:' + packet.remainingBytes(), 'structure:' + structure);
						let long = packet.readLong();
						structure += '{l:' + long + '}';
					break;
					case 'rb':
						let bool = packet.readBool();

						structure += bool ? '{b:True}' : '{b:False}';
					break;
				}

				if (packet.remainingBytes() > 0 && !nextRead) {
					return;
				}

				//console.log('STATE', structure, packet.remainingBytes());
			}

			if (packet.remainingBytes() > 0)
				return;

			while(j > 0) {
				this.readQueue.shift();
				j--;
			}

			this.incomingPacketQueue.shift();

			console.log(structure);
		}
	}

	encodeShort(value) {
		let buffer = Buffer.alloc(2);
		buffer.writeInt16BE(value);

		return buffer;
	}

	encodeInt(value) {
		let buffer = Buffer.alloc(4);
		buffer.writeInt32BE(value);

		return buffer;
	}

	encodeLong(value) {
		let buffer = Buffer.alloc(8);
		buffer.writeBigInt64BE(BigInt(value));

		return buffer;
	}

	sendToWindow(packet) {
		if (packet.isOutgoing()) {
			//this.packetloggerWindow.webContents.send('outgoingMessage', packet.getMessageBody(true), packet.header, packet.name, packet.structure);
		} else {
			//this.packetloggerWindow.webContents.send('incomingMessage', packet.getMessageBody(true), packet.header, packet.name, packet.structure);
		}
	}
}

module.exports = StructureHelper;

//{l}{u:4000}{s:0F7262175B662809629D7E58}{s:UNITY1}{i:0}{i:0}
/*
ws.4000
 ws.24
 ws.6
2 wi.0
 wi.44
 ws.207*/