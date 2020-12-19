const Logger = require('../../core/Logger');
const { shell } = require('electron');


var logger = new Logger();

window.onload = () => {
	$('#externalGithubButton').click(() => {
		shell.openExternal('https://github.com/Elbrah2020/ElectronLogger');
	});

	(async () => {
		logger.on('ready', () => {
			setStatusLabel('secondary', 'Ready ');

			$('#loadingInterface').fadeOut('slow', () => {
				$('#packetloggerInterface').fadeIn('slow');
			});
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