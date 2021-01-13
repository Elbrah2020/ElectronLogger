const Logger = require('../../core/Logger');
const HabboMessageBuilder = require('../../core/Protocol/HabboMessageBuilder');
const { shell, ipcRenderer } = require('electron');
const path = require('path');
const package = require(path.join(__dirname, '../../../package.json'));

var logger = new Logger();

var selectedTab = 'connectionTab';



window.onload = () => {
	//$('tbody').sortable();

	ipcRenderer.send('check_update');

	ipcRenderer.on('checking_for_update', () => {
		setUpdateStatus('primary', 'Checking for update..');
	});

	ipcRenderer.on('update_available', () => {
		setUpdateStatus('primary', 'Downloading update..');
	});

	ipcRenderer.on('update_not_available', () => {
		$('#packetLoggerUpdateState').addClass('hidden');
	});

	ipcRenderer.on('update_downloaded', () => {
		setUpdateStatus('success', 'Update downloaded, please restart me !');
	});

	ipcRenderer.on('error', () => {
		setUpdateStatus('danger', 'Error raised during auto-update');
	});

	$('#appVersion').text('v' + package.version);

	$.fn.inputFilter = function(inputFilter) {
		return this.on('input keydown keyup mousedown mouseup select contextmenu drop', function() {
			if (inputFilter(this.value)) {
				this.oldValue = this.value;
				this.oldSelectionStart = this.selectionStart;
				this.oldSelectionEnd = this.selectionEnd;
			} else if (this.hasOwnProperty('oldValue')) {
				this.value = this.oldValue;
				this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
			} else {
				this.value = '';
			}
		});
	};

	var input16bit = $('#16bitInput');
	var input16bytes = $('#16bitBytes');

	input16bit.inputFilter(value => {
		return /^-?\d*$/.test(value) && (value === '' || (parseInt(value) >= -32768 && parseInt(value) <= 32767));
	});

	input16bit.on('input', () => {
		let buffer = Buffer.alloc(2);
		buffer.writeInt16BE(parseInt(input16bit.val()));
		let bytes = logger.encodeBuffer(buffer);
		input16bytes.val(bytes);
	});

	input16bytes.on('input', () => {
		let buffer = logger.parseBuffer(input16bytes.val());
		if (buffer.length < 2) {
			input16bit.val(0);
		} else {
			input16bit.val(buffer.readInt16BE());
		}
	});

	var input32bit = $('#32bitInput');
	var input32bytes = $('#32bitBytes');

	input32bit.inputFilter(value => {
		return /^-?\d*$/.test(value) && (value === '' || (parseInt(value) >= -2147483648 && parseInt(value) <= 2147483647));
	});

	input32bit.on('input', () => {
		let buffer = Buffer.alloc(4);
		buffer.writeInt32BE(parseInt(input32bit.val()));
		let bytes = logger.encodeBuffer(buffer);
		input32bytes.val(bytes);
	});

	input32bytes.on('input', () => {
		let buffer = logger.parseBuffer(input32bytes.val());
		if (buffer.length < 4) {
			input32bit.val(0);
		} else {
			input32bit.val(buffer.readInt32BE());
		}
	});

	var input64bit = $('#64bitInput');
	var input64bytes = $('#64bitBytes');

	input64bit.inputFilter(value => {
		return /^-?\d*$/.test(value) && (value === '' || (BigInt(value) >= -9223372036854775808n && BigInt(value) <= 9223372036854775807n));
	});

	input64bit.on('input', () => {
		let buffer = Buffer.alloc(8);
		buffer.writeBigInt64BE(BigInt(input64bit.val()));
		let bytes = logger.encodeBuffer(buffer);
		input64bytes.val(bytes);
	});

	input64bytes.on('input', () => {
		let buffer = logger.parseBuffer(input64bytes.val());
		if (buffer.length < 8) {
			input64bit.val(0);
		} else {
			input64bit.val(buffer.readInt64BE());
		}
	});


	$('#externalGithubButton').click(() => {
		shell.openExternal('https://github.com/Elbrah2020/ElectronLogger');
	});

	$('#externalDiscordButton').click(() => {
		shell.openExternal('https://discord.gg/vGPVKtb5vT');
	});

	$('#startLoggingButton').click(async () => {
		await logger.startLogging();
		$('#startLoggingButton').addClass('hidden');
		$('#stopLoggingButton').removeClass('hidden');
		setLoggerStatus('primary', 'Waiting for connection..');
	});

	$('#stopLoggingButton').click(async () => {
		await logger.stopLogging();
		$('#stopLoggingButton').addClass('hidden');
		$('#startLoggingButton').removeClass('hidden');
		setLoggerStatus('secondary', 'Ready');
	});

	$('.menuLink').click(function () {
		loadTab($(this).attr('target-menu'));
	});

	$('#injectSendClientButton').click(() => {
		let packetData = $('.injectionTextarea').val();

		logger.sendToClient(packetData);
	});

	$('#injectSendServerButton').click(() => {
		let packetData = $('.injectionTextarea').val();

		logger.sendToServer(packetData);
	});

	$('.injectionTextarea').bind('input propertychange', function() {
		let buffer = logger.parseBuffer(this.value);

		if (buffer.length >= 6) {
			let packetLength = buffer.readInt32BE(0);
			let packetHeader = buffer.readInt16BE(4);

			if (buffer.length - 4 == packetLength) {
				setInjectionState(false, packetLength, packetHeader);
			} else {
				setInjectionState(true, packetLength, packetHeader);
			}
		} else {
			setInjectionState(true, 0, 0);
		}
	});

	var expertInjectionData = {
		id: 0,
		table: []
	};

	var expertInjectHeaderInput = $('#expertInjectHeaderInput');
	var expertInjectPacketOutput = $('#expertInjectPacketOutput');
	var expertInjectTypeInput = $('#expertInjectTypeInput');
	var expertInjectionWriteButton = $('#expertInjectionWriteButton');
	var expertInjectionValueInput = $('#expertInjectionValueInput');
	var expertInjectionTable = $('.table-expert-injection tbody');

	expertInjectHeaderInput.inputFilter(value => {
		return /^-?\d*$/.test(value) && (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 9999));
	});

	expertInjectionValueInput.inputFilter(value => {
		return false;
	});

	expertInjectHeaderInput.on('input', () => {
		expertInjectionData.id = parseInt(expertInjectHeaderInput.val());
		expertInjectRebuildOutput();
	});

	expertInjectTypeInput.on('change', () => {
		let type = expertInjectTypeInput.val();

		expertInjectionValueInput.off();

		switch(type) {
			case 'default':
				expertInjectionValueInput.val('');
				expertInjectionValueInput.inputFilter(value => {
					return false;
				});

				expertInjectionWriteButton.prop('disabled', true);
			break;
			default:
				if (type == 'string' || type == 'boolean') {
					expertInjectionValueInput.val('');
					expertInjectionValueInput.inputFilter(value => {
						return true;
					});
				} else if (type == 'short') {
					expertInjectionValueInput.val('0');
					expertInjectionValueInput.inputFilter(value => {
						return /^-?\d*$/.test(value) && (value === '' || (parseInt(value) >= -32768 && parseInt(value) <= 32767));
					});
				} else if (type == 'integer') {
					expertInjectionValueInput.val('0');
					expertInjectionValueInput.inputFilter(value => {
						return /^-?\d*$/.test(value) && (value === '' || (parseInt(value) >= -2147483648 && parseInt(value) <= 2147483647));
					});
				} else if (type == 'long') {
					expertInjectionValueInput.val('0');
					expertInjectionValueInput.inputFilter(value => {
						return /^-?\d*$/.test(value) && (value === '' || (BigInt(value) >= -9223372036854775808n && BigInt(value) <= 9223372036854775807n));
					});
				}
				expertInjectionWriteButton.prop('disabled', false);
			break;
		}
	});

	expertInjectionWriteButton.click(() => {
		let type = expertInjectTypeInput.val();
		let value = expertInjectionValueInput.val();
		let buffer;

		switch(type) {
			case 'boolean':
				if (value.toLowerCase().startsWith('t') || value.toLowerCase().startsWith('1')) {
					value = 'true';
				} else {
					value = 'false';
				}

				buffer = Buffer.from(String.fromCharCode(value == 'true'), 'binary');
			break;
			case 'string':
				let stringBuffer = Buffer.from(value, 'binary');
				let lengthBuffer = Buffer.alloc(2);
				lengthBuffer.writeInt16BE(stringBuffer.length, 0);

				buffer = Buffer.concat([lengthBuffer, stringBuffer]);
			break;
			case 'short':
				buffer = Buffer.alloc(2);
				buffer.writeInt16BE(parseInt(value), 0);
			break;
			case 'integer':
				buffer = Buffer.alloc(4);
				buffer.writeInt32BE(parseInt(value), 0);
			break;
			case 'long':
				buffer = Buffer.alloc(8);
				buffer.writeBigInt64BE(BigInt(value), 0);
			break;
		}

		let encoded = logger.encodeBuffer(buffer);

		expertInjectionData.table.push({ type: type, value: value, encoded: encoded });
		refreshExpertTableData();
		expertInjectRebuildOutput();
	});

	function refreshExpertTableData() {
		expertInjectionTable.empty();

		Object.keys(expertInjectionData.table).forEach(key => {
			let entry = expertInjectionData.table[key];

			let append = '<tr><td>' + (entry.type.charAt(0).toUpperCase() + entry.type.slice(1)) + '</td><td>' + entry.value + '</td><td>' + entry.encoded + '</td>';
			append += '<td data-key="' + key + '"><button type="button" class="btn btn-primary btn-sml" data-action="up" ' + (key == 0 ? 'disabled' : '') + '><i class="fas fa-arrow-up"></i></button>&nbsp;';
			append += '<button type="button" class="btn btn-primary btn-sml" data-action="down" ' + (key == expertInjectionData.table.length - 1 ? 'disabled' : '') + '><i class="fas fa-arrow-down"></i></button>&nbsp;';
			append += '<button type="button" class="btn btn-secondary btn-sml" data-action="edit" disabled><i class="fas fa-pen"></i></button>&nbsp;';
			append += '<button type="button" class="btn btn-danger btn-sml" data-action="remove"><i class="fas fa-times"></i></button></td></tr>';

			expertInjectionTable.append(append);
		});

		$('.table-expert-injection tbody button').click(function() {
			let elem = $(this);
			let action = elem.attr('data-action');
			let key = parseInt(elem.parent().attr('data-key'));

			switch(action) {
				case 'remove':
					expertInjectionData.table.splice(key, 1);
				break;
				case 'up':
					[expertInjectionData.table[key], expertInjectionData.table[key - 1]] = [expertInjectionData.table[key - 1], expertInjectionData.table[key]];
				break;
				case 'down':
					[expertInjectionData.table[key], expertInjectionData.table[key + 1]] = [expertInjectionData.table[key + 1], expertInjectionData.table[key]];
				break;
			}

			refreshExpertTableData();
			expertInjectRebuildOutput();
		});
	}

	function expertInjectRebuildOutput() {
		let outputMessage = new HabboMessageBuilder(expertInjectionData.id);

		expertInjectionData.table.forEach(injectData => {
			switch (injectData.type) {
				case 'boolean':
					outputMessage.appendBoolean(injectData.value == 'true');
				break;
				case 'string':
					outputMessage.appendString(injectData.value);
				break;
				case 'short':
					outputMessage.appendShort(parseInt(injectData.value));
				break;
				case 'integer':
					outputMessage.appendInt(parseInt(injectData.value));
				break;
				case 'long':
					outputMessage.appendLong(BigInt(injectData.value));
				break;
			}
		});

		expertInjectPacketOutput.val(logger.encodeBuffer(outputMessage.get()));
	}

	$('#expertInjectSendClientButton').click(() => {
		let packetData = expertInjectPacketOutput.val();

		logger.sendToClient(packetData);
	});

	$('#expertInjectSendServerButton').click(() => {
		let packetData = expertInjectPacketOutput.val();

		logger.sendToServer(packetData);
	});

	(async () => {
		logger.on('ready', () => {
			setLoggerStatus('secondary', 'Ready');

			$('#loadingInterface').fadeOut('slow', () => {
				$('#packetloggerInterface').fadeIn('slow');
			});

			populateToolsPacketData(logger.headersData);
		});

		logger.on('connected', () => {
			setLoggerStatus('success', 'Connected');
		});

		logger.on('disconnected', () => {
			setLoggerStatus('danger', 'Disconnected');
			$('#stopLoggingButton').addClass('hidden');
			$('#startLoggingButton').removeClass('hidden');
		});

		await logger.initialize();
	})();
}

