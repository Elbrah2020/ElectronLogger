const Logger = require('../../core/Logger');
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
		return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function() {
			if (inputFilter(this.value)) {
				this.oldValue = this.value;
				this.oldSelectionStart = this.selectionStart;
				this.oldSelectionEnd = this.selectionEnd;
			} else if (this.hasOwnProperty("oldValue")) {
				this.value = this.oldValue;
				this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
			} else {
				this.value = "";
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
		loadTab($(this).attr("target-menu"));
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

	(async () => {
		logger.on('ready', () => {
			setLoggerStatus('secondary', 'Ready');

			$('#loadingInterface').fadeOut('slow', () => {
				$('#packetloggerInterface').fadeIn('slow');
			});
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

	let actualLevel = statusLabel.attr("class").split(/\s+/).find(className => className.startsWith('bg-'));
	statusLabel.removeClass(actualLevel);
	statusLabel.addClass('bg-' + level);
	statusLabel.text(message);

	document.title = "ElectronLogger - " + message;
}

function setUpdateStatus(level, message) {
	let statusLabel = $('#packetLoggerUpdateState');

	let actualLevel = statusLabel.attr("class").split(/\s+/).find(className => className.startsWith('bg-'));
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

		$('#injectSendClientButton').prop("disabled", true);
		$('#injectSendServerButton').prop("disabled", true);
	} else {
		if (!corruptedButton.hasClass('btn-success')) {
			corruptedButton.removeClass('btn-danger');
			corruptedButton.addClass('btn-success');
			corruptedButton.text('✓');
		}

		$('#injectSendClientButton').prop("disabled", false);
		$('#injectSendServerButton').prop("disabled", false);
	}

	$('#injectLengthInput').val(length);
	$('#injectHeaderInput').val(header);
}