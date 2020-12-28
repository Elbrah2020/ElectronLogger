const ipcRenderer = require('electron').ipcRenderer;

var incomingLogging = true;
var outgoingLogging = true;
var autoscrollEnabled = true;

refreshTitle();

ipcRenderer.on('triggerIncomingLogging', () => {
	incomingLogging = !incomingLogging;
	refreshTitle();
});

ipcRenderer.on('triggerOutgoingLogging', () => {
	outgoingLogging = !outgoingLogging;
	refreshTitle();
});

ipcRenderer.on('triggerAutoscroll', () => {
	autoscrollEnabled = !autoscrollEnabled;
	refreshTitle();
});

ipcRenderer.on('clearLogs', () => {
	$('#console').empty();
});

ipcRenderer.on('incomingMessage', (event, message, header, packetName) => {
	if (!incomingLogging)
		return;

	let append = '<span class="red">Incoming[</span>';
	if (packetName) {
		append += '<span class="cyan">' + packetName + '</span>&nbsp;<span class="gray">/</span>&nbsp;';
	}
	append += '<span class="green">' + header + '</span><span class="red">]</span>&nbsp;<span class="gray">-></span>&nbsp;<span class="yellow">' + htmlEntities(message) + '</span><br/>';
	$('#console').append(append);
	scrollToBottom();
});

ipcRenderer.on('outgoingMessage', (event, message, header, packetName) => {
	if (!outgoingLogging)
		return;

	let append = '<span class="blue">Outgoing[</span>';
	if (packetName) {
		append += '<span class="cyan">' + packetName + '</span>&nbsp;<span class="gray">/</span>&nbsp;';
	}
	append += '<span class="green">' + header + '</span><span class="blue">]</span>&nbsp;<span class="gray">-></span>&nbsp;<span class="yellow">' + htmlEntities(message) + '</span><br/>';
	$('#console').append(append);
	scrollToBottom();
});

function scrollToBottom() {
	if (!autoscrollEnabled)
		return;

	var consoleElem = document.getElementById('console');
	consoleElem.scrollTop = consoleElem.scrollHeight;
}

function htmlEntities(str) {
	return str.replace(/[\u00A0-\u9999<>\&]/gim, i => {
			return '&#' + i.charCodeAt(0) + ';';
	});
}

function refreshTitle() {
	document.title = 'ElectronLogger - Packetlogger | INCOMING: ' + (incomingLogging ? 'ON': 'OFF') + ' | OUTGOING: ' + (outgoingLogging ? 'ON' : 'OFF') + ' | AUTOSCROLL: ' + (autoscrollEnabled ? 'ON': 'OFF');
}