function setLoggerStatus(level, message) {
	let statusLabel = $('#packetLoggerFooterState');

	let actualLevel = statusLabel.attr('class').split(/\s+/).find(className => className.startsWith('bg-'));
	statusLabel.removeClass(actualLevel);
	statusLabel.addClass('bg-' + level);
	statusLabel.text(message);

	document.title = 'ElectronLogger - ' + message;
}

function setUpdateStatus(level, message) {
	let statusLabel = $('#packetLoggerUpdateState');

	let actualLevel = statusLabel.attr('class').split(/\s+/).find(className => className.startsWith('bg-'));
	statusLabel.removeClass('hidden');
	statusLabel.removeClass(actualLevel);
	statusLabel.addClass('bg-' + level);
	statusLabel.text(message);
}

function loadTab(tabElement) {
	if (tabElement == selectedTab)
		return;
	$('#' + selectedTab).addClass('hidden');
	$('#' + tabElement).removeClass('hidden');
	selectedTab = tabElement;
}

function setInjectionState(isCorrupted, length, header) {
	let corruptedButton = $('#packetCorruptedButton');

	if (isCorrupted) {
		if (!corruptedButton.hasClass('btn-danger')) {
			corruptedButton.removeClass('btn-success');
			corruptedButton.addClass('btn-danger');
			corruptedButton.text('✗');
		}

		$('#injectSendClientButton').prop('disabled', true);
		$('#injectSendServerButton').prop('disabled', true);
	} else {
		if (!corruptedButton.hasClass('btn-success')) {
			corruptedButton.removeClass('btn-danger');
			corruptedButton.addClass('btn-success');
			corruptedButton.text('✓');
		}

		$('#injectSendClientButton').prop('disabled', false);
		$('#injectSendServerButton').prop('disabled', false);
	}

	$('#injectLengthInput').val(length);
	$('#injectHeaderInput').val(header);
}

