const Logger = require('../../core/Logger');
const { shell } = require('electron');
const path = require('path');
const package = require(path.join(__dirname, '../../../package.json'));

var logger = new Logger();

var selectedTab = 'connectionTab';

window.onload = () => {
	$('#appVersion').text('v' + package.version);

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
		setStatusLabel('primary', 'Waiting for connection..');
	});

	$('#stopLoggingButton').click(async () => {
		await logger.stopLogging();
		$('#stopLoggingButton').addClass('hidden');
		$('#startLoggingButton').removeClass('hidden');
		setStatusLabel('secondary', 'Ready');
	});

	$('#connectionTabButton').click(() => {
		loadTab('connectionTab');
	});

	$('#injectionTabButton').click(() => {
		loadTab('injectionTab');
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
		let buffer = logger.parsePacket(this.value);

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
			setStatusLabel('secondary', 'Ready');

			$('#loadingInterface').fadeOut('slow', () => {
				$('#packetloggerInterface').fadeIn('slow');
			});
		});

		logger.on('connected', () => {
			setStatusLabel('success', 'Connected');
		});

		await logger.initialize();
	})();
}

function setStatusLabel(level, message) {
	let statusLabel = $('#packetLoggerFooterState');

	let actualLevel = statusLabel.attr("class").split(/\s+/).find(className => className.startsWith('bg-'));
	statusLabel.removeClass(actualLevel);
	statusLabel.addClass('bg-' + level);
	statusLabel.text(message);

	document.title = "ElectronLogger - " + message;
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