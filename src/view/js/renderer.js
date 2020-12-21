const Logger = require('../../core/Logger');
const { shell } = require('electron');

var logger = new Logger();

var selectedTab = 'connectionTab';

window.onload = () => {
	$('#externalGithubButton').click(() => {
		shell.openExternal('https://github.com/Elbrah2020/ElectronLogger');
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