function populateToolsPacketData(packetHeaders) {
	let incomingTable = $('#table-tools-incoming > tbody');
	let outgoingTable = $('#table-tools-outgoing > tbody');

	Object.keys(packetHeaders.incoming).forEach(key => {
		incomingTable.append('<tr><td>' + packetHeaders.incoming[key] + '&nbsp;<button type="button" class="btn btn-secondary clipboard-write btn-sml" data-clipboard="' + packetHeaders.incoming[key] + '"><i class="far fa-copy"></i></button></td><td>' + key + '&nbsp;<button type="button" class="btn btn-secondary clipboard-write btn-sml" data-clipboard="' + key + '"><i class="far fa-copy"></i></button></td></tr>');
	});

	Object.keys(packetHeaders.outgoing).forEach(key => {
		outgoingTable.append('<tr><td>' + packetHeaders.outgoing[key] + '&nbsp;<button type="button" class="btn btn-secondary clipboard-write btn-sml" data-clipboard="' + packetHeaders.outgoing[key] + '"><i class="far fa-copy"></i></button></td><td>' + key + '&nbsp;<button type="button" class="btn btn-secondary clipboard-write btn-sml" data-clipboard="' + key + '"><i class="far fa-copy"></i></button></td></tr>');
	});

	$('.clipboard-write').click(function() {
		navigator.clipboard.writeText($(this).attr('data-clipboard')).then(function() {

		}, function() {

		});
	});
}